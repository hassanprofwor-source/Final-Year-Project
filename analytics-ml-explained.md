# The Analytics Forecasting — Plain English Guide

This document explains what the forecasting part of the admin Analytics page
actually does, how it was tested, what every file in `ml-service/` is for, and
what the current results mean.

It assumes **no machine-learning background**. Every technical term is explained
the first time it appears. If you only read one section, read
[The current results](#5-the-current-results).

---

## Contents

1. [What the system predicts](#1-what-the-system-predicts)
2. [The jargon, decoded](#2-the-jargon-decoded)
3. [How the model learns](#3-how-the-model-learns)
4. [How training is done in three stages](#4-how-training-is-done-in-three-stages)
5. [The current results](#5-the-current-results)
6. [Where the data comes from](#6-where-the-data-comes-from)
7. [The `ml-service/` folder, file by file](#7-the-ml-service-folder-file-by-file)
8. [How it was tested](#8-how-it-was-tested)
9. [Everyday commands](#9-everyday-commands)
10. [Warning signs to watch for](#10-warning-signs-to-watch-for)

---

## 1. What the system predicts

There are **two separate forecasts**, each with its own model.

### Busy hours ("peak hours")

Answers: *how many orders should we expect at 7pm on Saturday?*

It produces a number for every trading hour of the coming week, so the Analytics
page can show which slots will be busy. This is what drives staffing and prep
decisions — if 7pm Saturday is going to be the busiest slot, you want people on
the floor then.

### Per-dish demand ("item demand")

Answers: *how many Garlic Naans will we sell over the next 7 days?*

It produces a 7-day forecast for each of the 30 menu items, which is what you'd
use for ordering ingredients.

Both are **forecasts, not facts**. They are educated estimates based on what has
happened before, and each one comes with a range showing how confident the model
is. More on that below.

---

## 2. The jargon, decoded

These terms appear in the Analytics page and in the training output. Here is
what each one actually means.

### MAE — "how far off is it, typically?"

Short for *Mean Absolute Error*. Take every prediction, see how far it was from
what really happened, ignore whether it was too high or too low, and average it.

> **The busy-hours model has an MAE of about 1.0.** That means when it predicts
> how many orders will arrive in a given hour, it is typically off by about
> **one order**. If it says "expect 8 orders at 7pm", reality is usually
> somewhere around 7 to 9.

Lower is better. MAE is measured in the same units as the thing being predicted
(orders per hour, or units of a dish per day), which is why it's the easiest
number to reason about.

### RMSE — "are the mistakes small and steady, or occasionally huge?"

Short for *Root Mean Square Error*. Similar to MAE, but it punishes big misses
much more harshly than small ones.

You don't read RMSE on its own — you compare it to MAE. If RMSE is close to MAE,
the model is consistently a little bit off. If RMSE is *much* bigger than MAE,
the model is usually fine but occasionally makes a wild mistake.

> Ours: MAE 1.008, RMSE 1.319. Reasonably close, so the errors are small and
> steady rather than a few disasters hiding behind a good average.

### R² — "how much of the pattern did it actually capture?"

Said "R squared". A score from 0 to 1:

- **1.0** = perfect, explains everything.
- **0.0** = useless; no better than ignoring the question and always guessing the
  overall average.
- **Below 0** = actively worse than guessing the average. This is a red flag.

> **Ours is 0.775 for busy hours**, meaning the model captures roughly **78% of
> the real variation** in how busy each hour is. The remaining 22% is genuine
> randomness — whether five friends decide to walk in at 8pm is not predictable
> from history.

This is the number that improved most dramatically during this work: it was
**0.181** before the data was fixed, and is **0.775** now.

### Features — "the clues the model gets"

A feature is one piece of information the model is allowed to look at when
making a guess. Our models get clues like:

- What hour of the day is it?
- Is it a weekend?
- How many orders came in at this same hour **last week**? And **two weeks ago**?
- What has the average been over the **last 7 days**? The **last 28 days**?

That last group turned out to be the most important — see
[feature importance](#which-clues-mattered-most) below.

### Hyperparameters — "the model's own settings"

Not the data, but the knobs on the model itself — a bit like oven temperature
and cooking time. For example, "how many decision trees should we build?" and
"how detailed is each tree allowed to get?"

You can't calculate the best settings, so you **try lots of combinations and
keep the best**. We tested **27 different combinations** for each model.

### Overfitting — "memorising instead of learning"

The classic failure. A model can score brilliantly on data it has already seen
while being useless on anything new, because it memorised the answers instead of
learning the pattern — like a student who memorised last year's exam paper.

The whole three-stage training process in section 4 exists to detect this.

### Holdout / test set — "the sealed exam paper"

A chunk of history that the model is **never allowed to see** during training,
kept sealed so it can be marked honestly at the end. If a model does well on
data it has never seen, it has genuinely learned something.

### Drift — "is it still accurate *now*?"

A model is trained on the past. If customer behaviour changes, the model quietly
becomes wrong while still sounding confident. Drift monitoring re-checks last
week's accuracy against the accuracy it had at training time.

Three possible readings:

| Status | Meaning |
|---|---|
| `healthy` | Recent accuracy is as good as (or better than) at training time. |
| `watch` | Slightly worse. Not a problem — just not an improvement. |
| `degraded` | More than 1.5× worse. Worth retraining or investigating. |

> **Ours currently reads `healthy`.**

### Confidence band — "the range, not just the number"

The model isn't a single opinion. It's hundreds of small models (see below) that
each make their own guess. Most of them agree, but not exactly.

We show that spread as a range: "expect about **8.2** orders, likely between
**7.0** and **9.3**". A narrow band means the model is confident; a wide band
means treat the number with caution. On the chart this is the shaded area around
the forecast line.

---

## 3. How the model learns

Both forecasts use a method called a **Random Forest**.

Imagine a single decision-maker working through a flowchart of yes/no questions:

```
Is it after 5pm?          -> yes
Is it a Friday or Saturday? -> yes
Was last week busy at this hour? -> yes
   => predict 17 orders
```

That flowchart is called a **decision tree**. One tree on its own is unreliable
— it latches onto quirks in the data.

So instead we build **300 trees**, each shown a slightly different slice of the
history and a different random subset of the clues. Each tree makes its own
prediction, and we **average them**. Individual quirks cancel out and the shared
signal survives. That crowd of trees is the "forest".

This also gives the confidence band for free: rather than only averaging the 300
guesses, we can look at how spread out they are.

### Why not something more advanced?

A Random Forest is a deliberate fit for this problem. It handles the modest
amount of data we have (a few thousand rows), needs no special scaling, copes
well with the mix of "what hour is it" and "how busy was last week" clues, and —
importantly — it can **tell you which clues it relied on**, which is what powers
the plain-English explanations on the Analytics page.

---

## 4. How training is done in three stages

This is the part that matters most for trusting the numbers, and it's the
question that started this work.

The history is split into three parts **in date order — never shuffled**:

| Stage | Share of history | Role |
|---|---|---|
| **Training** | ~70% (oldest) | The revision notes. The model studies these. |
| **Validation** | ~15% (middle) | The mock exam. Used to choose the settings. |
| **Test / holdout** | ~15% (newest) | The real exam. Marked once, at the very end. |

### Why date order matters so much

The obvious approach — shuffle everything and pick randomly — is **badly wrong**
for forecasting. If you shuffle, the model gets to study some of August while
being tested on July. It has effectively seen the future.

That produces impressive-looking scores that collapse in production. So we split
strictly oldest-to-newest, and we split on **whole days**, so no single day can
be half-studied and half-tested.

### The three stages in practice

1. **Training.** The model studies the oldest ~70% of days and learns the
   patterns.

2. **Validation.** We need to choose the model's settings (the hyperparameters).
   We try 27 combinations and see which does best on days the model didn't
   study. To be extra careful, this uses *rolling-origin* checks: repeatedly
   train on an earlier stretch and check against the stretch that follows,
   always past-to-future, so a setting has to work at several points in time
   rather than getting lucky once.

3. **Test.** The final model is scored **once** against the newest ~15% of days,
   which it has never seen in any form. This is the honest number.

### One deliberate subtlety

The published model is trained on **training + validation** combined, but
**not** on the test set. Folding the test data in as well would give a slightly
stronger model, but it would burn the sealed exam paper — and then the next
retrain would have nothing clean to be compared against. Keeping the holdout
pristine is what makes the safety check in the next section possible.

This is also why the "train" row in the results below covers more rows than the
training split alone: it's scoring the final model against everything it studied.

### The safety gate

A newly trained model **does not automatically go live**. The new model and the
current live model are both scored on the same fresh holdout, and the new one
only replaces the old if it isn't worse. A bad retrain cannot silently degrade
the Analytics page.

---

## 5. The current results

Trained 9 September 2026 on 11,252 real orders spanning 240 days.

### Busy-hours model

| Stage | Rows scored | MAE | RMSE | R² |
|---|---|---|---|---|
| Training | 1,692 | 0.809 | 1.070 | 0.836 |
| Validation | 300 | 1.143 | 1.490 | 0.746 |
| **Test (holdout)** | 300 | **1.008** | **1.319** | **0.775** |

**In plain terms:** on days it had never seen, the model predicted each hour's
order count to within **about one order**, and captured **roughly 78%** of the
real variation in how busy hours are.

### Per-dish demand model

| Stage | Rows scored | MAE | RMSE | R² |
|---|---|---|---|---|
| Training | 5,769 | 1.575 | 2.350 | 0.921 |
| Validation | 1,020 | 2.180 | 3.615 | 0.875 |
| **Test (holdout)** | 1,020 | **2.063** | **3.204** | **0.894** |

**In plain terms:** for a given dish on a given day, the forecast is typically
within **about 2 units**, capturing **roughly 89%** of the variation.

> **An honest caveat on that 2-unit figure.** It's an average across all dishes,
> so it means different things at different volumes. Garlic Naan sells around 45
> a day, so being 2 out is excellent. A slow seller like Cream of Mushroom moves
> well under one a day, so being 2 out is proportionally poor. Treat the
> forecasts for your best sellers as reliable and the ones for very slow movers
> as rough indications only.

### Chosen settings

Both models independently landed on the same configuration out of the 27 tested:
300 trees, a maximum depth of 10 questions per tree, at least 4 data points
behind every final branch, and each question considering a random
square-root-sized subset of the available clues.

### Is it overfitting?

No, and there are two signs of that.

First, the gap between training (R² 0.836) and holdout (R² 0.775) is **small**.
A memorising model shows a huge gap — near-perfect on what it studied,
collapsing on anything new.

Second, and more reassuring: the model scored **better on the holdout (MAE
1.008) than on the validation set (1.143)**. A model that had memorised its way
to a good score would go the other way.

### Which clues mattered most

The model can report how much it leaned on each clue. For busy hours:

| Clue | Share of the decision |
|---|---|
| Average over the last 28 days | 27.9% |
| Average over the last 7 days | 22.6% |
| Same hour, two weeks ago | 17.1% |
| Same hour, one week ago | 13.0% |
| Time of day | 5.1% |

**This is a sanity check that it learned something sensible.** About 80% of the
decision rests on recent trading history at that same slot — which is exactly
what an experienced manager would look at. Nothing strange is driving it.

### Current drift status

```
healthy — recent error 0.952 vs 1.008 at training time (ratio 0.944)
```

Last week's accuracy is actually marginally **better** than at training time,
which is what you want from a freshly trained model.

---

## 6. Where the data comes from

The database is filled by a seeding script,
`backend/scripts/seedRestaurant.js`, which generates a realistic trading history
for a Manchester restaurant. Current contents:

| | |
|---|---|
| Orders | 11,252 across 240 days (12 Jan – 9 Sep 2026) |
| Menu items | 30, across 10 categories |
| Bookings | 4,768 |
| Tables | 12 |
| Trading hours | 11:00 – 22:00 |
| Busiest slot | Saturday around 7:00pm |
| Recent volume | ~56 orders per day |

### Four problems that had to be fixed first

The forecasting scores were poor at first (R² of just 0.181), and it turned out
the models were fine — **the data was broken in four separate ways**. This is
worth recording, because it's the reason the results improved so much.

1. **Wrong timezone.** Order times were being written using the computer's own
   local clock, but read back as UK time. Every order was landing in the wrong
   hour, so the system thought the restaurant traded 08:00–18:00.

2. **Stale data.** Orders stopped 11 days before. Because the exam paper is
   always the *most recent* slice of history, the model was being tested almost
   entirely on dead days with no orders. It was being marked on an empty page.

3. **Every dish equally popular.** The most and least popular dishes were within
   2× of each other. Real menus are nothing like that — a few dishes dominate.
   With no real popularity differences, per-dish forecasting had nothing to
   learn. Now the spread is 66×, from Garlic Naan at the top to Cream of
   Mushroom at the bottom.

4. **Prices were in the wrong currency.** Values were rupee amounts with a `£`
   sign attached — the average item was priced at £786. Now realistic GBP,
   £2.20 to £24.90.

A related bug was found in the service itself: the database connection wasn't
returning timezone information, so the UK-time conversion was silently doing
nothing. That's fixed, with tests to stop it recurring.

---

## 7. The `ml-service/` folder, file by file

### The files that do the forecasting

| File | What it does |
|---|---|
| `app.py` | The web server. Receives requests from the Node backend and returns forecasts as JSON. Every endpoint lives here. |
| `peak_hours.py` | The busy-hours model, end to end: reads orders from MongoDB, trains, forecasts the week, checks drift. The biggest file, and the one that talks to the database. |
| `item_demand.py` | The per-dish 7-day demand model, same shape as above but working per item per day. |
| `popular_items.py` | Hot sellers and quiet dishes. Straightforward counting rather than forecasting. |

### The shared building blocks

| File | What it does |
|---|---|
| `config.py` | Central settings: timezone handling, and working out the trading window from when orders actually arrive rather than assuming fixed hours. |
| `features.py` | Turns raw order timestamps into the clues the model learns from — hour, weekday, last week's count, rolling averages. Also writes the plain-English explanations shown on the Analytics page. |
| `model_training.py` | The training machinery: splitting history by date, trying the 27 setting combinations, fitting the forest, and producing confidence bands. Shared by both models. |
| `evaluation.py` | Scoring (MAE, RMSE, R²), the safety gate that decides whether a new model goes live, and the drift check. |

### Operations

| File | What it does |
|---|---|
| `train.py` | Command-line training. This is what you run by hand; it prints the three-stage results. |
| `scheduler.py` | Background timer that retrains both models nightly at 03:30, so forecasts don't go stale. |
| `requirements.txt` | The Python packages needed. |
| `.env.example` | Template for configuration. Copy to `.env` and set your database connection. |
| `README.md` | The technical version of this document, for developers. |

### Generated files (not written by hand)

| Path | What it is |
|---|---|
| `models/peak_hours.joblib` | The saved trained busy-hours model. |
| `models/peak_hours_meta.json` | Its report card: all three stages' scores, chosen settings, feature importances, training date. |
| `models/item_demand.joblib` | The saved per-dish model. |
| `models/item_demand_meta.json` | Its report card. |
| `__pycache__/` | Python's own cache. Ignore it. |

### Related files outside this folder

| Path | What it does |
|---|---|
| `backend/scripts/seedRestaurant.js` | Generates the trading history in the database. |
| `backend/utils/peakHours.js` | A simpler backup forecast in the Node backend, used if this Python service is unreachable, so the Analytics page still works. |
| `backend/utils/menuInsights.js` | The same idea for menu insights. |
| `backend/controllers/analyticsController.js` | Passes requests from the admin panel through to this service. |

---

## 8. How it was tested

Testing happens at three levels. All of it currently passes.

### Level 1 — Automated tests (83 Python + 8 JavaScript)

Small checks that each run a single piece of logic and confirm it behaves. They
run in about 9 seconds and are the safety net against future changes quietly
breaking something.

| Test file | Checks | What it guards |
|---|---|---|
| `test_features.py` | 21 | That the clues are built correctly — and critically, that a slot's own order count can never leak into its own clues, which would be cheating. |
| `test_evaluation.py` | 18 | The scoring maths, the promotion gate, and drift detection. |
| `test_service_window.py` | 17 | Trading-hours detection, and that the still-in-progress current day is excluded from both training and accuracy checks. |
| `test_model_training.py` | 15 | That the date-order split is genuinely chronological with no overlap between the three stages. This is the anti-cheating test. |
| `test_config.py` | 5 | Timezone conversion, including the GMT/BST switch. |
| `test_popular_items.py` | 4 | That every ranked dish ends up with an image, falling back from the order to the menu catalogue to a placeholder. |
| `test_mongo_client.py` | 3 | That the database connection returns timezone information — the bug described in section 6. |

The JavaScript tests cover the Node backup forecast: that dish images always
resolve, that timezone handling matches the Python side, and that the payload
the admin chart reads is the right shape.

### Level 2 — The three-stage training check

Described in [section 4](#4-how-training-is-done-in-three-stages). This is the
test of the *model*, rather than of the code. It answers "is this thing actually
accurate on data it has never seen?"

### Level 3 — End-to-end verification against real data

Running the full pipeline against the live database and reading the output to
confirm it's sensible, not just that it doesn't crash. Confirmed:

- Trading window detected as 11:00–22:00, matching the database exactly.
- Busiest slot identified as Saturday 7:00pm — correct.
- Hot sellers and quiet dishes match the seeded popularity.
- Every dish has an image.
- Forecasts show sensible weekly shape, peaking Friday and Saturday.
- Plain-English explanations generate correctly.
- Data-freshness check correctly reports orders arriving normally.

### Continuous checking, once running

Two things are monitored automatically and surface on the Analytics page:

- **Drift** — is accuracy holding up? (Explained in section 2.)
- **Coverage** — are orders still arriving? If orders stop reaching the database,
  the forecasts and accuracy figures become meaningless, so this flags it
  explicitly rather than showing confident nonsense.

---

## 9. Everyday commands

All run from the `ml-service` folder unless stated. On Windows PowerShell:

```powershell
cd "E:\Hassan's Project\ml-service"
```

**Train both models and see the three-stage results:**

```powershell
.\.venv\Scripts\python.exe train.py
```

Takes about 5 minutes, because it's testing 27 setting combinations per model.
Add `--only peak` or `--only items` to do just one, or `--fast` to try far fewer
combinations when you just want a quick result and don't mind a weaker model.

The first line it prints is which grid it used, for example
`Tuning grid: full (27 combinations)`. Glance at it — that's your confirmation
the run was thorough.

**Start the service:**

```powershell
.\.venv\Scripts\python.exe app.py
```

**Run the automated tests:**

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -t .
```

Takes about 9 seconds. The test suite shrinks the settings search on its own, so
there is nothing to configure and nothing you can forget.

> **A footgun that has been removed.** Earlier, tests required you to set
> `TUNING_PROFILE=fast` by hand. Because terminal settings persist, that `fast`
> could still be active when you later trained for real — silently tuning the
> shipped model over 4 combinations instead of 27. This happened once during
> development. Now the tests set it themselves and `train.py` pins its own
> value, so the two can no longer interfere. You never need to touch this
> setting.

**Refill the database with fresh trading history:**

```powershell
cd "E:\Hassan's Project\backend"
node scripts/seedRestaurant.js
```

This **erases and replaces** all orders, bookings, menu items, tables and
feedback. It does not touch user accounts. Retrain afterwards, since the
underlying data will have changed.

**Check the service is healthy** — visit `http://localhost:5001/health`, which
reports whether a model is loaded, when it was trained, and the nightly
scheduler's status.

---

## 10. Warning signs to watch for

If the Analytics page starts looking wrong, these are the things to check, in
plain terms.

| What you see | What it means | What to do |
|---|---|---|
| Drift says `degraded` | Recent accuracy is more than 1.5× worse than at training time. Customer behaviour may have genuinely shifted. | Retrain. If it persists after retraining, the pattern has changed in a way the current clues don't capture. |
| A message that orders have stopped arriving | The coverage check has spotted a collapse in daily volume — usually orders not reaching the database rather than a quiet week. | Fix the data flow first. Forecasts and accuracy figures are meaningless until it recovers. |
| R² below 0 in a training run | The model is doing worse than simply guessing the average. Almost always a data problem, not a model problem. | Check the four issues in section 6 — especially staleness and timezone. |
| Very wide confidence bands | The trees disagree strongly; the model is genuinely unsure about that slot. | Treat the number as a rough guide. Usually means little history for that slot. |
| Trading window looks wrong | Hours are detected from the data, so a wrong window means order timestamps are wrong. | Check the timezone settings. This was the root cause of the original problem. |
| A dish missing from the demand forecast | It needs a few weeks of steady sales before a forecast means anything. | Nothing — this is the system correctly refusing to guess. |

### One thing worth repeating

**Almost every problem encountered in this work was a data problem, not a model
problem.** The models were fine from early on; the scores were poor because the
data feeding them was in the wrong timezone, out of date, and unrealistically
uniform. If the forecasts ever look wrong, suspect the data first.
