import numpy as np
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error

# A challenger may be marginally worse than the champion without being a real
# regression; anything past this is treated as degradation.
PROMOTION_TOLERANCE = 0.05
DRIFT_TOLERANCE = 1.5
METRIC_HISTORY_LIMIT = 20


def regression_metrics(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    if y_true.size == 0:
        return None

    metrics = {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "rmse": round(float(root_mean_squared_error(y_true, y_pred)), 3),
        "r2": None,
        "rows": int(y_true.size),
    }

    # R² is undefined for a single row or a constant target.
    if y_true.size >= 2 and float(np.std(y_true)) > 0:
        metrics["r2"] = round(float(r2_score(y_true, y_pred)), 3)
    return metrics


def metric_value(metrics, key="mae"):
    if not isinstance(metrics, dict):
        return None
    value = metrics.get(key)
    return None if value is None else float(value)


def promotion_decision(challenger_metrics, champion_metrics):
    """Champion/challenger gate on holdout MAE.

    Without this a bad retrain silently replaces a working model, which is the
    failure mode that is hardest to notice in production.
    """
    challenger_mae = metric_value(challenger_metrics)
    champion_mae = metric_value(champion_metrics)

    if challenger_mae is None:
        return {
            "promote": True,
            "reason": "No holdout metric available; promoting by default.",
            "challengerMae": None,
            "championMae": champion_mae,
        }
    if champion_mae is None:
        return {
            "promote": True,
            "reason": "No comparable champion metric; promoting the new model.",
            "challengerMae": challenger_mae,
            "championMae": None,
        }

    allowed = champion_mae + PROMOTION_TOLERANCE
    if challenger_mae <= allowed:
        return {
            "promote": True,
            "reason": (
                f"Test MAE {challenger_mae:.3f} is within tolerance of the live "
                f"model's {champion_mae:.3f}."
            ),
            "challengerMae": challenger_mae,
            "championMae": champion_mae,
        }

    return {
        "promote": False,
        "reason": (
            f"Test MAE {challenger_mae:.3f} is worse than the live model's "
            f"{champion_mae:.3f}; keeping the existing model."
        ),
        "challengerMae": challenger_mae,
        "championMae": champion_mae,
    }


def drift_report(live_metrics, baseline_metrics, tolerance=DRIFT_TOLERANCE):
    """Compare trailing-week error against the error seen at training time."""
    live_mae = metric_value(live_metrics)
    baseline_mae = metric_value(baseline_metrics)

    if live_mae is None:
        return {
            "status": "unknown",
            "liveMae": None,
            "baselineMae": baseline_mae,
            "ratio": None,
            "message": "Not enough recent orders to measure live accuracy yet.",
        }
    if not baseline_mae:
        return {
            "status": "unknown",
            "liveMae": live_mae,
            "baselineMae": baseline_mae,
            "ratio": None,
            "message": f"Recent error is about {live_mae:.2f} orders per hour.",
        }

    ratio = live_mae / baseline_mae
    if ratio > tolerance:
        status = "degraded"
        message = (
            f"Recent error ({live_mae:.2f}) is {ratio:.1f}x the error at training "
            f"time ({baseline_mae:.2f}). Worth retraining or investigating."
        )
    elif ratio > 1.0:
        status = "watch"
        message = (
            f"Recent error ({live_mae:.2f}) is slightly above training-time error "
            f"({baseline_mae:.2f})."
        )
    else:
        status = "healthy"
        message = (
            f"Recent error ({live_mae:.2f}) is in line with training-time error "
            f"({baseline_mae:.2f})."
        )

    return {
        "status": status,
        "liveMae": round(live_mae, 3),
        "baselineMae": round(baseline_mae, 3),
        "ratio": round(float(ratio), 3),
        "message": message,
    }


def append_history(history, entry, limit=METRIC_HISTORY_LIMIT):
    records = list(history or [])
    records.append(entry)
    return records[-limit:]
