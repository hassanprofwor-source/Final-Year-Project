import os
import threading
import traceback
from datetime import timedelta

from config import now_local

DEFAULT_RETRAIN_AT = "03:30"
POLL_SECONDS = 60


def _parse_time_of_day(value):
    try:
        hour, minute = str(value).split(":")
        return int(hour) % 24, int(minute) % 60
    except (AttributeError, ValueError):
        hour, minute = DEFAULT_RETRAIN_AT.split(":")
        return int(hour), int(minute)


def next_run_at(hour, minute, reference):
    target = reference.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= reference:
        target += timedelta(days=1)
    return target


class RetrainScheduler:
    """Retrains on a fixed local time each day, in a daemon thread.

    Promotion is gated inside the training job, so a scheduled run that produces
    a worse model leaves the live one in place.
    """

    def __init__(self, job, at=None, enabled=True):
        self.job = job
        self.hour, self.minute = _parse_time_of_day(at or DEFAULT_RETRAIN_AT)
        self.enabled = enabled
        self._stop = threading.Event()
        self._thread = None
        self._last_run = None
        self._last_error = None
        self._runs = 0

    def start(self):
        if not self.enabled or self._thread is not None:
            return self
        self._thread = threading.Thread(
            target=self._loop, name="retrain-scheduler", daemon=True
        )
        self._thread.start()
        return self

    def stop(self):
        self._stop.set()

    def _loop(self):
        while not self._stop.is_set():
            target = next_run_at(self.hour, self.minute, now_local())
            while not self._stop.is_set():
                remaining = (target - now_local()).total_seconds()
                if remaining <= 0:
                    break
                self._stop.wait(min(POLL_SECONDS, remaining))
            if self._stop.is_set():
                return
            self._run_once()

    def _run_once(self):
        try:
            self.job()
            self._last_error = None
        except Exception:
            self._last_error = traceback.format_exc(limit=3)
        finally:
            self._runs += 1
            self._last_run = now_local().isoformat(timespec="seconds")

    def status(self):
        return {
            "enabled": self.enabled,
            "running": bool(self._thread and self._thread.is_alive()),
            "dailyAt": f"{self.hour:02d}:{self.minute:02d}",
            "nextRunAt": (
                next_run_at(self.hour, self.minute, now_local()).isoformat(
                    timespec="seconds"
                )
                if self.enabled
                else None
            ),
            "lastRunAt": self._last_run,
            "runs": self._runs,
            "lastError": self._last_error,
        }


def scheduler_enabled():
    return os.getenv("ENABLE_SCHEDULED_RETRAIN", "true").strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
    }


def debug_enabled():
    return os.getenv("FLASK_DEBUG", "1").strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
    }


def in_reloader_parent():
    """True in the outer process of Werkzeug's auto-reloader.

    Without this check the scheduler starts twice in debug mode and both copies
    retrain against the same model files.
    """
    return debug_enabled() and os.getenv("WERKZEUG_RUN_MAIN") is None
