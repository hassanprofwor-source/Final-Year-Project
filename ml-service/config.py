import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

DEFAULT_TZ_NAME = "Europe/London"

SERVICE_HOUR_START = int(os.getenv("SERVICE_HOUR_START", "12"))
SERVICE_HOUR_END = int(os.getenv("SERVICE_HOUR_END", "22"))
SERVICE_HOURS = list(range(SERVICE_HOUR_START, SERVICE_HOUR_END + 1))

# Pinning both ends disables detection, for sites that want a fixed axis.
SERVICE_HOURS_PINNED = bool(
    os.getenv("SERVICE_HOUR_START") and os.getenv("SERVICE_HOUR_END")
)

# Hours holding at least this share of the busiest hour's volume count as open.
SERVICE_HOUR_THRESHOLD = float(os.getenv("SERVICE_HOUR_THRESHOLD", "0.05"))
MIN_SERVICE_SPAN = 6


def detect_service_hours(timestamps, threshold=SERVICE_HOUR_THRESHOLD):
    """Infer the trading window from when orders actually arrive.

    A hardcoded window silently drops every order outside it and asks the model
    to forecast hours the kitchen never trades in, so the window is read from the
    data unless both ends are pinned by environment variables.
    """
    if SERVICE_HOURS_PINNED or not timestamps:
        return list(SERVICE_HOURS)

    counts = Counter(stamp.hour for stamp in timestamps)
    if not counts:
        return list(SERVICE_HOURS)

    floor = max(counts.values()) * threshold
    active = sorted(hour for hour, count in counts.items() if count >= floor)
    if not active:
        return list(SERVICE_HOURS)

    start, end = active[0], active[-1]
    while end - start + 1 < MIN_SERVICE_SPAN and (start > 0 or end < 23):
        if end < 23:
            end += 1
        if end - start + 1 < MIN_SERVICE_SPAN and start > 0:
            start -= 1

    return list(range(start, end + 1))

# Lag/rolling features need three weeks of history before they carry signal.
MIN_REAL_ORDERS = int(os.getenv("MIN_REAL_ORDERS", "20"))
MIN_TRAIN_DAYS = int(os.getenv("MIN_TRAIN_DAYS", "21"))
TRAIN_WINDOW_DAYS = int(os.getenv("TRAIN_WINDOW_DAYS", "180"))

MODEL_DIR = Path(__file__).resolve().parent / "models"


def analytics_tz():
    name = os.getenv("ANALYTICS_TZ", DEFAULT_TZ_NAME)
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo(DEFAULT_TZ_NAME)


def to_local_naive(value):
    """Convert an aware datetime into local wall-clock time, then drop tzinfo.

    Mongo hands back UTC-aware datetimes. Dropping tzinfo without converting
    first shifts every order by the UTC offset, which silently moves orders
    into the wrong hour bucket during BST.
    """
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is not None:
        return value.astimezone(analytics_tz()).replace(tzinfo=None)
    return value


def now_local():
    return datetime.now(timezone.utc).astimezone(analytics_tz()).replace(tzinfo=None)


def format_hour_label(hour):
    suffix = "AM" if hour < 12 else "PM"
    display = hour % 12
    if display == 0:
        display = 12
    return f"{display}:00 {suffix}"
