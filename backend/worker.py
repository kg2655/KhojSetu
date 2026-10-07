"""One opt-in worker per field unit; interrupted waits stop promptly."""
import os
import random
import time
from threading import Event, Thread

class SyncWorker:
    def __init__(self, store):
        self.store, self.stop_event = store, Event()
        self.thread = Thread(target=self.run, name="khojsetu-exchange", daemon=True)

    def start(self):
        self.thread.start()

    def close(self):
        self.store.stopping = True
        self.stop_event.set()
        self.thread.join()  # HTTP calls are time-bounded; do not close SQLite underneath them.

    def run(self):
        failures, due = 0, time.monotonic() + 30
        while not self.stop_event.wait(1):
            with self.store.lock:
                enabled = (self.store.setting("autoSync","false") == "true" and
                           self.store.setting("fieldMode","true") == "false")
                metered = self.store.setting("metered","false") == "true"
            if not enabled:
                due, failures = time.monotonic() + 2, 0
                continue
            if time.monotonic() < due:
                continue
            try:
                self.store.sync(os.getenv("KHOJ_SYNC_URL","http://127.0.0.1:8010"),
                                os.getenv("KHOJ_SYNC_TOKEN",""), metered)
                failures = 0
            except (ConnectionError, ValueError):
                failures = min(failures + 1, 5)
            delay = min(300, 30 * (2 ** failures)) + random.uniform(0,3)
            due = time.monotonic() + delay
            with self.store.lock:
                self.store.set_setting("nextSync", time.time() + delay)
