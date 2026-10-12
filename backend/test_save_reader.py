"""Artificial fixtures test the format and failures without storing player saves."""

import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import time
import zlib

import pytest

from save_reader import SaveReadError, extract_save, newest_save
from save_reader.reader import CONTAINER, MAX_RAW_BYTES


def _string(value):
    data = value.encode("utf-8")
    return struct.pack("<H", len(data)) + data


def _raw(*, version=153, name="Test Explorer", xp=12.5, plugin_data=None, ticks=134359955169660728):
    header = struct.pack("<IBI", 27, version, 8)
    header += _string(name) + struct.pack("<I", 74)
    header += _string("Test Ship") + _string("1d.2h.3m") + _string("HumanRace")
    header += struct.pack("<HffQ", 0, xp, 200.0, ticks) + b"\0" * 12
    if plugin_data is None:
        full = _string("Starfield.esm") + b"\0"
        light = _string("Test.esl") + b"\1" + _string("Test Creation") + _string("test-id")
        light += struct.pack("<H", 2) + b"\x12\x34\1"
        medium = _string("Test.esm") + b"\0"
        plugin_data = b"\0\0\1" + full + struct.pack("<H", 1) + light + struct.pack("<I", 1) + medium
    return (b"SFS_SAVEGAME" + struct.pack("<I", len(header)) + header + bytes([version])
            + _string("1.16.244.0") + _string("1.15.222.0")
            + struct.pack("<H", len(plugin_data)) + plugin_data + b"undecoded gameplay" * 20)


def _container(raw, *, chunk_size=128, table_offset=88):
    # A gap before the table proves the extractor uses offsets, not a fixed cursor.
    chunks = [zlib.compress(raw[start:start + chunk_size]) for start in range(0, len(raw), chunk_size)]
    start = table_offset + len(chunks) * 4
    header = CONTAINER.pack(b"BCPS", 1, table_offset, 0, start, len(raw), 2.0, 0, chunk_size, 16, 0, b"ZIP ")
    table = b"".join(struct.pack("<I", len(chunk)) for chunk in chunks)
    return header + b"\0" * (table_offset - len(header)) + table + b"".join(
        chunk + b"\0" * ((-len(chunk)) % 16) for chunk in chunks
    )


def _save(tmp_path, data=None, name="copied.sfs"):
    path = tmp_path / name
    path.write_bytes(_container(_raw()) if data is None else data)
    os.utime(path, (time.time() - 10, time.time() - 10))
    return path


def _cli(*args):
    root = Path(__file__).resolve().parents[1]
    return subprocess.run([sys.executable, str(root / "scripts/extract_save.py"), *map(str, args)],
                          capture_output=True, text=True, encoding="utf-8", check=False)


@pytest.mark.parametrize("version", [140, 143, 153])
def test_metadata_multichunk_plugins_and_input_preservation(tmp_path, version):
    raw = _raw(version=version, name="Étoile 宇宙")
    path = _save(tmp_path, _container(raw))
    before = path.read_bytes(), path.stat().st_mtime_ns
    result = extract_save(path)
    data = result.snapshot
    assert result.raw == raw
    assert data["player"]["name"] == "Étoile 宇宙"
    assert data["player"]["level"] == 74
    assert data["player"]["experience"] == 12.5
    assert data["save"]["saved_at"] == "2026-10-09T04:58:36.966072Z"
    assert data["save"]["filetime_ticks"] == "134359955169660728"
    assert data["save"]["format_version"] == version
    assert data["plugins"]["full"] == [{"name": "Starfield.esm"}]
    assert data["plugins"]["light"][0]["creation_name"] == "Test Creation"
    assert data["plugins"]["light"][0]["flags_hex"] == "1234"
    assert data["plugins"]["light"][0]["achievement_compatible"] is True
    assert data["plugins"]["medium"] == [{"name": "Test.esm"}]
    assert data["coverage"]["gameplay"] == "undecoded"
    assert data["source"]["sha256"] == hashlib.sha256(before[0]).hexdigest()
    assert data["coverage"]["unparsed_bytes"] == len(b"undecoded gameplay" * 20)
    assert (path.read_bytes(), path.stat().st_mtime_ns) == before
    json.dumps(data, allow_nan=False)


@pytest.mark.parametrize("version", [139, 154])
def test_unknown_save_versions_fail_explicitly(tmp_path, version):
    with pytest.raises(SaveReadError, match="Unsupported engine/save format") as error:
        extract_save(_save(tmp_path, _container(_raw(version=version))))
    assert error.value.code == "unsupported_version"


@pytest.mark.parametrize("data,code", [
    (b"not a save", "truncated_save"),
    (b"XXXX" + _container(_raw())[4:], "invalid_save"),
    (_container(_raw())[:-20], "truncated_save"),
    (_container(b"X" * 500), "invalid_save"),
    (_container(_raw(xp=float("nan"))), "invalid_header"),
    (_container(_raw(ticks=2**64 - 1)), "invalid_header"),
])
def test_invalid_inputs(tmp_path, data, code):
    with pytest.raises(SaveReadError) as error:
        extract_save(_save(tmp_path, data))
    assert error.value.code == code


