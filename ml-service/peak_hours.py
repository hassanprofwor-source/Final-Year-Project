from datetime import datetime, timedelta
import json
import os
import random

import joblib
import numpy as np
import pandas as pd
from pymongo import MongoClient

from config import (
    MIN_REAL_ORDERS,
    MIN_TRAIN_DAYS,
    MODEL_DIR,
    SERVICE_HOURS,
    TRAIN_WINDOW_DAYS,
    WEEKDAYS,
    detect_service_hours,
    format_hour_label,
    now_local,
    to_local_naive,
)
from evaluation import (
    append_history,
    drift_report,
    promotion_decision,
    regression_metrics,
)
from features import (
    FEATURE_COLUMNS,
    build_forecast_frame,
    build_training_frame,
    describe_drivers,
    feature_matrix,
    hourly_grid,
    target_vector,
)
from model_training import (
    evaluate,
    feature_importances,
    train_peak_hours_model,
    tree_quantiles,
)

MODEL_PATH = MODEL_DIR / "peak_hours.joblib"
META_PATH = MODEL_DIR / "peak_hours_meta.json"

ACTUALS_WINDOW_DAYS = int(os.getenv("ACTUALS_WINDOW_DAYS", "28"))
FORECAST_HORIZON_DAYS = 7
DRIFT_WINDOW_DAYS = 7

# The trading window is detected at training time and pinned to the saved model
# so that predictions and the admin chart always share one hour axis.
_active_hours = list(SERVICE_HOURS)


def active_hours():
    return list(_active_hours)


def set_active_hours(hours):
    global _active_hours
    cleaned = [int(hour) for hour in hours or [] if 0 <= int(hour) <= 23]
    if cleaned:
        _active_hours = cleaned
    return list(_active_hours)


def get_collection():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME", "Skyplate")
    if not uri:
        raise RuntimeError("MONGO_URI is not set")
    # tz_aware matters: without it pymongo hands back naive datetimes, and the
    # local-time conversion downstream sees no tzinfo and passes them through
    # untouched. Every order then lands in its UTC hour instead of its London
    # hour, which silently shifts the whole service window during BST.
    client = MongoClient(uri, serverSelectionTimeoutMS=15000, tz_aware=True)
    return client[db_name]["orders"]


def as_naive(value):
    return to_local_naive(value)


def parse_order_datetime(doc):
    created = doc.get("createdAt")
    if isinstance(created, datetime):
        return to_local_naive(created)
    date_str = doc.get("date")
    time_str = doc.get("time") or "12:00"
    if date_str:
        for fmt in ("%d-%m-%Y %H:%M", "%Y-%m-%d %H:%M"):
            try:
                return datetime.strptime(f"{date_str} {time_str}", fmt)
            except ValueError:
                continue
    return None


def load_order_datetimes():
    collection = get_collection()
    timestamps = []
    for doc in collection.find({}, {"createdAt": 1, "date": 1, "time": 1}):
        parsed = parse_order_datetime(doc)
        if parsed is not None:
            timestamps.append(parsed)
    return timestamps


def generate_synthetic_timestamps(days=120):
    timestamps = []
    today = now_local().replace(hour=0, minute=0, second=0, microsecond=0)
    for day_offset in range(days):
        day = today - timedelta(days=day_offset)
        lunch = random.randint(8, 18)
        dinner = random.randint(12, 24)
        for _ in range(lunch):
            hour = random.choice([12, 13, 14])
            timestamps.append(day.replace(hour=hour, minute=random.randint(0, 59)))
        for _ in range(dinner):
            hour = random.choice([18, 19, 20, 21])
            timestamps.append(day.replace(hour=hour, minute=random.randint(0, 59)))
        if day.weekday() >= 5:
            for _ in range(random.randint(6, 12)):
                hour = random.choice([13, 19, 20])
                timestamps.append(day.replace(hour=hour, minute=random.randint(0, 59)))
    return timestamps


def within_window(timestamps, days):
    if not days or not timestamps:
        return list(timestamps)
    cutoff = now_local() - timedelta(days=days)
    return [stamp for stamp in timestamps if stamp >= cutoff]


def distinct_days(timestamps):
    return len({stamp.date() for stamp in timestamps or []})


