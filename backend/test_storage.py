from contextlib import closing
import sqlite3
import pytest
from storage_migration import copy_checkpoint


def test_checkpoint_copy_preserves_source_and_empty_legacy_backup(tmp_path):
    source, target = tmp_path / 'source.db', tmp_path / 'starfield.db'
    with closing(sqlite3.connect(source)) as c, c:
        c.execute('create table player (note text)')
        c.execute("insert into player values ('Keep this')")
    with closing(sqlite3.connect(target)) as c, c:
        c.execute('create table legacy (id integer)')
    backup = copy_checkpoint(source, target)
    assert backup.is_file() and source.is_file()
    with closing(sqlite3.connect(target)) as c, c:
        assert c.execute('select note from player').fetchone()[0] == 'Keep this'
    with pytest.raises(ValueError, match='contains records'):
        copy_checkpoint(source, target)
    with closing(sqlite3.connect(target)) as c, c:
        assert c.execute('select note from player').fetchone()[0] == 'Keep this'
