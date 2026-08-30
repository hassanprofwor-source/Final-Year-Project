from datetime import datetime, timedelta
import json
import os
import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
HOURS = list(range(12, 23))
MIN_REAL_ORDERS = 20
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "peak_hours.joblib"
META_PATH = MODEL_DIR / "peak_hours_meta.json"


def get_collection():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME", "Skyplate")
    if not uri:
        raise RuntimeError("MONGO_URI is not set")
    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    return client[db_name]["orders"]


def load_order_datetimes():
    collection = get_collection()
    timestamps = []
    for doc in collection.find({}, {"createdAt": 1, "date": 1, "time": 1}):
        created = doc.get("createdAt")
        if isinstance(created, datetime):
            timestamps.append(created)
            continue
        date_str = doc.get("date")
        time_str = doc.get("time") or "12:00"
        if date_str:
            for fmt in ("%d-%m-%Y %H:%M", "%Y-%m-%d %H:%M"):
                try:
                    timestamps.append(datetime.strptime(f"{date_str} {time_str}", fmt))
                    break
                except ValueError:
                    continue
    return timestamps


def generate_synthetic_timestamps(days=60):
    timestamps = []
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
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


def build_training_rows(timestamps):
    frame = pd.DataFrame({"timestamp": pd.to_datetime(timestamps)})
    frame["date"] = frame["timestamp"].dt.date
    frame["hour"] = frame["timestamp"].dt.hour
    frame["weekday"] = frame["timestamp"].dt.weekday
    frame["is_weekend"] = (frame["weekday"] >= 5).astype(int)

    grouped = (
        frame.groupby(["date", "hour", "weekday", "is_weekend"], as_index=False)
        .size()
        .rename(columns={"size": "order_count"})
    )

    X = np.asarray(grouped[["hour", "weekday", "is_weekend"]], dtype=float)
    y = np.asarray(grouped["order_count"], dtype=float)
    return X, y


def predict_week(model):
    predictions = {}
    for weekday_index, name in enumerate(WEEKDAYS):
        rows = np.array([[hour, weekday_index, 1 if weekday_index >= 5 else 0] for hour in HOURS])
        preds = model.predict(rows)
        predictions[name] = [max(0, round(float(value), 2)) for value in preds]
    return predictions


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
    if real_count < MIN_REAL_ORDERS:
        timestamps = generate_synthetic_timestamps()
        used_synthetic = True

    X, y = build_training_rows(timestamps)
    return {
        "X": X,
        "y": y,
        "timestamps": timestamps,
        "used_synthetic": used_synthetic,
        "real_count": real_count,
        "load_error": load_error,
    }


def fit_model(X, y):
    model = RandomForestRegressor(n_estimators=120, random_state=42)
    metrics = {"mae": None, "r2": None, "trainRows": int(len(y))}

    if len(y) >= 8:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        metrics["mae"] = round(float(mean_absolute_error(y_test, preds)), 3)
        metrics["r2"] = round(float(r2_score(y_test, preds)), 3)
        model.fit(X, y)
    else:
        model.fit(X, y)

    return model, metrics


def train_and_save():
    data = collect_training_data()
    model, metrics = fit_model(data["X"], data["y"])
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    meta = {
        "usedSynthetic": data["used_synthetic"],
        "sampleSize": int(len(data["timestamps"])),
        "realOrderCount": int(data["real_count"]),
        "loadError": data["load_error"],
        "trainedAt": datetime.now().isoformat(timespec="seconds"),
        "metrics": metrics,
        "hours": HOURS,
        "weekdays": WEEKDAYS,
    }
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return model, meta


def load_saved_model():
    if not MODEL_PATH.exists() or not META_PATH.exists():
        return None, None
    model = joblib.load(MODEL_PATH)
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return model, meta


def prediction_payload(model, meta):
    return {
        "hours": meta.get("hours", HOURS),
        "weekdays": meta.get("weekdays", WEEKDAYS),
        "predictions": predict_week(model),
        "usedSynthetic": meta.get("usedSynthetic", False),
        "sampleSize": meta.get("sampleSize", 0),
        "realOrderCount": meta.get("realOrderCount"),
        "loadError": meta.get("loadError"),
        "trainedAt": meta.get("trainedAt"),
        "metrics": meta.get("metrics"),
        "source": "flask-synthetic" if meta.get("usedSynthetic") else "flask",
    }