def complete_days_only(timestamps):
    """Drop the current day, which is still in progress.

    Training on a partial day teaches the model that today is unusually quiet.
    """
    today = now_local().date()
    return [stamp for stamp in timestamps if stamp.date() < today]


def data_coverage(timestamps, recent_days=7):
    """Order volume in the last week against the weeks before it.

    A sharp fall usually means orders stopped reaching the database rather than
    demand collapsing, and it invalidates both the holdout metric and the
    forecast, so it is reported instead of being quietly absorbed.
    """
    if not timestamps:
        return {
            "lastOrderAt": None,
            "daysSinceLastOrder": None,
            "recentDailyMean": 0.0,
            "priorDailyMean": 0.0,
            "stalled": False,
            "message": "No orders available.",
        }

    latest = max(timestamps)
    today = now_local().date()
    cutoff = latest - timedelta(days=recent_days)

    recent = [stamp for stamp in timestamps if stamp > cutoff]
    prior = [stamp for stamp in timestamps if stamp <= cutoff]
    prior_days = max(1, distinct_days(prior))

    recent_mean = len(recent) / float(recent_days)
    prior_mean = len(prior) / float(prior_days)
    stalled = prior_mean > 1 and recent_mean < prior_mean * 0.25

    message = (
        f"Order volume in the last {recent_days} days averages "
        f"{recent_mean:.1f} per day against {prior_mean:.1f} before that. "
        "Accuracy figures and forecasts are unreliable until this recovers — "
        "check that orders are still reaching the database."
        if stalled
        else f"Orders are arriving at about {recent_mean:.1f} per day."
    )

    return {
        "lastOrderAt": latest.isoformat(timespec="seconds"),
        "daysSinceLastOrder": (today - latest.date()).days,
        "recentDailyMean": round(recent_mean, 2),
        "priorDailyMean": round(prior_mean, 2),
        "stalled": bool(stalled),
        "message": message,
    }


def collect_training_data():
    load_error = None
    used_synthetic = False
    try:
        timestamps = load_order_datetimes()
    except Exception as error:
        timestamps = []
        used_synthetic = True
        load_error = str(error)

    real_count = len(timestamps)
    coverage = data_coverage(timestamps)
    windowed = complete_days_only(within_window(timestamps, TRAIN_WINDOW_DAYS))

    if real_count < MIN_REAL_ORDERS or distinct_days(windowed) < MIN_TRAIN_DAYS:
        windowed = generate_synthetic_timestamps()
        used_synthetic = True

    return {
        "timestamps": windowed,
        "used_synthetic": used_synthetic,
        "real_count": real_count,
        "load_error": load_error,
        "coverage": coverage,
    }


def empty_week(hours=None):
    width = len(hours if hours is not None else active_hours())
    return {name: [0.0] * width for name in WEEKDAYS}


def forecast_dates(reference=None):
    today = (reference or now_local()).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return [pd.Timestamp(today) + pd.Timedelta(days=offset)
            for offset in range(FORECAST_HORIZON_DAYS)]


def forecast_week(model, timestamps, hours=None):
    """Forecast the coming seven calendar days, keyed by weekday name.

    The response keeps its original weekday-keyed shape, but each weekday now
    refers to the upcoming occurrence of that day rather than a generic average,
    which is what makes the lag and rolling features meaningful.
    """
    hours = list(hours if hours is not None else active_hours())
    blank = {
        "predictions": empty_week(hours),
        "lower": empty_week(hours),
        "upper": empty_week(hours),
        "dates": {},
        "drivers": {},
    }
    if model is None or not timestamps:
        return blank

    targets = forecast_dates()
    frame = build_forecast_frame(timestamps, targets, hours=hours)
    if frame.empty:
        return blank

    X = feature_matrix(frame)
    bands = tree_quantiles(model, X, quantiles=(10, 50, 90))
    importances = feature_importances(model, FEATURE_COLUMNS)

    predictions = empty_week(hours)
    lower = empty_week(hours)
    upper = empty_week(hours)
    dates = {}
    drivers = {}
    hour_index = {hour: index for index, hour in enumerate(hours)}

    for position, row in enumerate(frame.itertuples(index=False)):
        weekday = WEEKDAYS[int(row.date.weekday())]
        index = hour_index.get(int(row.hour))
        if index is None:
            continue
        predictions[weekday][index] = _positive(bands[50][position])
        lower[weekday][index] = _positive(bands[10][position])
        upper[weekday][index] = _positive(bands[90][position])
        dates[weekday] = row.date.strftime("%Y-%m-%d")

    for weekday in WEEKDAYS:
        values = predictions[weekday]
        if not any(values):
            continue
        peak_index = int(np.argmax(values))
        peak_hour = hours[peak_index]
        matching = frame[
            (frame["hour"] == peak_hour)
            & (frame["date"].dt.weekday == WEEKDAYS.index(weekday))
        ]
        if matching.empty:
            continue
        drivers[weekday] = describe_drivers(
            matching.iloc[0].to_dict(), importances, limit=2, weekday_name=weekday
        )

    return {
        "predictions": predictions,
        "lower": lower,
        "upper": upper,
        "dates": dates,
        "drivers": drivers,
    }


