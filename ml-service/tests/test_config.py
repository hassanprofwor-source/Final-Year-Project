import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config


class TimezoneConversionTests(unittest.TestCase):
    def setUp(self):
        self._previous = os.environ.get("ANALYTICS_TZ")
        os.environ["ANALYTICS_TZ"] = "Europe/London"

    def tearDown(self):
        if self._previous is None:
            os.environ.pop("ANALYTICS_TZ", None)
        else:
            os.environ["ANALYTICS_TZ"] = self._previous

    def test_summer_utc_is_converted_to_bst(self):
        utc = datetime(2026, 7, 1, 12, 0, tzinfo=timezone.utc)
        local = config.to_local_naive(utc)
        self.assertEqual(local.hour, 13)
        self.assertIsNone(local.tzinfo)

    def test_winter_utc_matches_gmt(self):
        utc = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
        self.assertEqual(config.to_local_naive(utc).hour, 12)

    def test_late_evening_utc_rolls_into_next_day(self):
        utc = datetime(2026, 7, 1, 23, 30, tzinfo=timezone.utc)
        local = config.to_local_naive(utc)
        self.assertEqual((local.day, local.hour), (2, 0))

    def test_naive_values_pass_through_untouched(self):
        naive = datetime(2026, 7, 1, 19, 0)
        self.assertEqual(config.to_local_naive(naive), naive)

    def test_non_datetime_returns_none(self):
        self.assertIsNone(config.to_local_naive("2026-07-01"))


if __name__ == "__main__":
    unittest.main()