@pytest.mark.parametrize("field,value,code", [
    (1, 2, "unsupported_container"), (2, 0, "invalid_offsets"),
    (4, 2**63, "invalid_offsets"), (5, MAX_RAW_BYTES + 1, "size_limit"),
    (8, 0, "size_limit"), (9, 0, "unsupported_container"),
    (11, b"LZ4 ", "unsupported_container"),
])
def test_container_guards(tmp_path, field, value, code):
    data = _container(_raw())
    fields = list(CONTAINER.unpack(data[:CONTAINER.size]))
    fields[field] = value
    with pytest.raises(SaveReadError) as error:
        extract_save(_save(tmp_path, CONTAINER.pack(*fields) + data[CONTAINER.size:]))
    assert error.value.code == code


def test_overexpanding_chunk_is_bounded(tmp_path):
    data = _container(_raw(), chunk_size=4096)
    fields = list(CONTAINER.unpack(data[:CONTAINER.size]))
    fields[5] = 20  # Actual zlib output is much larger than this claim.
    with pytest.raises(SaveReadError) as error:
        extract_save(_save(tmp_path, CONTAINER.pack(*fields) + data[CONTAINER.size:]))
    assert error.value.code == "invalid_chunk"


def test_bad_checksum_is_rejected(tmp_path):
    data = bytearray(_container(_raw()))
    start = CONTAINER.unpack(data[:CONTAINER.size])[4]
    data[start + 2] ^= 0xff
    with pytest.raises(SaveReadError) as error:
        extract_save(_save(tmp_path, data))
    assert error.value.code == "invalid_chunk"


def test_unknown_plugin_layout_keeps_header_with_warning(tmp_path):
    data = _container(_raw(plugin_data=b"\0\0\1" + _string("Test.esm") + b"\2"))
    result = extract_save(_save(tmp_path, data)).snapshot
    assert result["player"]["level"] == 74
    assert result["plugins"] is None
    assert result["coverage"]["plugins"] == "undecoded"
    assert len(result["warnings"]) == 2


def test_input_change_detected(tmp_path, monkeypatch):
    path = _save(tmp_path)
    original = os.fstat
    calls = 0

    def modified_stat(fd):
        nonlocal calls
        calls += 1
        if calls == 2:
            os.utime(path, ns=(path.stat().st_atime_ns, path.stat().st_mtime_ns + 1_000_000))
        return original(fd)

    monkeypatch.setattr(os, "fstat", modified_stat)
    with pytest.raises(SaveReadError) as error:
        extract_save(path)
    assert error.value.code == "save_changed"


def test_latest_ignores_partial_and_orders_mtime_then_name(tmp_path):
    older = _save(tmp_path, name="older.sfs")
    latest = _save(tmp_path, name="latest.SFS")
    same = _save(tmp_path, name="z.sfs")
    _save(tmp_path, name="newest.sfs.partial")
    os.utime(older, (100, 100))
    os.utime(latest, (200, 200))
    os.utime(same, (200, 200))
    assert newest_save(tmp_path) == same


def test_recent_newest_blocks_refresh_and_never_falls_back(tmp_path):
    _save(tmp_path, name="older.sfs")
    newest = _save(tmp_path, b"incomplete", name="newest.sfs")
    os.utime(newest, None)
    with pytest.raises(SaveReadError) as error:
        newest_save(tmp_path)
    assert error.value.code == "save_not_ready"
    os.utime(newest, (time.time() - 3, time.time() - 3))
    result = _cli("--latest", tmp_path)
    assert result.returncode == 1
    assert "truncated_save" in result.stderr


@pytest.mark.parametrize("missing", [True, False])
def test_missing_or_empty_folder(tmp_path, missing):
    with pytest.raises(SaveReadError) as error:
        newest_save(tmp_path / "absent" if missing else tmp_path)
    assert error.value.code == ("folder_unavailable" if missing else "no_saves")


def test_cli_exports_complete_json_and_raw_without_overwriting(tmp_path):
    path = _save(tmp_path)
    output, raw = tmp_path / "snapshot.json", tmp_path / "research.bin"
    result = _cli("--file", path, "--output", output, "--raw-output", raw)
    assert result.returncode == 0, result.stderr
    assert json.loads(output.read_text(encoding="utf-8"))["player"]["level"] == 74
    assert raw.read_bytes() == _raw()
    saved = output.read_bytes()
    retry = _cli("--file", path, "--output", output)
    assert retry.returncode == 1
    assert "output_exists" in retry.stderr
    assert output.read_bytes() == saved
    assert set(p.name for p in tmp_path.iterdir()) == {"copied.sfs", "snapshot.json", "research.bin"}


def test_cli_output_cannot_replace_save_or_alias_outputs(tmp_path):
    path = _save(tmp_path)
    before = path.read_bytes()
    assert _cli("--file", path, "--output", path).returncode == 1
    assert path.read_bytes() == before
    assert _cli("--file", path, "--output", tmp_path / "another.sfs").returncode == 1
    same = tmp_path / "same.json"
    assert _cli("--file", path, "--output", same, "--raw-output", same).returncode == 1
    assert not same.exists()


def test_cli_stdout_is_portable_json(tmp_path):
    path = _save(tmp_path)
    result = _cli("--latest", tmp_path)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout)["source"]["filename"] == path.name