def predict_week(model, timestamps=None):
    if timestamps is None:
        timestamps, _error = load_live_orders()
    return forecast_week(model, timestamps)["predictions"]


def _positive(value):
    return max(0.0, round(float(value), 2))


def live_actuals(timestamps, window_days=ACTUALS_WINDOW_DAYS, hours=None):
    """Average orders per weekday and hour over the recent window.

    Averaging over the zero-filled grid rather than only the hours that had
    orders keeps quiet hours in the denominator, so the bars are a true average.
    """
    hours = list(hours if hours is not None else active_hours())
    actuals = empty_week(hours)
    windowed = within_window(timestamps, window_days)
    grid = hourly_grid(windowed, hours=hours)
    if grid.empty:
        return actuals

    grid = grid.copy()
    grid["weekday"] = grid["date"].dt.weekday
    averages = grid.groupby(["weekday", "hour"], as_index=False)["order_count"].mean()
    hour_index = {hour: index for index, hour in enumerate(hours)}

    for row in averages.itertuples(index=False):
        weekday = int(row.weekday)
        index = hour_index.get(int(row.hour))
        if index is None or weekday > 6:
            continue
        actuals[WEEKDAYS[weekday]][index] = round(float(row.order_count), 2)

    return actuals


def load_live_orders():
    try:
        return load_order_datetimes(), None
    except Exception as error:
        return [], str(error)


def live_accuracy(model, timestamps, days=DRIFT_WINDOW_DAYS, hours=None):
    """Backtest the trailing week using only backward-looking features.

    The current day is dropped for the same reason training drops it: its later
    hours have not happened yet, so scoring a full-evening prediction against a
    half-filled evening reports drift that is really just the clock.
    """
    if model is None or not timestamps:
        return None
    timestamps = complete_days_only(timestamps)
    if not timestamps:
        return None
    frame = build_training_frame(
        timestamps, hours=hours if hours is not None else active_hours()
    )
    if frame.empty:
        return None

    cutoff = frame["date"].max() - pd.Timedelta(days=days - 1)
    recent = frame[frame["date"] >= cutoff]
    if recent.empty:
        return None

    try:
        predictions = model.predict(feature_matrix(recent))
    except Exception:
        return None
    return regression_metrics(target_vector(recent), predictions)


def busiest_slot(week_values, hours=None):
    hours = list(hours if hours is not None else active_hours())
    best = None
    for weekday, values in week_values.items():
        for index, hour in enumerate(hours):
            value = values[index] if index < len(values) else 0
            if best is None or value > best["orders"]:
                best = {"weekday": weekday, "hour": hour, "orders": float(value)}
    return best or {"weekday": WEEKDAYS[0], "hour": hours[0], "orders": 0.0}


def busy_window(values, hours=None):
    hours = list(hours if hours is not None else active_hours())
    window = 3
    if len(values) < window:
        return f"{hours[0]:02d}:00–{hours[-1]:02d}:00"

    best_start = 0
    best_sum = -1.0
    for index in range(len(values) - window + 1):
        total = float(sum(values[index : index + window]))
        if total > best_sum:
            best_sum = total
            best_start = index
    start = hours[best_start]
    end = hours[best_start + window - 1]
    return f"{start:02d}:00–{end:02d}:00"


