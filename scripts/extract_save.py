"""Export a copied Starfield save as JSON; run from any working directory."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from save_reader import SaveReadError, extract_save, newest_save


def _publish(path: Path, data: bytes) -> None:
    """Publish only complete output and never replace an existing file.

    Windows rename refuses an existing destination. On POSIX, a hard link
    claims the destination atomically because rename would replace a file.
    """
    temporary: str | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as output:
            temporary = output.name
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        if os.name == "nt":
            os.rename(temporary, path)
        else:
            os.link(temporary, path)
    finally:
        if temporary is not None:
            Path(temporary).unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--file", type=Path, help="One copied .sfs file")
    source.add_argument("--latest", type=Path, help="Folder containing copied .sfs files")
    parser.add_argument("--output", type=Path, help="New JSON file; otherwise JSON goes to stdout")
    parser.add_argument("--raw-output", type=Path, help="New decompressed binary file for research, not decoded gameplay")
    args = parser.parse_args(argv)
    try:
        path = args.file if args.file is not None else newest_save(args.latest)
        outputs = [p.resolve() for p in (args.output, args.raw_output) if p is not None]
        if any(p.suffix.lower() == ".sfs" for p in outputs):
            raise SaveReadError("unsafe_output", "Output paths must not have the .sfs save extension.")
        if len(set(outputs)) != len(outputs) or path.resolve() in outputs:
            raise SaveReadError("unsafe_output", "Input, JSON and raw output paths must be different.")
        if any(p.exists() for p in outputs):
            raise SaveReadError("output_exists", "An output file already exists; choose a new filename.")
        result = extract_save(path)
        encoded = json.dumps(result.snapshot, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        # Binary first: JSON is the completion signal when both outputs are requested.
        if args.raw_output is not None:
            _publish(args.raw_output.resolve(), result.raw)
        if args.output is not None:
            _publish(args.output.resolve(), encoded.encode("utf-8"))
        else:
            sys.stdout.reconfigure(encoding="utf-8")
            print(encoded, end="")
        return 0
    except (SaveReadError, OSError) as exc:
        code = exc.code if isinstance(exc, SaveReadError) else "output_error"
        print(json.dumps({"error": {"code": code, "message": str(exc)}}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
