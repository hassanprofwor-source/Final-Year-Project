import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np

import config
import peak_hours
from config import MIN_SERVICE_SPAN, SERVICE_HOURS, detect_service_hours

START = datetime(2026, 1, 5)


def stamps_at_hours(hour_counts, days=10):
    stamps = []
    for offset in range(days):
        day = START + timedelta(days=offset)
        for hour, count in hour_counts.items():
            for index in range(count):
                stamps.append(day.replace(hour=hour, minute=index % 60))
    return stamps


class DetectServiceHoursTests(unittest.TestCase):
    def test_daytime_trade_is_detected(self):
        hours = detect_service_hours(
            stamps_at_hours({7: 30, 8: 30, 9: 28, 12: 10, 13: 35, 14: 40, 15: 38, 16: 38, 17: 24})
        )
        self.assertEqual(hours[0], 7)
        self.assertEqual(hours[-1], 17)

    def test_evening_trade_is_detected(self):
        hours = detect_service_hours(
            stamps_at_hours({17: 10, 18: 30, 19: 45, 20: 40, 21: 25, 22: 12})
        )
        self.assertEqual((hours[0], hours[-1]), (17, 22))

    def test_stray_off_hours_orders_are_excluded(self):
        hours = detect_service_hours(
            stamps_at_hours({2: 1, 12: 40, 13: 45, 14: 42, 15: 40, 16: 38, 17: 30, 23: 1})
        )
        self.assertNotIn(2, hours)
        self.assertNotIn(23, hours)
        self.assertEqual((hours[0], hours[-1]), (12, 17))

    def test_detected_window_is_contiguous(self):
        hours = detect_service_hours(
            stamps_at_hours({7: 40, 8: 40, 12: 40, 13: 40, 17: 40})
        )
        self.assertEqual(hours, list(range(hours[0], hours[-1] + 1)))

    def test_narrow_trade_is_widened_to_a_usable_span(self):
        hours = detect_service_hours(stamps_at_hours({13: 40, 14: 40}))
        self.assertGreaterEqual(len(hours), MIN_SERVICE_SPAN)

    def test_no_orders_falls_back_to_the_configured_window(self):
        self.assertEqual(detect_service_hours([]), list(SERVICE_HOURS))

    def test_pinned_configuration_wins(self):
        original = config.SERVICE_HOURS_PINNED
        config.SERVICE_HOURS_PINNED = True
        try:
            hours = detect_service_hours(stamps_at_hours({7: 50, 8: 50, 9: 50}))
            self.assertEqual(hours, list(SERVICE_HOURS))
        finally:
            config.SERVICE_HOURS_PINNED = original


class ActiveHoursTests(unittest.TestCase):
    def setUp(self):
        self._original = peak_hours.active_hours()

    def tearDown(self):
        peak_hours.set_active_hours(self._original)

    def test_setting_the_window_changes_the_week_shape(self):
        peak_hours.set_active_hours([7, 8, 9, 10])
        self.assertEqual(peak_hours.active_hours(), [7, 8, 9, 10])
        self.assertEqual(len(peak_hours.empty_week()["Monday"]), 4)

    def test_invalid_hours_are_ignored(self):
        peak_hours.set_active_hours([7, 8, 99, -3])
        self.assertEqual(peak_hours.active_hours(), [7, 8])

    def test_empty_input_keeps_the_previous_window(self):
        peak_hours.set_active_hours([12, 13, 14])
        peak_hours.set_active_hours([])
        self.assertEqual(peak_hours.active_hours(), [12, 13, 14])

    def test_accessor_returns_a_copy(self):
        hours = peak_hours.active_hours()
        hours.append(99)
        self.assertNotIn(99, peak_hours.active_hours())


class CoverageTests(unittest.TestCase):
    def test_steady_volume_is_not_flagged(self):
        stamps = []
        for offset in range(40):
            day = peak_hours.now_local() - timedelta(days=offset)
            for index in range(20):
                stamps.append(day.replace(hour=13, minute=index % 60))
        self.assertFalse(peak_hours.data_coverage(stamps)["stalled"])

    def test_collapsed_recent_volume_is_flagged(self):
        stamps = []
        now = peak_hours.now_local()
        for offset in range(8, 45):
            day = now - timedelta(days=offset)
            for index in range(20):
                stamps.append(day.replace(hour=13, minute=index % 60))
        stamps.append((now - timedelta(days=1)).replace(hour=13, minute=0))

        coverage = peak_hours.data_coverage(stamps)
        self.assertTrue(coverage["stalled"])
        self.assertLess(coverage["recentDailyMean"], coverage["priorDailyMean"])
        self.assertIn("Order volume", coverage["message"])

    def test_no_orders_reports_no_coverage(self):
        coverage = peak_hours.data_coverage([])
        self.assertIsNone(coverage["lastOrderAt"])
        self.assertFalse(coverage["stalled"])


class CompleteDaysTests(unittest.TestCase):
    def test_todays_partial_data_is_excluded(self):
        now = peak_hours.now_local()
        stamps = [
            now.replace(hour=13, minute=0),
            (now - timedelta(days=1)).replace(hour=13, minute=0),
        ]
        kept = peak_hours.complete_days_only(stamps)
        self.assertEqual(len(kept), 1)
        self.assertLess(kept[0].date(), now.date())

    def test_older_days_are_untouched(self):
        now = peak_hours.now_local()
        stamps = [(now - timedelta(days=offset)).replace(hour=13) for offset in range(1, 6)]
        self.assertEqual(len(peak_hours.complete_days_only(stamps)), 5)

    def test_live_accuracy_ignores_the_in_progress_day(self):
        """Drift is measured on complete days only, matching the training loader.

        Scoring a full-evening prediction against a day whose evening has not
        happened yet reports drift that is really just the time of day.
        """
        now = peak_hours.now_local()
        hours = [12, 13]
        stamps = []
        for offset in range(1, 30):
            day = (now - timedelta(days=offset)).replace(minute=0, second=0, microsecond=0)
            for hour in hours:
                stamps.extend([day.replace(hour=hour)] * 4)

        class ConstantModel:
            def predict(self, matrix):
                return np.full(len(matrix), 4.0)

        complete = peak_hours.live_accuracy(ConstantModel(), stamps, hours=hours)
        self.assertIsNotNone(complete)
        self.assertAlmostEqual(complete["mae"], 0.0, places=6)

        # One lone order today would otherwise drag a perfect model off target.
        with_partial = peak_hours.live_accuracy(
            ConstantModel(),
            stamps + [now.replace(hour=12, minute=0, second=0, microsecond=0)],
            hours=hours,
        )
        self.assertAlmostEqual(with_partial["mae"], 0.0, places=6)


if __name__ == "__main__":
    unittest.main()