def today_hour_count(timestamps, hour):
    today = now_local().date()
    return sum(
        1 for stamp in timestamps or [] if stamp.date() == today and stamp.hour == hour
    )


def build_insights(actuals, forecast, timestamps=None, hours=None):
    hours = list(hours if hours is not None else active_hours())
    now = now_local()
    today_name = WEEKDAYS[now.weekday()]
    predictions = forecast.get("predictions") or empty_week(hours)
    pred_today = predictions.get(today_name) or [0.0] * len(hours)
    actual_today = actuals.get(today_name) or [0.0] * len(hours)

    peak_index = int(np.argmax(pred_today)) if any(pred_today) else 0
    peak_hour = hours[peak_index]
    expected = round(float(pred_today[peak_index]), 2) if pred_today else 0.0
    peak_label = format_hour_label(peak_hour)
    overall = busiest_slot(predictions, hours)
    today_count = today_hour_count(timestamps, peak_hour)
    actual_at_peak = (
        float(actual_today[peak_index]) if peak_index < len(actual_today) else 0.0
    )
    compare_value = today_count if timestamps else actual_at_peak

    if now.hour < peak_hour:
        vs_expected = (
            f"Typical peak is still ahead at {peak_label} — about {expected} orders."
        )
    elif expected <= 0:
        vs_expected = "Not enough typical data to compare today's peak yet."
    elif compare_value > expected * 1.1:
        vs_expected = f"Today's {peak_label} is running above the model's usual level."
    elif compare_value < expected * 0.9:
        vs_expected = f"Today's {peak_label} is quieter than the model usually expects."
    else:
        vs_expected = f"Today's {peak_label} is in line with the usual pattern."

    drivers = (forecast.get("drivers") or {}).get(today_name) or []
    lower = (forecast.get("lower") or {}).get(today_name) or []
    upper = (forecast.get("upper") or {}).get(today_name) or []
    band = None
    if peak_index < len(lower) and peak_index < len(upper):
        band = {
            "low": round(float(lower[peak_index]), 2),
            "high": round(float(upper[peak_index]), 2),
        }

    return {
        "headline": (
            f"{overall['weekday']} around {format_hour_label(overall['hour'])} "
            "is usually the busiest."
        ),
        "todayPeak": {
            "weekday": today_name,
            "hour": peak_hour,
            "label": peak_label,
            "expectedOrders": expected,
            "range": band,
        },
        "nextBusyWindow": busy_window(pred_today, hours),
        "vsExpected": vs_expected,
        "why": _driver_sentence(peak_label, expected, drivers),
        "drivers": drivers,
    }


def _driver_sentence(peak_label, expected, drivers):
    if not drivers:
        return None
    joined = " and ".join(drivers)
    return f"Expecting about {expected} orders at {peak_label} because {joined}."


def compat_metrics(metrics):
    """Flatten holdout metrics into the `mae`/`r2` keys the admin UI reads."""
    if not isinstance(metrics, dict):
        return metrics
    preferred = (
        metrics.get("test") or metrics.get("validation") or metrics.get("train") or {}
    )
    flattened = dict(metrics)
    flattened["mae"] = preferred.get("mae")
    flattened["rmse"] = preferred.get("rmse")
    flattened["r2"] = preferred.get("r2")
    return flattened


