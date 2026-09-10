# Restaurant Analytics Panel — ML Redesign Plan
**Handoff context for Cursor (Claude Opus) — full codebase access assumed**

## 0. Constraints (confirmed with project owner)
- **Model family stays RandomForestRegressor** — already approved by supervisor. Do not swap to LightGBM/XGBoost/etc. All improvements come from better features, proper methodology, and better use of what RF already gives you (feature importances, tree-spread confidence intervals).
- **Deployment market is the UK**, not Pakistan. No Ramadan/Islamic-calendar features. Use UK bank holidays / UK school holidays instead. Currency display should be GBP.
- Existing API shape (`/health`, `/predict`, `/train`, `/insights/menu`) should stay backward-compatible with the frontend where possible — extend response payloads rather than breaking them.

## 1. Prerequisite bug fixes (do these before touching the model)
These corrupt the training data itself, so fix first or retraining just re-learns the same bugs:

1. **Timezone bug** (`peak_hours.py: as_naive()`): currently strips `tzinfo` without converting first. Mongo returns UTC-aware datetimes. Must convert to `Europe/London` (handles GMT/BST automatically) before extracting hour/weekday:
   ```python
   from zoneinfo import ZoneInfo
   UK_TZ = ZoneInfo("Europe/London")

   def as_naive(value):
       if value.tzinfo is not None:
           return value.astimezone(UK_TZ).replace(tzinfo=None)
       return value
   ```
2. **Trending "-100%" bug** (`popular_items.py: trending_items()`): raw ratio of two 7-day buckets blows up when the earlier bucket has any sales and the recent bucket has none (or vice versa). Fix:
   - Require a minimum absolute unit count in *either* window before reporting a %, otherwise mark item as "insufficient data" rather than -100%/+100%.
   - Prefer a smoothed trend (e.g. slope of a rolling weekly average over the last 4–6 weeks) over a single before/after ratio.
3. **Missing item image**: add a placeholder/fallback image path in `menu_insights_payload()` when no cart item ever carried an image URL.

## 2. Feature engineering (this is what makes the RF a real model instead of a lookup table)

Current features: `hour`, `weekday`, `is_weekend` (3 total). Target expanded set:

| Feature | Why |
|---|---|
| `hour_sin`, `hour_cos` | cyclical encoding so hour 23 and hour 0 are treated as close, not maximally distant |
| `weekday_sin`, `weekday_cos` | same idea for day-of-week |
| `is_weekend` | keep as-is |
| `lag_1w`, `lag_2w` | order count at this exact hour, 1 and 2 weeks prior |
| `rolling_7d_mean`, `rolling_28d_mean` | rolling average for this hour-slot, smooths noise |
| `wow_momentum` | (this week's rolling mean − last week's) / last week's — captures trend direction |
| `is_uk_bank_holiday` | via `holidays` python package (`holidays.UK` or `holidays.England`), zero external API needed |
| `is_school_holiday` | UK term-time dining patterns differ (families out at lunch); can hardcode UK term-date ranges per academic year, or use a lightweight lookup table |
| `month` | seasonal effects (summer terrace trade, December, etc.) |

Confirm before implementing: does the order schema in Mongo carry anything else useful (branch/location if multi-site, delivery vs. dine-in, any promo/discount flag)? These would be strong additional features if present.

## 3. Proper train / validation / test methodology (explicit three-stage process)

This is time-series data — **never use a random `train_test_split`** on it (current code does this, and it leaks future information into training, making the reported MAE artificially good). Use a strict **chronological split**:

```
|<------ 70% Train ------>|<-- 15% Validation -->|<-- 15% Test (holdout) -->|
        oldest data                                        most recent data
```

