import os

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import ParameterGrid, TimeSeriesSplit

from evaluation import regression_metrics
from features import FEATURE_COLUMNS, feature_matrix, target_vector

RANDOM_STATE = 42

PARAM_GRID = {
    "n_estimators": [300],
    "max_depth": [None, 10, 16],
    "min_samples_leaf": [1, 2, 4],
    "max_features": ["sqrt", 0.6, 1.0],
}

# Trimmed grid for test runs and low-powered hosts, set via TUNING_PROFILE=fast.
FAST_PARAM_GRID = {
    "n_estimators": [150],
    "max_depth": [None, 12],
    "min_samples_leaf": [1, 3],
    "max_features": ["sqrt"],
}


def active_param_grid():
    profile = os.getenv("TUNING_PROFILE", "full").strip().lower()
    return FAST_PARAM_GRID if profile == "fast" else PARAM_GRID

FALLBACK_PARAMS = {
    "n_estimators": 300,
    "max_depth": None,
    "min_samples_leaf": 2,
    "max_features": "sqrt",
}

# Below this much history a three-way temporal split leaves too little to learn
# from, so tuning and holdout reporting are skipped.
MIN_DAYS_FOR_SPLIT = 28
MIN_ROWS_FOR_SPLIT = 60
MIN_ROWS_FOR_TUNING = 40
CV_SPLITS = 4


def order_columns(frame, preferred=("hour", "name")):
    return ["date"] + [column for column in preferred if column in frame.columns]


def chronological_split(frame, val_fraction=0.15, test_fraction=0.15):
    """Split on whole days, oldest to newest, with no shuffling.

    Splitting on day boundaries rather than row positions keeps every row of a
    given day in the same fold, so one day cannot straddle a boundary and leak
    through the lag features.
    """
    ordering = order_columns(frame)
    dates = np.sort(frame["date"].unique())
    day_count = len(dates)
    if day_count < 3:
        return frame, frame.iloc[0:0], frame.iloc[0:0]

    test_days = max(1, int(round(day_count * test_fraction)))
    val_days = max(1, int(round(day_count * val_fraction)))
    if day_count - test_days - val_days < 1:
        test_days = 1
        val_days = 1

    train_days = day_count - val_days - test_days
    train_dates = set(dates[:train_days])
    val_dates = set(dates[train_days : train_days + val_days])
    test_dates = set(dates[train_days + val_days :])

    return (
        frame[frame["date"].isin(train_dates)].sort_values(ordering),
        frame[frame["date"].isin(val_dates)].sort_values(ordering),
        frame[frame["date"].isin(test_dates)].sort_values(ordering),
    )


def tune_hyperparameters(X, y, splits=CV_SPLITS):
    """Rolling-origin hyperparameter search.

    TimeSeriesSplit always trains on the past and validates on the future, so a
    configuration has to hold up across several origins instead of getting
    lucky on one static cut. Rows must already be in chronological order.
    """
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    if len(y) < MIN_ROWS_FOR_TUNING:
        return dict(FALLBACK_PARAMS), []

    usable_splits = max(2, min(splits, len(y) // 20))
    splitter = TimeSeriesSplit(n_splits=usable_splits)
    results = []

    for params in ParameterGrid(active_param_grid()):
        fold_scores = []
        for train_index, val_index in splitter.split(X):
            model = RandomForestRegressor(
                random_state=RANDOM_STATE, n_jobs=-1, **params
            )
            model.fit(X[train_index], y[train_index])
            predictions = model.predict(X[val_index])
            fold_scores.append(float(np.mean(np.abs(y[val_index] - predictions))))
        results.append(
            {
                "params": params,
                "cvMae": round(float(np.mean(fold_scores)), 4),
                "cvMaeStd": round(float(np.std(fold_scores)), 4),
            }
        )

    results.sort(key=lambda entry: entry["cvMae"])
    return dict(results[0]["params"]), results


def fit_forest(X, y, params):
    model = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1, **params)
    model.fit(np.asarray(X, dtype=float), np.asarray(y, dtype=float))
    return model


def fit_random_forest(frame, params):
    ordered = frame.sort_values(order_columns(frame))
    return fit_forest(feature_matrix(ordered), target_vector(ordered), params)


def evaluate(model, frame):
    if model is None or frame is None or frame.empty:
        return None
    predictions = model.predict(feature_matrix(frame))
    return regression_metrics(target_vector(frame), predictions)


def train_peak_hours_model(frame):
    """Fit, tune and score a peak-hours model using a strict temporal split.

    The returned model is fitted on train+validation only. Refitting on the
    holdout as well would give a marginally stronger model but would burn the
    test set, leaving nothing clean to compare the next retrain against.
    """
    day_count = len(np.unique(frame["date"])) if not frame.empty else 0
    if frame.empty or day_count < MIN_DAYS_FOR_SPLIT or len(frame) < MIN_ROWS_FOR_SPLIT:
        params = dict(FALLBACK_PARAMS)
        model = fit_random_forest(frame, params) if not frame.empty else None
        return {
            "model": model,
            "params": params,
            "search": [],
            "metrics": {
                "train": evaluate(model, frame),
                "validation": None,
                "test": None,
            },
            "rows": {"train": int(len(frame)), "validation": 0, "test": 0},
            "days": int(day_count),
            "splitApplied": False,
            "testFrame": None,
        }

    train_frame, val_frame, test_frame = chronological_split(frame)
    fit_frame = concat_frames(train_frame, val_frame)

    params, search = tune_hyperparameters(
        feature_matrix(fit_frame), target_vector(fit_frame)
    )

    validation_model = fit_random_forest(train_frame, params)
    validation_metrics = evaluate(validation_model, val_frame)

    model = fit_random_forest(fit_frame, params)

    return {
        "model": model,
        "params": params,
        "search": search[:5],
        "metrics": {
            "train": evaluate(model, fit_frame),
            "validation": validation_metrics,
            "test": evaluate(model, test_frame),
        },
        "rows": {
            "train": int(len(train_frame)),
            "validation": int(len(val_frame)),
            "test": int(len(test_frame)),
        },
        "days": int(day_count),
        "splitApplied": True,
        "testFrame": test_frame,
    }


def concat_frames(*frames):
    usable = [frame for frame in frames if frame is not None and not frame.empty]
    if not usable:
        return frames[0]
    combined = pd.concat(usable, ignore_index=True)
    return combined.sort_values(order_columns(combined)).reset_index(drop=True)


def model_matches_features(model, expected_columns):
    """Reject a saved forest whose trees were trained on an older feature set."""
    if model is None:
        return False
    n_features = getattr(model, "n_features_in_", None)
    if n_features is None:
        return True
    return int(n_features) == len(expected_columns)


def tree_predictions(model, X):
    return np.stack([tree.predict(X) for tree in model.estimators_])


def tree_quantiles(model, X, quantiles=(10, 50, 90)):
    """Prediction bands straight out of the forest's own tree spread.

    Each tree is a legitimate estimate from a different bootstrap sample, so the
    spread across trees is a real uncertainty band without changing model family.
    """
    if model is None or len(X) == 0:
        return {quantile: np.zeros(len(X)) for quantile in quantiles}
    stacked = tree_predictions(model, X)
    return {
        quantile: np.percentile(stacked, quantile, axis=0) for quantile in quantiles
    }


def feature_importances(model, columns=None):
    if model is None or not hasattr(model, "feature_importances_"):
        return []
    columns = columns or FEATURE_COLUMNS
    pairs = list(zip(columns, [float(value) for value in model.feature_importances_]))
    return sorted(pairs, key=lambda pair: pair[1], reverse=True)
