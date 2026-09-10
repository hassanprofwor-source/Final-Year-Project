import numpy as np
import pandas as pd

from config import SERVICE_HOURS

FEATURE_COLUMNS = [
    "hour_sin",
    "hour_cos",
    "weekday_sin",
    "weekday_cos",
    "is_weekend",
    "month",
    "lag_1w",
    "lag_2w",
    "rolling_7d_mean",
    "rolling_28d_mean",
    "wow_momentum",
]

TARGET_COLUMN = "order_count"

GRID_COLUMNS = ["date", "hour", TARGET_COLUMN]

# lag_2w and rolling_28d_mean both need 14 prior same-hour observations.
LAG_WARMUP_DAYS = 14

FEATURE_LABELS = {
    "hour_sin": "time of day",
    "hour_cos": "time of day",
    "weekday_sin": "day of week",
    "weekday_cos": "day of week",
    "is_weekend": "weekend vs weekday",
    "month": "time of year",
    "lag_1w": "same hour last week",
    "lag_2w": "same hour two weeks ago",
    "rolling_7d_mean": "the last 7 days at this hour",
    "rolling_28d_mean": "the last 4 weeks at this hour",
    "wow_momentum": "the week-over-week trend",
}

# Drivers are picked one per family so the explanation does not say the same
# thing twice with different numbers.
FEATURE_FAMILIES = {
    "hour_sin": "clock",
    "hour_cos": "clock",
    "weekday_sin": "weekday",
    "weekday_cos": "weekday",
    "is_weekend": "weekday",
    "month": "season",
    "lag_1w": "recent trade",
    "lag_2w": "recent trade",
    "rolling_7d_mean": "recent trade",
    "rolling_28d_mean": "recent trade",
    "wow_momentum": "momentum",
}


def empty_grid():
    return pd.DataFrame({"date": pd.Series(dtype="datetime64[ns]"),
                         "hour": pd.Series(dtype="int64"),
                         TARGET_COLUMN: pd.Series(dtype="float64")})


def hourly_grid(timestamps, hours=None):
    """Order counts per (day, service hour) with unobserved hours filled as zero.

    The zero rows are the point of this function. Grouping only over hours that
    contain orders never shows the model a quiet hour, so it learns to predict
    the average of busy hours everywhere and over-forecasts all day.
    """
    hours = list(hours if hours is not None else SERVICE_HOURS)
    if not len(timestamps) or not hours:
        return empty_grid()

    frame = pd.DataFrame({"slot": pd.to_datetime(pd.Series(list(timestamps)))})
    frame = frame.dropna(subset=["slot"])
    if frame.empty:
        return empty_grid()

    frame["date"] = frame["slot"].dt.normalize()
    frame["hour"] = frame["slot"].dt.hour
    frame = frame[frame["hour"].isin(hours)]
    if frame.empty:
        return empty_grid()

    all_dates = pd.date_range(frame["date"].min(), frame["date"].max(), freq="D")
    counts = frame.groupby(["date", "hour"]).size().rename(TARGET_COLUMN).reset_index()

    grid = pd.MultiIndex.from_product(
        [all_dates, hours], names=["date", "hour"]
    ).to_frame(index=False)
    grid = grid.merge(counts, on=["date", "hour"], how="left")
    grid[TARGET_COLUMN] = grid[TARGET_COLUMN].fillna(0.0).astype(float)
    grid["hour"] = grid["hour"].astype(int)
    return grid.sort_values(["date", "hour"]).reset_index(drop=True)


