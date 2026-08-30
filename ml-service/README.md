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

## Train

```powershell
python train.py
```

This writes `models/peak_hours.joblib`. Training uses real orders when there are at least 20; otherwise it uses synthetic lunch/dinner traffic so the chart still works.

## Run

```powershell
python app.py
```

- `GET /health` — service and model status
- `GET /predict` — weekly hour predictions
- `POST /train` — retrain and overwrite the saved model

Backend should have `ML_SERVICE_URL=http://localhost:5001`.
