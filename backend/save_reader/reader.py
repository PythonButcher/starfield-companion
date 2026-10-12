"""Decode known SFS fields; never infer gameplay records from unidentified bytes.

Format references and independent implementation notes are in README.md.
"""

from __future__ import annotations

import hashlib
import math
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
import struct
import time
from typing import Any
import zlib


CONTAINER = struct.Struct("<4sIQQQQfIQQI4s")
MAX_FILE_BYTES = 128 * 1024 * 1024
MAX_RAW_BYTES = 256 * 1024 * 1024
MAX_CHUNK_BYTES = 4 * 1024 * 1024
MAX_CHUNKS = 8192
MAX_PLUGINS = 8192
MIN_SAVE_VERSION = 140
MAX_SAVE_VERSION = 153
FILETIME_EPOCH = datetime(1601, 1, 1, tzinfo=timezone.utc)


class SaveReadError(ValueError):
    """Expected extraction failure with a stable code for future API callers."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Extraction:
    """Portable metadata plus optional decompressed bytes for local research."""

    snapshot: dict[str, Any]
    raw: bytes


class _Reader:
    def __init__(self, data: bytes):
        self.data = data
        self.offset = 0

    def take(self, count: int) -> bytes:
        end = self.offset + count
        if count < 0 or end > len(self.data):
            raise SaveReadError("truncated_save", "A save record ends before its declared size.")
        value = self.data[self.offset:end]
        self.offset = end
        return value

    def number(self, fmt: str) -> int | float:
        return struct.unpack("<" + fmt, self.take(struct.calcsize("<" + fmt)))[0]

    def text(self) -> str:
        value = self.take(self.number("H"))
        try:
            # UTF-8 preserves non-English player names; ASCII is a subset.
            return value.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise SaveReadError("unsupported_encoding", "A save string is not valid UTF-8.") from exc


def _utc(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def _signature(stat: os.stat_result) -> tuple[int, int, int, int]:
    return stat.st_dev, stat.st_ino, stat.st_size, stat.st_mtime_ns


def newest_save(folder: str | Path, *, minimum_age_seconds: float = 2) -> Path:
    """Choose by mtime, then filename; an unfinished newest file blocks refresh.

    A temporary extension is the reliable completion signal from a copy job.
    Age is an additional guard, not proof that another process has closed a file.
    """
    if not math.isfinite(minimum_age_seconds) or minimum_age_seconds < 0:
        raise ValueError("minimum_age_seconds must be finite and nonnegative")
    folder = Path(folder).resolve()
    try:
        candidates = [
            (path.stat().st_mtime_ns, path.name, path)
            for path in folder.iterdir()
            if path.suffix.lower() == ".sfs" and path.is_file() and not path.is_symlink()
        ]
    except OSError as exc:
        raise SaveReadError("folder_unavailable", "The copied-save folder cannot be read.") from exc
    if not candidates:
        raise SaveReadError("no_saves", "The copied-save folder contains no .sfs files.")
    modified_ns, _, selected = max(candidates)
    if modified_ns > time.time_ns() - minimum_age_seconds * 1_000_000_000:
        raise SaveReadError("save_not_ready", "The newest save is still recent; retry after copying finishes.")
    return selected


def _decompress(data: bytes) -> tuple[bytes, dict[str, int]]:
    reader = _Reader(data)
    fields = CONTAINER.unpack(reader.take(CONTAINER.size))
    magic, version, table_offset, _, data_offset, raw_size, _, _, chunk_size, alignment, _, compression = fields
    if magic != b"BCPS":
        raise SaveReadError("invalid_save", "This file is not a compressed Starfield save (BCPS).")
    if version != 1 or compression != b"ZIP ":
        raise SaveReadError("unsupported_container", "This save container or compression method is not supported.")
    if not 0 < raw_size <= MAX_RAW_BYTES or not 0 < chunk_size <= MAX_CHUNK_BYTES:
        raise SaveReadError("size_limit", "The save exceeds the decompression limits or declares an invalid size.")
    if alignment != 16:
        raise SaveReadError("unsupported_container", "The save uses an unsupported chunk alignment.")
    count = (raw_size + chunk_size - 1) // chunk_size
    if count > MAX_CHUNKS:
        raise SaveReadError("size_limit", "The save declares too many compressed chunks.")
    if not CONTAINER.size <= table_offset <= data_offset - count * 4 or data_offset > len(data):
        raise SaveReadError("invalid_offsets", "The save has invalid chunk-table or data offsets.")
    reader.offset = table_offset
    sizes = [reader.number("I") for _ in range(count)]
    reader.offset = data_offset
    raw = bytearray()
    for index, size in enumerate(sizes):
        if not size:
            raise SaveReadError("invalid_chunk", "A compressed save chunk has zero length.")
        compressed = reader.take(size)
        reader.take((-size) % alignment)
        expected = min(chunk_size, raw_size - index * chunk_size)
        decoder = zlib.decompressobj()
        try:
            # max_length prevents a corrupt chunk from expanding beyond its budget.
            block = decoder.decompress(compressed, expected + 1)
        except zlib.error as exc:
            raise SaveReadError("invalid_chunk", "A compressed save chunk failed its checksum or format check.") from exc
        if len(block) != expected or not decoder.eof or decoder.unconsumed_tail or decoder.unused_data:
            raise SaveReadError("invalid_chunk", "A save chunk does not match its declared decompressed size.")
        raw.extend(block)
    return bytes(raw), {"version": version, "chunk_count": count, "decompressed_bytes": raw_size}


def _plugins(data: bytes) -> dict[str, list[dict[str, Any]]]:
    reader = _Reader(data)
    reader.take(2)  # Undocumented prefix, intentionally not assigned a meaning.
    groups: dict[str, list[dict[str, Any]]] = {}
    total = 0
    for group, count_format in (("full", "B"), ("light", "H"), ("medium", "I")):
        count = reader.number(count_format)
        total += count
        if total > MAX_PLUGINS:
            raise SaveReadError("size_limit", "The save declares too many plugin records.")
        records = []
        for _ in range(count):
            record: dict[str, Any] = {"name": reader.text()}
            extra = reader.number("B")
            if extra not in (0, 1):
                raise SaveReadError("unsupported_plugins", "A plugin uses an unknown extra-data flag.")
            if extra:
                record["creation_name"] = reader.text()
                record["creation_id"] = reader.text()
                record["flags_hex"] = reader.take(reader.number("H")).hex()
                achievement = reader.number("B")
                # Preserve unknown flags rather than treating every nonzero value as true.
                record["achievement_compatible"] = bool(achievement) if achievement in (0, 1) else None
                record["achievement_flag"] = achievement
            records.append(record)
        groups[group] = records
    if reader.offset != len(data):
        raise SaveReadError("unsupported_plugins", "The plugin block contains unrecognized trailing data.")
    return groups


def _metadata(raw: bytes) -> dict[str, Any]:
    reader = _Reader(raw)
    if reader.take(12) != b"SFS_SAVEGAME":
        raise SaveReadError("invalid_save", "The decompressed file is not a Starfield save.")
    header = _Reader(reader.take(reader.number("I")))
    engine = header.number("I")
    save_version = header.number("B")
    if engine != 27 or not MIN_SAVE_VERSION <= save_version <= MAX_SAVE_VERSION:
        raise SaveReadError("unsupported_version", f"Unsupported engine/save format {engine}/{save_version}; supported save formats are 140–153.")
    save_number = header.number("I")
    player = {
        "name": header.text(), "level": header.number("I"),
        "location": header.text(), "playtime": header.text(), "race": header.text(),
        "gender_code": header.number("H"), "experience": header.number("f"),
        "experience_required": header.number("f"),
    }
    if any(not math.isfinite(player[key]) for key in ("experience", "experience_required")):
        raise SaveReadError("invalid_header", "The save contains a non-finite experience value.")
    ticks = header.number("Q")
    try:
        saved_at = _utc(FILETIME_EPOCH + timedelta(microseconds=ticks // 10))
    except OverflowError as exc:
        raise SaveReadError("invalid_header", "The save timestamp is outside the supported date range.") from exc
    header.take(12)  # Reserved trailer: references disagree on the meanings/order.
    if header.offset != len(header.data):
        raise SaveReadError("unsupported_header", "The player header contains an unrecognized layout.")
    if reader.number("B") != save_version:
        raise SaveReadError("invalid_header", "The save format versions disagree.")
    current_version, created_version = reader.text(), reader.text()
    plugin_data = reader.take(reader.number("H"))
    warnings = ["Inventory, ships, outposts, missions and surveys are not decoded."]
    # Keep useful player fields if a new plugin layout cannot be decoded safely.
    try:
        plugins = _plugins(plugin_data)
        plugin_status = "decoded"
    except SaveReadError as exc:
        plugins = None
        plugin_status = "undecoded"
        warnings.append(f"Plugin records are undecoded: {exc}")
    return {
        "player": player,
        "save": {"engine_version": engine, "format_version": save_version, "save_number": save_number,
                 "saved_at": saved_at, "filetime_ticks": str(ticks), "current_game_version": current_version,
                 "created_game_version": created_version},
        "plugins": plugins,
        "coverage": {"player_header": "decoded", "plugins": plugin_status,
                     "gameplay": "undecoded", "unparsed_offset": reader.offset,
                     "unparsed_bytes": len(raw) - reader.offset},
        "warnings": warnings,
    }


def extract_save(path: str | Path) -> Extraction:
    """Read a stable copy, validate its container and return schema-versioned data.

    No file, database or network writes occur. The caller owns snapshot persistence.
    """
    path = Path(path).resolve()
    try:
        with path.open("rb") as source:
            before = os.fstat(source.fileno())
            if not 0 < before.st_size <= MAX_FILE_BYTES:
                raise SaveReadError("size_limit", "The save is empty or exceeds the 128 MiB input limit.")
            data = source.read(MAX_FILE_BYTES + 1)
            after = os.fstat(source.fileno())
        if _signature(before) != _signature(after) or _signature(after) != _signature(path.stat()):
            raise SaveReadError("save_changed", "The save changed while it was being read; retry after copying finishes.")
    except OSError as exc:
        raise SaveReadError("file_unavailable", "The copied save cannot be read.") from exc
    if len(data) != before.st_size:
        raise SaveReadError("save_changed", "The save size changed while it was being read.")
    raw, container = _decompress(data)
    snapshot = {
        "schema_version": 1,
        "extractor": "starfield-companion-python-v1",
        "extracted_at": _utc(datetime.now(timezone.utc)),
        "source": {"filename": path.name, "size_bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                   "modified_at": _utc(datetime.fromtimestamp(before.st_mtime, tz=timezone.utc))},
        "container": container,
        **_metadata(raw),
    }
    return Extraction(snapshot=snapshot, raw=raw)
