import os
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ.setdefault("TUNING_PROFILE", "fast")

import numpy as np

from features import build_training_frame, feature_matrix, target_vector
from model_training import (
    chronological_split,
    model_matches_features,
    tree_quantiles,
    train_peak_hours_model,
)

START = datetime(2026, 1, 5)

_TRAINED = {}


def busy_history(days=120):
    stamps = []
    for offset in range(days):
        day = START + timedelta(days=offset)
        weekend = day.weekday() >= 5
        for hour in (12, 13, 19, 20, 21):
            volume = 4 if hour >= 19 else 2
            if weekend:
                volume += 2
            for _ in range(volume):
                stamps.append(day.replace(hour=hour, minute=10))
    return stamps


def trained_once():
    """Tuning is expensive, so every test class reuses one fitted model."""
    if not _TRAINED:
        frame = build_training_frame(busy_history())
        _TRAINED["frame"] = frame
        _TRAINED["result"] = train_peak_hours_model(frame)
    return _TRAINED["frame"], _TRAINED["result"]


class ChronologicalSplitTests(unittest.TestCase):
    def setUp(self):
        self.frame, _result = trained_once()

    def test_every_split_is_strictly_later_than_the_last(self):
        train, val, test = chronological_split(self.frame)
        self.assertLess(train["date"].max(), val["date"].min())
        self.assertLess(val["date"].max(), test["date"].min())

    def test_no_day_appears_in_two_splits(self):
        train, val, test = chronological_split(self.frame)
        train_days = set(train["date"].unique())
        val_days = set(val["date"].unique())
        test_days = set(test["date"].unique())
        self.assertEqual(train_days & val_days, set())
        self.assertEqual(val_days & test_days, set())
        self.assertEqual(train_days & test_days, set())

    def test_all_rows_are_accounted_for(self):
        train, val, test = chronological_split(self.frame)
        self.assertEqual(len(train) + len(val) + len(test), len(self.frame))

    def test_split_sizes_are_roughly_seventy_fifteen_fifteen(self):
        train, val, test = chronological_split(self.frame)
        total_days = self.frame["date"].nunique()
        self.assertAlmostEqual(
            train["date"].nunique() / total_days, 0.70, delta=0.05
        )
        self.assertAlmostEqual(val["date"].nunique() / total_days, 0.15, delta=0.05)
        self.assertAlmostEqual(test["date"].nunique() / total_days, 0.15, delta=0.05)

    def test_tiny_frames_degrade_without_raising(self):
        small = self.frame.head(2)
        train, val, test = chronological_split(small)
        self.assertEqual(len(train), 2)
        self.assertTrue(val.empty)
        self.assertTrue(test.empty)


class TrainingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.frame, cls.result = trained_once()

    def test_split_is_applied_with_enough_history(self):
        self.assertTrue(self.result["splitApplied"])
        self.assertIsNotNone(self.result["model"])

    def test_validation_and_test_metrics_are_reported_separately(self):
        metrics = self.result["metrics"]
        for stage in ("train", "validation", "test"):
            self.assertIsNotNone(metrics[stage], stage)
            self.assertIn("mae", metrics[stage])
            self.assertIn("rmse", metrics[stage])
            self.assertIn("r2", metrics[stage])

    def test_holdout_rows_are_excluded_from_the_fitted_model(self):
        rows = self.result["rows"]
        self.assertGreater(rows["test"], 0)
        self.assertGreater(rows["validation"], 0)
        self.assertEqual(
            rows["train"] + rows["validation"] + rows["test"], len(self.frame)
        )

    def test_model_learns_the_weekend_pattern(self):
        # A predictable synthetic pattern should be well inside one order of error.
        self.assertLess(self.result["metrics"]["test"]["mae"], 1.5)

    def test_sparse_history_skips_tuning_but_still_fits(self):
        stamps = [
            (START + timedelta(days=offset)).replace(hour=19)
            for offset in range(20)
        ]
        result = train_peak_hours_model(build_training_frame(stamps))
        self.assertFalse(result["splitApplied"])
        self.assertIsNone(result["metrics"]["test"])


class TreeQuantileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.frame, cls.result = trained_once()

    def test_bands_are_ordered_and_bracket_the_median(self):
        X = feature_matrix(self.frame.head(40))
        bands = tree_quantiles(self.result["model"], X)
        self.assertTrue(np.all(bands[10] <= bands[50] + 1e-9))
        self.assertTrue(np.all(bands[50] <= bands[90] + 1e-9))

    def test_band_width_is_non_negative(self):
        X = feature_matrix(self.frame.head(40))
        bands = tree_quantiles(self.result["model"], X)
        self.assertTrue(np.all(bands[90] - bands[10] >= 0))

    def test_quantiles_of_no_rows_are_empty(self):
        bands = tree_quantiles(self.result["model"], np.empty((0, 11)))
        self.assertEqual(len(bands[50]), 0)

    def test_missing_model_returns_zero_bands(self):
        bands = tree_quantiles(None, np.zeros((3, 11)))
        self.assertEqual(list(bands[50]), [0, 0, 0])


class SavedModelCompatibilityTests(unittest.TestCase):
    def test_current_feature_count_is_accepted(self):
        model = type("Forest", (), {"n_features_in_": 11})()
        self.assertTrue(model_matches_features(model, ["a"] * 11))

    def test_older_three_feature_model_is_rejected(self):
        model = type("Forest", (), {"n_features_in_": 3})()
        self.assertFalse(model_matches_features(model, ["a"] * 11))


class TargetTests(unittest.TestCase):
    def test_target_vector_matches_row_count(self):
        frame = build_training_frame(busy_history(60))
        self.assertEqual(len(target_vector(frame)), len(frame))
        self.assertEqual(feature_matrix(frame).shape[0], len(frame))


if __name__ == "__main__":
    unittest.main()
