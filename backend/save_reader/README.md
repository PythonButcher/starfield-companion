# Local save extractor

This is an independent Python implementation maintained in this repository. It
uses only the standard library: no external executable, .NET runtime, game mod,
network service or AI call. It reads copied saves and does not update the app's
database. The app's read-only playthrough service calls this module and displays
metadata in Command Hub; the standalone extractor remains independent of Flask.

## Run

From the repository root in PowerShell:

```powershell
.venv/Scripts/python.exe scripts/extract_save.py --latest "D:\Starfield\StarfieldCompanionSaves"
```

JSON goes to the terminal. To keep a snapshot, create an ignored local output
directory and choose an unused output filename:

```powershell
New-Item -ItemType Directory -Force backend/instance/save_extracts
.venv/Scripts/python.exe scripts/extract_save.py --latest "D:\Starfield\StarfieldCompanionSaves" --output backend/instance/save_extracts/snapshot-001.json
```

For one file, use `--file "D:\path\copied-save.sfs"` instead of `--latest`.
`--raw-output backend/instance/save_extracts/research-001.bin` optionally retains
the full decompressed binary for future format research. That binary is not a
readable inventory or ship export. Existing output files are never overwritten;
output parent directories must exist. If either output fails, the CLI exits
nonzero; a raw file published before a JSON failure may remain for inspection.

## Copy-folder agreement

Configure your separate process to copy completed saves, preserve their original
filenames and modification times, and publish each copy by renaming a temporary
`.partial` file to `.sfs` after the copy completes. The app/tool never monitors or
writes to the game's original save folder. Folder mode is one extraction per
invocation, not an automatic watcher. The app reads the configured copy folder
on Command Hub entry and manual refresh; it does not copy or monitor game saves.

Only direct, regular `.sfs` files are candidates (case-insensitive extension;
symlinks and subdirectories are excluded). Newest means highest modification time,
with filename as a deterministic tie-breaker. A newest file modified within two
seconds blocks extraction. The tool compares input size, modification time and
file identity around its read. Neither check proves that a paused copying process
has finished: temporary-name publication is the completion guarantee. A corrupt
newest file produces an error rather than silently showing an older save.

## Output contract (schema version 1)

- `player`: name, level, saved location, original playtime string, race, raw gender
  code, experience and experience required. Location may be a ship or interior;
  it is not automatically a mapped planet. Playtime is not converted into hours
  using an unverified format assumption.
- `save`: engine and format versions, save number, UTC save timestamp, exact
  Windows FILETIME ticks as a decimal string, current and creation game versions.
  The string preserves integers larger than JavaScript's exact numeric range.
  FILETIME is retained because ISO output rounds down to microseconds from its
  100 ns precision.
- `plugins`: full/light/medium plugin names and extra creation fields where known.
  Unknown plugin layouts return `null` with a warning, while keeping player data.
- `source`: copied filename, size, UTC modification time and SHA-256 digest.
- `container`: version, chunk count and decompressed byte count.
- `coverage`: decoded/undecoded status and offset/size of the unparsed remainder.
- `warnings`, `extracted_at`, `extractor`, `schema_version`: provenance and limits.

All timestamps are UTC. No complete source directory is included in exported JSON.
Python callers use `extract_save(path).snapshot`; optional binary research data is
available as `.raw`. `newest_save(folder)` selects a copied path. `SaveReadError`
contains `.code` and a human-readable message. The CLI emits JSON errors on stderr
and exits 1; successful JSON is on stdout or in `--output`. Argument misuse exits 2.

## Supported formats and safety

The first version supports BCPS container 1, zlib chunks with 16-byte padding,
engine 27 and the 140–153 save-layout family. Versions 140, 143 and 153 are tested
with synthetic fixtures; only 153 is verified against the player's real copies.
Future/older layouts fail explicitly until investigated. The reserved header
trailer and unknown container fields are not given speculative meanings.

Limits: 128 MiB compressed input, 256 MiB decompressed output, 4 MiB per declared
chunk, 8,192 chunks and 8,192 plugins. Offsets, lengths, zlib checksums and expected
output sizes are checked; decompression is bounded before allocation. Unsupported
plugin blocks cannot cause arbitrary count/offset traversal. The source file is
opened read-only. Private `.sfs` files are ignored by Git; JSON and binary exports
belong under the already ignored `backend/instance/` directory or outside the repo.

Inventory, ship construction, outposts, missions and survey progress remain
undecoded. A ship name appearing in `player.location` is not a decoded ship record.
Adding those fields requires format research and comparisons against known
in-game readings, or a game exporter; the present tool makes no inferred records.

## Format references

The binary field layout is informed by Simon Davies (insomnious) and Nexus Mods'
public [StarfieldSaveTool research](https://github.com/Nexus-Mods/StarfieldSaveTool).
Relevant references are the [container template](https://github.com/Nexus-Mods/StarfieldSaveTool/blob/master/SFS.bt),
[decompressed template](https://github.com/Nexus-Mods/StarfieldSaveTool/blob/master/SFS-decompressed.bt),
and [metadata reader](https://github.com/Nexus-Mods/StarfieldSaveTool/blob/master/DatFile.cs).
Reviewed on 2026-10-11 (America/New_York). No upstream source files or executable
are vendored. Our implementation uses the published format facts, independently
written validation, output contract and artificial test fixtures. Verification
evidence and real-save limits are in the [run report](../../project_docs/active/status/RUN_REPORT.md).
