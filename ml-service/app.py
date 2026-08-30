import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from peak_hours import analytics_payload, load_saved_model, train_and_save

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_model():
    model, meta = load_saved_model()
    if model is None:
        model, meta = train_and_save()
    return model, meta


@app.get("/health")
def health():
    model, meta = load_saved_model()
    return jsonify(
        {
            "ok": True,
            "modelReady": model is not None,
            "trainedAt": None if meta is None else meta.get("trainedAt"),
            "usedSynthetic": None if meta is None else meta.get("usedSynthetic"),
        }
    )


@app.get("/predict")
def predict():
    model, meta = get_model()
    return jsonify(analytics_payload(model, meta))


@app.post("/train")
def train():
    model, meta = train_and_save()
    return jsonify({"ok": True, **analytics_payload(model, meta)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)), debug=True)
