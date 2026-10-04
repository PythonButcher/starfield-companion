"""Explicit, loss-averse migration from the checkpoint database path."""
from contextlib import closing
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def copy_checkpoint(source: Path, target: Path):
    source, target = source.resolve(), target.resolve()
    if source == target or not source.is_file():
        raise ValueError('Choose an existing checkpoint source distinct from the target.')
    backup = None
    if target.exists():
        with closing(sqlite3.connect(target.as_uri() + '?mode=ro', uri=True)) as connection:
            tables = [r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
            # Never overwrite a populated destination, including unfamiliar tables.
            if any(connection.execute('SELECT count(*) FROM "' + name.replace('"', '""') + '"').fetchone()[0] for name in tables):
                raise ValueError('Destination contains records. Stop and merge explicitly; no files were changed.')
            stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
            backup = target.with_name(target.stem + '.legacy-' + stamp + '.db')
            with closing(sqlite3.connect(backup)) as saved:
                connection.backup(saved)
    temporary = target.with_name(target.name + '.migration-tmp')
    if temporary.exists():
        raise ValueError('A migration temporary file already exists; inspect it before retrying.')
    try:
        with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as original:
            with closing(sqlite3.connect(temporary)) as copied:
                original.backup(copied)
                if copied.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise ValueError('Copied database failed integrity check.')
        # SQLite's backup transaction also works when a reader holds the file
        # open on Windows, where replacing the directory entry is prohibited.
        with closing(sqlite3.connect(temporary)) as verified:
            with closing(sqlite3.connect(target)) as destination:
                verified.backup(destination)
    finally:
        temporary.unlink(missing_ok=True)
    return backup
