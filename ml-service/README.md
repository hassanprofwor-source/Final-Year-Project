# Peak hours ML service (Flask + Random Forest)

Dissertation ML module. It reads historical orders from MongoDB, trains a Random Forest, and serves busy-hour predictions for the admin Analytics page.

The Node backend still has a fallback predictor if this service is down.

## Setup

```powershell
cd C:\hassan-proj\ml-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

`ml-service/.env` must contain the same `MONGO_URI` as the backend, plus:

```
MONGO_DB_NAME=Skyplate
PORT=5001
```

## Train (once)

```powershell
python train.py
```

This writes `models/peak_hours.joblib`. You do not retrain when new orders arrive.

## Run

```powershell
python app.py
```

- `GET /health` — service and model status
- `GET /predict` — reads **live orders** from Mongo and returns actual busy-hour averages, plus the trained model's expected pattern
- `POST /train` — optional retrain if you want to rebuild the saved model

The Analytics chart updates from the database on each request. The saved model is only the expected pattern.

Backend should have `ML_SERVICE_URL=http://localhost:5001`.
