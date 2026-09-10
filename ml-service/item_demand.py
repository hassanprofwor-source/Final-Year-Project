import json

import joblib
import numpy as np
import pandas as pd

from config import MODEL_DIR, WEEKDAYS, now_local
from evaluation import promotion_decision, regression_metrics
from features import add_calendar_features, add_history_features
from model_training import (
    FALLBACK_PARAMS,
    chronological_split,
    concat_frames,
    fit_forest,
    tree_quantiles,
    tune_hyperparameters,
)

MODEL_PATH = MODEL_DIR / "item_demand.joblib"
META_PATH = MODEL_DIR / "item_demand_meta.json"

HORIZON_DAYS = 7
MIN_ITEM_DAYS = 21
MAX_FORECAST_ITEMS = 12

ITEM_FEATURE_COLUMNS = [
    "weekday_sin",
    "weekday_cos",
    "is_weekend",
    "month",
    "lag_1w",
    "lag_2w",
    "rolling_7d_mean",
    "rolling_28d_mean",
    "wow_momentum",
    "item_share_28d",
]

TARGET_COLUMN = "units"


def daily_item_grid(rows):
    """Units per (item, day) with unsold days filled as zero.

    An item's quiet days carry as much signal as its busy ones. The grid starts
    at each item's first recorded sale rather than the global start date, so a
    dish added last week is not credited with months of zero sales.
    """
    if not rows:
        return pd.DataFrame(columns=["name", "date", TARGET_COLUMN])

    frame = pd.DataFrame(
        [
            {
                "name": row["name"],
                "date": pd.Timestamp(row["timestamp"]).normalize(),
                TARGET_COLUMN: float(row["quantity"]),
            }
            for row in rows
        ]
    )
    totals = frame.groupby(["name", "date"], as_index=False)[TARGET_COLUMN].sum()
    last_date = totals["date"].max()

    spans = []
    for name, group in totals.groupby("name"):
        dates = pd.date_range(group["date"].min(), last_date, freq="D")
        spans.append(pd.DataFrame({"name": name, "date": dates}))

    grid = pd.concat(spans, ignore_index=True)
    grid = grid.merge(totals, on=["name", "date"], how="left")
    grid[TARGET_COLUMN] = grid[TARGET_COLUMN].fillna(0.0).astype(float)
    return grid.sort_values(["name", "date"]).reset_index(drop=True)


def add_item_share(frame):
    """Each item's share of trailing 28-day volume.

    This is what lets one shared forest serve every item: the share and the
    item's own lag features identify it, so there is no categorical item id
    implying a false ordering between dishes.
    """
    frame = frame.sort_values(["date", "name"]).copy()
    daily_total = frame.groupby("date")[TARGET_COLUMN].transform("sum")
    frame["_daily_total"] = daily_total

    frame = frame.sort_values(["name", "date"])
    grouped = frame.groupby("name", sort=False)
    item_trailing = grouped[TARGET_COLUMN].transform(
        lambda values: values.shift(1).rolling(28, min_periods=7).sum()
    )
    total_trailing = grouped["_daily_total"].transform(
        lambda values: values.shift(1).rolling(28, min_periods=7).sum()
    )

    share = item_trailing / total_trailing.replace(0.0, np.nan)
    frame["item_share_28d"] = (
        share.replace([np.inf, -np.inf], np.nan).fillna(0.0).clip(0.0, 1.0)
    )
    return frame.drop(columns=["_daily_total"])


def build_item_frame(rows):
    grid = daily_item_grid(rows)
    if grid.empty:
        return pd.DataFrame(columns=["name", "date"] + ITEM_FEATURE_COLUMNS + [TARGET_COLUMN])

    frame = add_calendar_features(grid)
    frame = add_history_features(
        frame, target_column=TARGET_COLUMN, group_columns=("name",)
    )
    frame = add_item_share(frame)
    frame = frame.dropna(subset=ITEM_FEATURE_COLUMNS)
    return frame.sort_values(["date", "name"]).reset_index(drop=True)


def _matrix(frame):
    return np.asarray(frame[ITEM_FEATURE_COLUMNS], dtype=float)


def _target(frame):
    return np.asarray(frame[TARGET_COLUMN], dtype=float)


def _fit(frame, params):
    ordered = frame.sort_values(["date", "name"])
    return fit_forest(_matrix(ordered), _target(ordered), params)


def _evaluate(model, frame):
    if model is None or frame is None or frame.empty:
        return None
    return regression_metrics(_target(frame), model.predict(_matrix(frame)))


def train_item_demand(rows):
    frame = build_item_frame(rows)
    day_count = len(frame["date"].unique()) if not frame.empty else 0

    if frame.empty or day_count < MIN_ITEM_DAYS:
        return {
            "model": None,
            "frame": frame,
            "metrics": {"train": None, "validation": None, "test": None},
            "params": dict(FALLBACK_PARAMS),
            "days": int(day_count),
            "splitApplied": False,
            "reason": "Not enough item history to train a demand model yet.",
        }

    train_frame, val_frame, test_frame = chronological_split(frame)
    tuning_frame = concat_frames(train_frame, val_frame)

    params, _search = tune_hyperparameters(
        _matrix(tuning_frame), _target(tuning_frame)
    )
    validation_model = _fit(train_frame, params)
    validation_metrics = _evaluate(validation_model, val_frame)

    model = _fit(tuning_frame, params)

    return {
        "model": model,
        "frame": frame,
        "metrics": {
            "train": _evaluate(model, tuning_frame),
            "validation": validation_metrics,
            "test": _evaluate(model, test_frame),
        },
        "params": params,
        "days": int(day_count),
        "splitApplied": True,
        "reason": None,
        "testFrame": test_frame,
    }


