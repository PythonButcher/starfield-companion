#!/usr/bin/env python3
"""Convert the Starfield PNG icon into a multi-size Windows ICO."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

SIZES = [16, 32, 48, 256]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    source_path = repo_root / "desktop-shell" / "assets" / "starfield_icon.png"
    output_path = repo_root / "desktop-shell" / "assets" / "icon.ico"

    if not source_path.is_file():
        raise FileNotFoundError(f"Source PNG not found: {source_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as image:
        rgba_image = image.convert("RGBA")
        rgba_image.save(
            output_path,
            format="ICO",
            sizes=[(size, size) for size in SIZES],
        )

    print(f"ICO written to {output_path}")


if __name__ == "__main__":
    main()
