"""Connect copied-save metadata to the app without writing player models."""

from datetime import datetime, timezone
from threading import Lock

from save_reader import SaveReadError, extract_save, newest_save


class PlaythroughConnection:
    """Retain only the last successful metadata snapshot for this app process.

    A lock keeps concurrent refreshes ordered. No decompressed save bytes are
    retained, and changing the configured folder clears the old folder's data.
    """

    def __init__(self):
        self._lock = Lock()
        self._folder = ''
        self._snapshot = None

    def read(self, folder: str) -> dict:
        folder = folder.strip()
        with self._lock:
            if folder != self._folder:
                self._folder = folder
                self._snapshot = None
            error = None
            status = 'not_configured'
            if folder:
                try:
                    self._snapshot = extract_save(newest_save(folder)).snapshot
                    status = 'ready'
                except SaveReadError as exc:
                    status = 'stale' if self._snapshot is not None else 'unavailable'
                    error = {'code': exc.code, 'message': str(exc)}
            return {
                'status': status,
                'snapshot': self._snapshot,
                'error': error,
                'checked_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            }
