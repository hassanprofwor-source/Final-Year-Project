# Analytics ML service (Flask + Random Forest)

Reads historical orders from MongoDB, trains Random Forest models, and serves
busy-hour forecasts and per-dish demand forecasts to the admin Analytics page.

Two models, both `RandomForestRegressor`:

- **Peak hours** — orders expected in each service hour of the coming week.
- **Item demand** — units expected per dish over the next 7 days.

The Node backend has a fallback predictor if this service is down, so the
Analytics page keeps working (without forecasts) either way.

## Setup

```powershell
cd "E:\Hassan's Project\ml-service"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set `MONGO_URI` to the same value the backend
uses. Every other setting has a working default.

## Train

```powershell
python train.py              # both models
python train.py --only peak  # just peak hours
python train.py --only items # just item demand
python train.py --fast       # trimmed grid: quicker, weaker model
```

`train.py` pins `TUNING_PROFILE` for the run and prints which grid it used, so a
stale `fast` exported in the shell cannot quietly downgrade a real training run.
`load_dotenv` will not override an already-exported variable, so `.env` alone
could not guarantee this.

This writes `models/peak_hours.joblib` and `models/item_demand.joblib` along
with their metadata. The service also retrains nightly on its own, and trains
on demand if no saved model exists.

## Run

```powershell
python app.py
```

| Endpoint | Purpose |
|---|---|
| `GET /health` | Service, model and scheduler status |
| `GET /predict` | Forecast for the coming week, live actuals, drift and metrics |
| `POST /train` | Retrain both models now |
| `GET /insights/menu` | Hot sellers, quiet items, demand forecast |
| `GET /insights/demand` | Per-dish demand forecast on its own |
| `POST /train/items` | Retrain only the item-demand model |
| `GET /metrics` | Training history, feature importances, drift, scheduler state |

Backend needs `ML_SERVICE_URL=http://localhost:5001`.

## Tests

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -t .
```

`tests/__init__.py` selects the trimmed grid on its own, so nothing needs
exporting by hand; the full grid makes the model tests roughly twenty times
slower. Export `TUNING_PROFILE=full` to override it for a thorough run.

## How the models work

**Features.** Order counts are aggregated onto a complete (day, hour) grid, so
hours with no orders become explicit zero rows rather than disappearing. On top
of that: cyclical hour and weekday encodings, `is_weekend`, `month`, same-hour
counts from one and two weeks back, 7- and 28-day rolling means, and a
week-over-week momentum term. Every rolling window is shifted a day first so a
slot's own count can never leak into its own features.

**Splitting.** Data is split chronologically on whole days, 70/15/15. Never a
random split: that leaks future information and reports an error far better than
the model can really achieve. Hyperparameters are chosen by rolling-origin
`TimeSeriesSplit` cross-validation over train+validation. The test set is scored
once, and the deployed model is fitted on train+validation only, so the holdout
stays clean for the next retrain to compare against.

**Confidence bands.** Each tree in the forest predicts independently; the 10th,
50th and 90th percentiles across trees give the P10–P90 band shown on the chart.

**Promotion.** A retrained model only replaces the live one if its test MAE is
no worse. The current model is re-scored on the new holdout so the comparison is
like-for-like.

**Trading window.** Detected from when orders actually arrive, because a
hardcoded window silently drops every order outside it. Pin
`SERVICE_HOUR_START` and `SERVICE_HOUR_END` together to override.

**Timezone.** Mongo returns UTC. Timestamps are converted to `ANALYTICS_TZ`
before the hour is read, which handles GMT/BST automatically.

## Monitoring

`/predict` and `/metrics` both report:

- `drift` — trailing-week error against error at training time.
- `coverage` — recent daily order volume against the preceding weeks. If orders
  stop reaching the database this flags it, because accuracy figures and
  forecasts are meaningless until it recovers.