def forecast_items(model, frame, horizon_days=HORIZON_DAYS, limit=MAX_FORECAST_ITEMS):
    """Expected units per item for the next `horizon_days` days.

    Rolling features are frozen at each item's latest observed day rather than
    fed forward from predictions, which keeps a single bad day from compounding
    across the week.
    """
    if model is None or frame.empty:
        return []

    latest = frame.sort_values("date").groupby("name", sort=False).tail(1)
    if latest.empty:
        return []

    start = pd.Timestamp(now_local().date())
    horizon = [start + pd.Timedelta(days=offset) for offset in range(horizon_days)]

    carried = [
        "lag_1w",
        "lag_2w",
        "rolling_7d_mean",
        "rolling_28d_mean",
        "wow_momentum",
        "item_share_28d",
    ]
    rows = []
    for _index, record in latest.iterrows():
        for date in horizon:
            row = {"name": record["name"], "date": date}
            row.update({column: float(record[column]) for column in carried})
            rows.append(row)

    horizon_frame = add_calendar_features(pd.DataFrame(rows))
    X = _matrix(horizon_frame)
    bands = tree_quantiles(model, X, quantiles=(10, 50, 90))
    horizon_frame["p50"] = np.maximum(0.0, bands[50])
    horizon_frame["p10"] = np.maximum(0.0, bands[10])
    horizon_frame["p90"] = np.maximum(0.0, bands[90])

    forecasts = []
    for name, group in horizon_frame.groupby("name"):
        group = group.sort_values("date")
        forecasts.append(
            {
                "name": name,
                "next7Days": int(round(float(group["p50"].sum()))),
                "low": int(round(float(group["p10"].sum()))),
                "high": int(round(float(group["p90"].sum()))),
                "perDay": [
                    {
                        "date": row.date.strftime("%Y-%m-%d"),
                        "weekday": WEEKDAYS[int(row.date.weekday())],
                        "units": round(float(row.p50), 1),
                    }
                    for row in group.itertuples(index=False)
                ],
            }
        )

    forecasts.sort(key=lambda entry: entry["next7Days"], reverse=True)
    return forecasts[:limit]


def train_and_save(rows):
    result = train_item_demand(rows)
    model = result["model"]
    if model is None:
        return None, {
            "trainedAt": now_local().isoformat(timespec="seconds"),
            "ready": False,
            "reason": result["reason"],
            "metrics": result["metrics"],
        }

    champion_model, champion_meta = load_saved_model()
    champion_metrics = None
    if champion_model is not None and (champion_meta or {}).get(
        "featureColumns"
    ) == ITEM_FEATURE_COLUMNS:
        champion_metrics = _evaluate(champion_model, result.get("testFrame"))

    decision = promotion_decision(result["metrics"].get("test"), champion_metrics)

    if not decision["promote"] and champion_model is not None:
        meta = dict(champion_meta or {})
        meta["promotion"] = decision
        META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
        return champion_model, meta

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    meta = {
        "ready": True,
        "trainedAt": now_local().isoformat(timespec="seconds"),
        "metrics": result["metrics"],
        "hyperparameters": result["params"],
        "featureColumns": ITEM_FEATURE_COLUMNS,
        "featureImportances": [
            {"feature": name, "weight": round(float(weight), 4)}
            for name, weight in sorted(
                zip(ITEM_FEATURE_COLUMNS, model.feature_importances_),
                key=lambda pair: pair[1],
                reverse=True,
            )
        ],
        "days": result["days"],
        "itemCount": int(result["frame"]["name"].nunique()),
        "promotion": decision,
        "horizonDays": HORIZON_DAYS,
    }
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return model, meta


def load_saved_model():
    if not MODEL_PATH.exists() or not META_PATH.exists():
        return None, None
    try:
        model = joblib.load(MODEL_PATH)
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None, None
    return model, meta


def demand_payload(rows):
    model, meta = load_saved_model()
    if model is None:
        model, meta = train_and_save(rows)

    frame = build_item_frame(rows)
    forecasts = forecast_items(model, frame)
    metrics = (meta or {}).get("metrics") or {}
    holdout = metrics.get("test") or metrics.get("validation")
    data_through = None if frame.empty else frame["date"].max()

    return {
        "ready": bool(model is not None and forecasts),
        "horizonDays": HORIZON_DAYS,
        "items": forecasts,
        "trainedAt": (meta or {}).get("trainedAt"),
        "dataThrough": None if data_through is None else data_through.strftime("%Y-%m-%d"),
        "metrics": metrics,
        "accuracy": None if not holdout else holdout.get("mae"),
        "featureImportances": (meta or {}).get("featureImportances"),
        "reason": (meta or {}).get("reason"),
    }
