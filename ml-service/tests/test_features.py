import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd

from config import SERVICE_HOURS
from features import (
    FEATURE_COLUMNS,
    LAG_WARMUP_DAYS,
    build_forecast_frame,
    build_training_frame,
    describe_drivers,
    hourly_grid,
)

START = datetime(2026, 1, 5)


def stamps_every_day(days, hour, count_per_day=1, start=START):
    stamps = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        for _ in range(count_per_day):
            stamps.append(day.replace(hour=hour, minute=15))
    return stamps


class HourlyGridTests(unittest.TestCase):
    def test_quiet_hours_become_zero_rows(self):
        grid = hourly_grid(stamps_every_day(3, 19))
        self.assertEqual(len(grid), 3 * len(SERVICE_HOURS))
        self.assertEqual(grid[grid["hour"] == 19]["order_count"].tolist(), [1, 1, 1])
        self.assertEqual(grid[grid["hour"] == 13]["order_count"].sum(), 0.0)

    def test_days_with_no_orders_are_still_represented(self):
        stamps = [
            START.replace(hour=19),
            (START + timedelta(days=3)).replace(hour=19),
        ]
        grid = hourly_grid(stamps)
        self.assertEqual(grid["date"].nunique(), 4)
        self.assertEqual(grid["order_count"].sum(), 2.0)

    def test_hours_outside_service_window_are_dropped(self):
        grid = hourly_grid([START.replace(hour=3), START.replace(hour=19)])
        self.assertEqual(grid["order_count"].sum(), 1.0)

    def test_empty_input_returns_empty_grid(self):
        self.assertTrue(hourly_grid([]).empty)


class CyclicalEncodingTests(unittest.TestCase):
    def _encoding(self, frame, hour):
        row = frame[frame["hour"] == hour].iloc[0]
        return np.array([row["hour_sin"], row["hour_cos"]])

    def test_midnight_is_closer_to_late_evening_than_to_midday(self):
        grid = hourly_grid(stamps_every_day(40, 19), hours=list(range(24)))
        frame = build_training_frame(
            stamps_every_day(40, 19), hours=list(range(24))
        )
        self.assertFalse(frame.empty)
        near = np.linalg.norm(self._encoding(frame, 23) - self._encoding(frame, 0))
        far = np.linalg.norm(self._encoding(frame, 23) - self._encoding(frame, 12))
        self.assertLess(near, far)
        self.assertFalse(grid.empty)

    def test_weekend_flag_matches_calendar(self):
        frame = build_training_frame(stamps_every_day(40, 19))
        saturday = frame[frame["date"].dt.weekday == 5]
        monday = frame[frame["date"].dt.weekday == 0]
        self.assertTrue((saturday["is_weekend"] == 1).all())
        self.assertTrue((monday["is_weekend"] == 0).all())


