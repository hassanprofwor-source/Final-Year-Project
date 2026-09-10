import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import item_demand
from peak_hours import (
    analytics_payload,
    live_accuracy,
    load_live_orders,
    load_saved_model,
    train_and_save,
)
from popular_items import load_order_item_rows, menu_insights_payload
from evaluation import drift_report
from scheduler import (
    RetrainScheduler,
    debug_enabled,
    in_reloader_parent,
    scheduler_enabled,
)

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_model():
    model, meta = load_saved_model()
    if model is None:
        model, meta = train_and_save()
    return model, meta


def retrain_all():
    model, meta = train_and_save()
    try:
        item_demand.train_and_save(load_order_item_rows())
    except Exception:
        # A failed item model must not block the peak-hours retrain.
        pass
    return model, meta


scheduler = RetrainScheduler(
    job=retrain_all,
    at=os.getenv("RETRAIN_AT"),
    enabled=scheduler_enabled() and not in_reloader_parent(),
).start()


@app.get("/health")
def health():
    model, meta = load_saved_model()
    return jsonify(
        {
            "ok": True,
            "modelReady": model is not None,
            "trainedAt": None if meta is None else meta.get("trainedAt"),
            "usedSynthetic": None if meta is None else meta.get("usedSynthetic"),
            "scheduler": scheduler.status(),
        }
    )


@app.get("/predict")
def predict():
    model, meta = get_model()
    return jsonify(analytics_payload(model, meta))


@app.post("/train")
def train():
    model, meta = retrain_all()
    return jsonify({"ok": True, **analytics_payload(model, meta)})


@app.get("/insights/menu")
def menu_insights():
    return jsonify(menu_insights_payload())


@app.get("/insights/demand")
def item_demand_forecast():
    return jsonify(item_demand.demand_payload(load_order_item_rows()))


@app.post("/train/items")
def train_items():
    _model, meta = item_demand.train_and_save(load_order_item_rows())
    return jsonify({"ok": True, **(meta or {})})


@app.get("/metrics")
def metrics():
    model, meta = load_saved_model()
    meta = meta or {}
    timestamps, load_error = load_live_orders()
    training_metrics = meta.get("metrics") or {}
    _item_model, item_meta = item_demand.load_saved_model()

    return jsonify(
        {
            "modelReady": model is not None,
            "trainedAt": meta.get("trainedAt"),
            "metrics": training_metrics,
            "featureColumns": meta.get("featureColumns"),
            "featureImportances": meta.get("featureImportances"),
            "hyperparameters": meta.get("hyperparameters"),
            "promotion": meta.get("promotion"),
            "lastAttempt": meta.get("lastAttempt"),
            "history": meta.get("history") or [],
            "drift": drift_report(
                live_accuracy(model, timestamps), training_metrics.get("test")
            ),
            "itemDemand": {
                "trainedAt": (item_meta or {}).get("trainedAt"),
                "metrics": (item_meta or {}).get("metrics"),
                "itemCount": (item_meta or {}).get("itemCount"),
            },
            "scheduler": scheduler.status(),
            "loadError": load_error,
        }
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5001)),
        debug=debug_enabled(),
    )