def add_calendar_features(frame):
    """Cyclical calendar features. `hour` is optional so daily frames can reuse this."""
    frame = frame.copy()
    weekday = frame["date"].dt.weekday.astype(float)

    if "hour" in frame.columns:
        hour = frame["hour"].astype(float)
        frame["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
        frame["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)

    frame["weekday"] = weekday.astype(int)
    frame["weekday_sin"] = np.sin(2 * np.pi * weekday / 7.0)
    frame["weekday_cos"] = np.cos(2 * np.pi * weekday / 7.0)
    frame["is_weekend"] = (weekday >= 5).astype(int)
    frame["month"] = frame["date"].dt.month.astype(int)
    return frame


def add_history_features(frame, target_column=TARGET_COLUMN, group_columns=("hour",)):
    """Lag, rolling-mean and momentum features per hour-of-day series.

    Every rolling window is shifted by one day first so a slot's own count can
    never leak into its features.
    """
    group_columns = list(group_columns)
    frame = frame.sort_values(group_columns + ["date"]).copy()

    grouped = frame.groupby(group_columns, sort=False)[target_column]
    frame["lag_1w"] = grouped.shift(7)
    frame["lag_2w"] = grouped.shift(14)
    frame["_prior"] = grouped.shift(1)

    prior = frame.groupby(group_columns, sort=False)["_prior"]
    frame["rolling_7d_mean"] = prior.transform(
        lambda values: values.rolling(7, min_periods=7).mean()
    )
    frame["rolling_28d_mean"] = prior.transform(
        lambda values: values.rolling(28, min_periods=LAG_WARMUP_DAYS).mean()
    )
    previous_week_mean = prior.transform(
        lambda values: values.rolling(7, min_periods=7).mean().shift(7)
    )

    denominator = previous_week_mean.replace(0.0, np.nan)
    frame["wow_momentum"] = (
        ((frame["rolling_7d_mean"] - previous_week_mean) / denominator)
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0.0)
        .clip(-3.0, 3.0)
    )

    return frame.drop(columns=["_prior"])


def build_training_frame(timestamps, hours=None):
    grid = hourly_grid(timestamps, hours=hours)
    if grid.empty:
        return grid.assign(**{column: pd.Series(dtype="float64") for column in FEATURE_COLUMNS})

    frame = add_calendar_features(grid)
    frame = add_history_features(frame)
    frame = frame.dropna(subset=FEATURE_COLUMNS)
    return frame.sort_values(["date", "hour"]).reset_index(drop=True)


def feature_matrix(frame):
    return np.asarray(frame[FEATURE_COLUMNS], dtype=float)


def target_vector(frame, target_column=TARGET_COLUMN):
    return np.asarray(frame[target_column], dtype=float)


def build_forecast_frame(timestamps, target_dates, hours=None):
    """Backward-looking features for future slots.

    Rolling statistics are frozen at the most recent observed day for each hour.
    The horizon has no actuals to roll over, and feeding predictions back in
    would compound error across the week.
    """
    hours = list(hours if hours is not None else SERVICE_HOURS)
    target_dates = [pd.Timestamp(date).normalize() for date in target_dates]

    grid = hourly_grid(timestamps, hours=hours)
    if grid.empty or not target_dates:
        return pd.DataFrame(columns=["date", "hour"] + FEATURE_COLUMNS)

    history = add_history_features(add_calendar_features(grid))
    actuals = {
        (row.date, int(row.hour)): float(getattr(row, TARGET_COLUMN))
        for row in grid.itertuples(index=False)
    }

    frozen = {}
    for hour in hours:
        hour_rows = history[history["hour"] == hour].sort_values("date")
        if hour_rows.empty:
            continue
        frozen[hour] = hour_rows.iloc[-1]

    rows = []
    for date in target_dates:
        for hour in hours:
            reference = frozen.get(hour)
            if reference is None:
                continue
            rolling_7d = _clean(reference.get("rolling_7d_mean"))
            rows.append(
                {
                    "date": date,
                    "hour": hour,
                    "lag_1w": actuals.get(
                        (date - pd.Timedelta(days=7), hour),
                        _clean(reference.get("lag_1w"), rolling_7d),
                    ),
                    "lag_2w": actuals.get(
                        (date - pd.Timedelta(days=14), hour),
                        _clean(reference.get("lag_2w"), rolling_7d),
                    ),
                    "rolling_7d_mean": rolling_7d,
                    "rolling_28d_mean": _clean(
                        reference.get("rolling_28d_mean"), rolling_7d
                    ),
                    "wow_momentum": _clean(reference.get("wow_momentum")),
                }
            )

    if not rows:
        return pd.DataFrame(columns=["date", "hour"] + FEATURE_COLUMNS)

    frame = add_calendar_features(pd.DataFrame(rows))
    return frame.sort_values(["date", "hour"]).reset_index(drop=True)


def _clean(value, fallback=0.0):
    if value is None:
        return fallback
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if np.isnan(number) or np.isinf(number):
        return fallback
    return number


def describe_drivers(frame_row, importances, limit=2, weekday_name=None):
    """Plain-language reasons a slot was predicted high or low."""
    ranked = sorted(importances, key=lambda pair: pair[1], reverse=True)
    seen = set()
    reasons = []
    for name, _weight in ranked:
        family = FEATURE_FAMILIES.get(name)
        if not family or family in seen:
            continue
        phrase = _driver_phrase(name, FEATURE_LABELS.get(name, family), frame_row, weekday_name)
        if not phrase:
            continue
        seen.add(family)
        reasons.append(phrase)
        if len(reasons) >= limit:
            break
    return reasons


def _driver_phrase(name, label, row, weekday_name=None):
    if name == "wow_momentum":
        momentum = _clean(row.get("wow_momentum"))
        if abs(momentum) < 0.02:
            return "the week-over-week trend is flat"
        direction = "up" if momentum > 0 else "down"
        return f"the week-over-week trend is {direction} {abs(round(momentum * 100))}%"
    if name in {"is_weekend", "weekday_sin", "weekday_cos"}:
        if weekday_name:
            return f"it's a {weekday_name}"
        return "it's a weekend" if _clean(row.get("is_weekend")) >= 1 else "it's a weekday"
    if name in {"lag_1w", "lag_2w", "rolling_7d_mean", "rolling_28d_mean"}:
        return f"{label} averaged {round(_clean(row.get(name)), 1)} orders"
    if name in {"hour_sin", "hour_cos"}:
        hour = row.get("hour")
        return None if hour is None else f"it's the {int(hour):02d}:00 slot"
    if name == "month":
        return "the time of year"
    return label