class HistoryFeatureTests(unittest.TestCase):
    def test_lag_1w_equals_same_hour_previous_week(self):
        stamps = []
        for offset in range(40):
            day = START + timedelta(days=offset)
            for _ in range(offset % 5 + 1):
                stamps.append(day.replace(hour=19, minute=5))

        frame = build_training_frame(stamps)
        row = frame[(frame["hour"] == 19)].iloc[10]
        expected_day = row["date"] - pd.Timedelta(days=7)
        grid = hourly_grid(stamps)
        expected = grid[
            (grid["date"] == expected_day) & (grid["hour"] == 19)
        ]["order_count"].iloc[0]
        self.assertEqual(row["lag_1w"], expected)

    def test_rolling_mean_excludes_the_slot_it_describes(self):
        # Flat at two orders per day, then a single large spike on the last day.
        stamps = stamps_every_day(40, 19, count_per_day=2)
        spike_day = START + timedelta(days=39)
        stamps.extend([spike_day.replace(hour=19, minute=40)] * 50)

        frame = build_training_frame(stamps)
        last = frame[(frame["hour"] == 19)].sort_values("date").iloc[-1]
        self.assertEqual(last["order_count"], 52.0)
        self.assertAlmostEqual(last["rolling_7d_mean"], 2.0, places=6)
        self.assertAlmostEqual(last["lag_1w"], 2.0, places=6)

    def test_warmup_rows_without_full_history_are_dropped(self):
        stamps = stamps_every_day(30, 19)
        frame = build_training_frame(stamps)
        self.assertEqual(frame["date"].min(), pd.Timestamp(START) + pd.Timedelta(days=LAG_WARMUP_DAYS))

    def test_momentum_is_zero_for_a_flat_series(self):
        frame = build_training_frame(stamps_every_day(40, 19, count_per_day=3))
        self.assertTrue((frame["wow_momentum"].abs() < 1e-9).all())

    def test_momentum_is_positive_for_a_growing_series(self):
        stamps = []
        for offset in range(60):
            day = START + timedelta(days=offset)
            for _ in range(1 + offset // 7):
                stamps.append(day.replace(hour=19, minute=5))

        frame = build_training_frame(stamps)
        recent = frame[frame["hour"] == 19].sort_values("date").iloc[-1]
        self.assertGreater(recent["wow_momentum"], 0)

    def test_no_feature_column_contains_nan(self):
        frame = build_training_frame(stamps_every_day(45, 19, count_per_day=2))
        self.assertFalse(frame[FEATURE_COLUMNS].isna().any().any())


class ForecastFrameTests(unittest.TestCase):
    def test_forecast_lags_read_actuals_from_a_week_earlier(self):
        stamps = []
        for offset in range(40):
            day = START + timedelta(days=offset)
            for _ in range(offset % 4 + 1):
                stamps.append(day.replace(hour=19, minute=5))

        last_day = START + timedelta(days=39)
        targets = [pd.Timestamp(last_day) + pd.Timedelta(days=offset) for offset in range(1, 8)]
        frame = build_forecast_frame(stamps, targets)

        self.assertEqual(frame["date"].nunique(), 7)
        grid = hourly_grid(stamps)
        for target in targets:
            row = frame[(frame["date"] == target) & (frame["hour"] == 19)].iloc[0]
            source = grid[
                (grid["date"] == target - pd.Timedelta(days=7)) & (grid["hour"] == 19)
            ]
            self.assertEqual(row["lag_1w"], source["order_count"].iloc[0])

    def test_forecast_frame_has_every_service_hour(self):
        stamps = stamps_every_day(40, 19, count_per_day=2)
        targets = [pd.Timestamp(START) + pd.Timedelta(days=40)]
        frame = build_forecast_frame(stamps, targets)
        self.assertEqual(sorted(frame["hour"].tolist()), sorted(SERVICE_HOURS))

    def test_forecast_frame_is_empty_without_history(self):
        self.assertTrue(build_forecast_frame([], [pd.Timestamp(START)]).empty)


class DriverDescriptionTests(unittest.TestCase):
    ROW = {
        "hour": 15,
        "is_weekend": 0,
        "lag_1w": 4.0,
        "lag_2w": 5.0,
        "rolling_7d_mean": 4.6,
        "rolling_28d_mean": 4.8,
        "wow_momentum": 0.12,
    }

    def test_two_rolling_features_collapse_to_one_reason(self):
        # Both are "recent trade"; reporting both just repeats the same fact.
        drivers = describe_drivers(
            self.ROW,
            [("rolling_28d_mean", 0.3), ("rolling_7d_mean", 0.25), ("weekday_sin", 0.2)],
            limit=2,
        )
        self.assertEqual(len(drivers), 2)
        self.assertIn("4.8 orders", drivers[0])
        self.assertNotIn("4.6 orders", drivers[1])

    def test_weekday_name_is_used_when_supplied(self):
        drivers = describe_drivers(
            self.ROW, [("weekday_sin", 0.4)], limit=1, weekday_name="Saturday"
        )
        self.assertEqual(drivers, ["it's a Saturday"])

    def test_momentum_reports_direction_and_size(self):
        drivers = describe_drivers(self.ROW, [("wow_momentum", 0.4)], limit=1)
        self.assertEqual(drivers, ["the week-over-week trend is up 12%"])

    def test_flat_momentum_is_described_as_flat(self):
        drivers = describe_drivers(
            {**self.ROW, "wow_momentum": 0.001}, [("wow_momentum", 0.4)], limit=1
        )
        self.assertIn("flat", drivers[0])

    def test_limit_is_respected(self):
        drivers = describe_drivers(
            self.ROW,
            [
                ("rolling_28d_mean", 0.3),
                ("weekday_sin", 0.25),
                ("wow_momentum", 0.2),
                ("hour_sin", 0.15),
            ],
            limit=2,
        )
        self.assertEqual(len(drivers), 2)

    def test_no_importances_gives_no_reasons(self):
        self.assertEqual(describe_drivers(self.ROW, []), [])


if __name__ == "__main__":
    unittest.main()
