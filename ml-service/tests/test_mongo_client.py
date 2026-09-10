import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import peak_hours


class MongoClientTimezoneTests(unittest.TestCase):
    """The conversion helpers are only reachable if Mongo hands back aware values.

    to_local_naive deliberately passes naive datetimes through untouched, so a
    client built without tz_aware turns the whole local-time conversion into a
    no-op and files every order under its UTC hour instead of its London hour.
    """

    def test_collection_is_opened_with_a_timezone_aware_client(self):
        with patch.dict(os.environ, {"MONGO_URI": "mongodb://localhost:27017"}):
            with patch("peak_hours.MongoClient") as client:
                peak_hours.get_collection()

        self.assertTrue(client.call_args.kwargs.get("tz_aware"))

    def test_an_aware_order_is_read_in_local_time(self):
        doc = {"createdAt": datetime(2026, 7, 1, 20, 30, tzinfo=timezone.utc)}
        with patch.dict(os.environ, {"ANALYTICS_TZ": "Europe/London"}):
            parsed = peak_hours.parse_order_datetime(doc)
        self.assertEqual(parsed.hour, 21)

    def test_date_and_time_strings_are_already_local(self):
        doc = {"date": "01-07-2026", "time": "19:00"}
        parsed = peak_hours.parse_order_datetime(doc)
        self.assertEqual((parsed.day, parsed.month, parsed.hour), (1, 7, 19))


if __name__ == "__main__":
    unittest.main()