- **Training set**: fit the RandomForestRegressor.
- **Validation set**: never used for fitting. Used only to choose hyperparameters (`n_estimators`, `max_depth`, `min_samples_leaf`, `max_features`) and to pick the best configuration. Use `sklearn.model_selection.TimeSeriesSplit` for rolling-origin cross-validation *within* the train+validation region, rather than a single static validation cut, so hyperparameter choice is robust rather than lucky on one split.
- **Test set (holdout)**: touched exactly once, after the model and hyperparameters are finalized. Reports the final, honest performance number. If you go back and re-tune after seeing test performance, it's no longer a valid holdout — treat it as sacred.
- **Metrics to report at both validation and test stage**: MAE, RMSE, R². Skip MAPE unless you exclude zero-order hours (division by zero).
- **Promotion rule**: only replace the live model with a newly retrained one if its test-set MAE is not worse than the currently deployed model's (simple champion/challenger check) — prevents a bad retrain silently degrading production.

## 4. Getting real confidence intervals without leaving RandomForest
RF doesn't give confidence intervals out of the box, but you don't need to change model family to get them:
- Collect each individual tree's prediction for a given input (`[tree.predict(X) for tree in model.estimators_]`).
- Take the 10th/50th/90th percentile across trees → gives a genuine P10/P50/P90 band for the UI, computed directly from the already-approved model.

## 5. Explainability for the UI
- Surface `model.feature_importances_` and translate the top 2–3 into a plain-language line, e.g. *"Predicted higher — it's a Saturday and the last 2 weeks are trending up 12%."*
- Show validation MAE and test MAE separately in the "last trained" panel (currently only training-time metrics are shown).
- Replace fragile trending badges with the smoothed version from §1, and suppress items with insufficient data instead of showing misleading percentages.

## 6. Menu item demand forecasting (extends the same approved model type)
Currently `popular_items.py` is pure aggregation — no model at all. Add a second RandomForestRegressor (same family, consistent with supervisor approval) that predicts **expected units for the next 7 days per item**, using the same feature set (lag, rolling, calendar) plus item identity. This turns "hot sellers" from a rear-facing ranking into a forward-looking prep-planning number, and gives the "trending" section a principled basis instead of raw ratio swings.

## 7. Retraining & monitoring
- Retrain on a schedule (nightly or weekly) using a rolling window of recent months.
- Extend the existing `peak_hours_meta.json` to log validation MAE/RMSE/R² and test MAE/RMSE/R² per training run, not just training-set metrics.
- Track live MAE (predicted vs. actual) over the trailing week; flag for investigation if it degrades past a threshold.

## 8. Proposed module layout for the rebuild
```
features.py         # cyclical encoding, lag/rolling features, UK calendar features
calendar_uk.py       # UK bank holidays + school holidays lookup
model_training.py    # chronological split, TimeSeriesSplit CV, hyperparameter search,
                      # champion/challenger promotion, tree-spread confidence intervals
peak_hours.py         # refactored: uses features.py + model_training.py, keeps API response shape
item_demand.py        # new per-item forecasting model (same RF family)
evaluation.py         # metrics logging, drift check
tests/                # unit tests for feature functions and the split logic (temporal correctness matters here)
```

## 9. Implementation phases (hand this list to Cursor)
1. **Phase 0** — timezone fix + trending calc fix (ship independently, immediate correctness win)
2. **Phase 1** — `features.py` + `calendar_uk.py` (cyclical, lag, rolling, UK holidays)
3. **Phase 2** — `model_training.py`: chronological split, `TimeSeriesSplit` hyperparameter search, tree-spread confidence intervals, feature importances
4. **Phase 3** — `evaluation.py`: validation/test metric logging, champion/challenger promotion rule
5. **Phase 4** — `item_demand.py`: per-item forecasting model
6. **Phase 5** — UI updates: confidence bands, plain-language drivers, validation/test MAE display, fixed trending badges
7. **Phase 6** — retraining schedule + drift monitoring

## 10. Open questions to resolve before/while implementing
- Full order document schema — any promo/discount, delivery-vs-dine-in, or branch/location fields worth adding as features?
- Confirm `holidays` python package (`pip install holidays`) is acceptable for UK bank holidays, and confirm whether UK school-term dates should be hardcoded per academic year or looked up.
- Confirm whether the frontend can accept additional response fields (confidence band, feature-driver text) without breaking existing rendering, or whether a versioned endpoint is preferred.