def train_and_save():
    data = collect_training_data()
    timestamps = data["timestamps"]
    hours = set_active_hours(detect_service_hours(timestamps))
    frame = build_training_frame(timestamps, hours=hours)
    result = train_peak_hours_model(frame)

    champion_model, champion_meta = load_saved_model()
    champion_metrics = _champion_test_metrics(
        champion_model, champion_meta, result.get("testFrame")
    )
    decision = promotion_decision(result["metrics"].get("test"), champion_metrics)

    challenger_metrics = compat_metrics(
        {
            **result["metrics"],
            "trainRows": result["rows"]["train"],
            "rows": result["rows"],
            "bestParams": result["params"],
            "splitApplied": result["splitApplied"],
            "trainWindowDays": TRAIN_WINDOW_DAYS,
            "featureCount": len(FEATURE_COLUMNS),
        }
    )

    attempt = {
        "at": now_local().isoformat(timespec="seconds"),
        "metrics": challenger_metrics,
        "promoted": bool(decision["promote"]),
        "reason": decision["reason"],
        "days": result["days"],
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if not decision["promote"] and champion_model is not None:
        meta = dict(champion_meta or {})
        meta["lastAttempt"] = attempt
        meta["history"] = append_history(meta.get("history"), attempt)
        meta["promotion"] = decision
        meta["coverage"] = data["coverage"]
        set_active_hours(meta.get("hours") or hours)
        META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
        return champion_model, meta

    model = result["model"]
    if model is None:
        return champion_model, champion_meta

    joblib.dump(model, MODEL_PATH)
    meta = {
        "usedSynthetic": data["used_synthetic"],
        "sampleSize": int(len(timestamps)),
        "realOrderCount": int(data["real_count"]),
        "loadError": data["load_error"],
        "trainedAt": now_local().isoformat(timespec="seconds"),
        "metrics": challenger_metrics,
        "featureColumns": FEATURE_COLUMNS,
        "featureImportances": [
            {"feature": name, "weight": round(weight, 4)}
            for name, weight in feature_importances(model, FEATURE_COLUMNS)
        ],
        "hyperparameters": result["params"],
        "search": result["search"],
        "promotion": decision,
        "lastAttempt": attempt,
        "history": append_history((champion_meta or {}).get("history"), attempt),
        "coverage": data["coverage"],
        "hours": hours,
        "weekdays": WEEKDAYS,
    }
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return model, meta


def _champion_test_metrics(champion_model, champion_meta, test_frame):
    """Score the live model on the new holdout so the comparison is like-for-like.

    Falls back to the champion's recorded metric when its feature schema no
    longer matches, which happens whenever the feature set changes.
    """
    if champion_model is None or test_frame is None or test_frame.empty:
        return ((champion_meta or {}).get("metrics") or {}).get("test")

    expected = (champion_meta or {}).get("featureColumns")
    if expected != FEATURE_COLUMNS:
        return None

    try:
        return evaluate(champion_model, test_frame)
    except Exception:
        return None


def load_saved_model():
    if not MODEL_PATH.exists() or not META_PATH.exists():
        return None, None
    try:
        model = joblib.load(MODEL_PATH)
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None, None

    # The saved model's feature layout is tied to its hour axis.
    set_active_hours(meta.get("hours"))
    return model, meta


def analytics_payload(model, meta):
    hours = set_active_hours((meta or {}).get("hours") or active_hours())
    timestamps, load_error = load_live_orders()
    actuals = live_actuals(timestamps, hours=hours)
    forecast = forecast_week(model, timestamps, hours=hours)
    trained_synthetic = bool(meta.get("usedSynthetic")) if meta else False
    metrics = (meta or {}).get("metrics")
    baseline = metrics.get("test") if isinstance(metrics, dict) else None

    return {
        "hours": hours,
        "weekdays": WEEKDAYS,
        "actuals": actuals,
        "predictions": forecast["predictions"],
        "predictionsLower": forecast["lower"],
        "predictionsUpper": forecast["upper"],
        "predictionDates": forecast["dates"],
        "predictionDrivers": forecast["drivers"],
        "actualsWindowDays": ACTUALS_WINDOW_DAYS,
        "usedSynthetic": trained_synthetic,
        "sampleSize": int(len(timestamps)),
        "realOrderCount": int(len(timestamps)),
        "trainedSampleSize": None if meta is None else meta.get("sampleSize"),
        "loadError": load_error,
        "trainedAt": None if meta is None else meta.get("trainedAt"),
        "metrics": metrics,
        "featureImportances": None if meta is None else meta.get("featureImportances"),
        "hyperparameters": None if meta is None else meta.get("hyperparameters"),
        "promotion": None if meta is None else meta.get("promotion"),
        "coverage": data_coverage(timestamps),
        "drift": drift_report(
            live_accuracy(model, timestamps, hours=hours), baseline
        ),
        "source": "flask-live",
        "insights": build_insights(actuals, forecast, timestamps, hours),
    }
