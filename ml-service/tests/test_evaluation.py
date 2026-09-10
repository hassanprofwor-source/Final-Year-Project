import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from evaluation import (
    METRIC_HISTORY_LIMIT,
    append_history,
    drift_report,
    promotion_decision,
    regression_metrics,
)


class RegressionMetricTests(unittest.TestCase):
    def test_perfect_predictions_score_cleanly(self):
        metrics = regression_metrics([1, 2, 3, 4], [1, 2, 3, 4])
        self.assertEqual(metrics["mae"], 0.0)
        self.assertEqual(metrics["rmse"], 0.0)
        self.assertEqual(metrics["r2"], 1.0)
        self.assertEqual(metrics["rows"], 4)

    def test_rmse_penalises_large_errors_more_than_mae(self):
        metrics = regression_metrics([0, 0, 0, 10], [0, 0, 0, 0])
        self.assertGreater(metrics["rmse"], metrics["mae"])

    def test_r2_is_omitted_for_a_constant_target(self):
        self.assertIsNone(regression_metrics([5, 5, 5], [4, 5, 6])["r2"])

    def test_single_row_has_no_r2(self):
        self.assertIsNone(regression_metrics([5], [4])["r2"])

    def test_empty_input_returns_nothing(self):
        self.assertIsNone(regression_metrics([], []))


class PromotionTests(unittest.TestCase):
    def test_better_challenger_is_promoted(self):
        decision = promotion_decision({"mae": 1.0}, {"mae": 1.4})
        self.assertTrue(decision["promote"])

    def test_clearly_worse_challenger_is_rejected(self):
        decision = promotion_decision({"mae": 2.0}, {"mae": 1.0})
        self.assertFalse(decision["promote"])
        self.assertIn("worse", decision["reason"])

    def test_marginally_worse_challenger_is_still_promoted(self):
        self.assertTrue(promotion_decision({"mae": 1.02}, {"mae": 1.0})["promote"])

    def test_first_ever_model_is_promoted(self):
        self.assertTrue(promotion_decision({"mae": 3.0}, None)["promote"])

    def test_unmeasurable_challenger_is_promoted_by_default(self):
        self.assertTrue(promotion_decision(None, {"mae": 1.0})["promote"])


class DriftTests(unittest.TestCase):
    def test_matching_error_is_healthy(self):
        report = drift_report({"mae": 1.0}, {"mae": 1.0})
        self.assertEqual(report["status"], "healthy")
        self.assertEqual(report["ratio"], 1.0)

    def test_mild_increase_is_flagged_to_watch(self):
        self.assertEqual(drift_report({"mae": 1.2}, {"mae": 1.0})["status"], "watch")

    def test_large_increase_is_degraded(self):
        report = drift_report({"mae": 3.0}, {"mae": 1.0})
        self.assertEqual(report["status"], "degraded")
        self.assertIn("retraining", report["message"])

    def test_missing_live_metric_is_unknown(self):
        self.assertEqual(drift_report(None, {"mae": 1.0})["status"], "unknown")

    def test_missing_baseline_is_unknown(self):
        self.assertEqual(drift_report({"mae": 1.0}, None)["status"], "unknown")


class HistoryTests(unittest.TestCase):
    def test_entries_are_appended_in_order(self):
        history = append_history([{"at": "1"}], {"at": "2"})
        self.assertEqual([entry["at"] for entry in history], ["1", "2"])

    def test_history_is_capped_and_keeps_the_newest(self):
        history = []
        for index in range(METRIC_HISTORY_LIMIT + 10):
            history = append_history(history, {"at": str(index)})
        self.assertEqual(len(history), METRIC_HISTORY_LIMIT)
        self.assertEqual(history[-1]["at"], str(METRIC_HISTORY_LIMIT + 9))

    def test_none_history_is_treated_as_empty(self):
        self.assertEqual(append_history(None, {"at": "1"}), [{"at": "1"}])


if __name__ == "__main__":
    unittest.main()
