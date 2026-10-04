# Reference builder

From the repository root, install `backend/requirements.txt`, then:

```powershell
Set-Location backend
../.venv/Scripts/python.exe -m data_pipeline.build
# Reuse the locally cached API responses without networking:
../.venv/Scripts/python.exe -m data_pipeline.build --offline
# Explicitly fetch updated source revisions:
../.venv/Scripts/python.exe -m data_pipeline.build --refresh
```

The builder reads Starfield Wiki's public MediaWiki API, batches at most 50 page titles, observes maxlag=5, spaces requests at least 1.05 seconds apart, and caches raw responses under the ignored cache directory. Systems are enumerated through System Infobox transclusions with continuation support.

It emits resources, component/research recipes, operational outpost modules, systems and a manifest under `backend/data/reference/`. Each record carries its source URL, revision, source timestamp, fetch timestamp and CC-BY-SA-4.0 attribution. These are adapted tabular facts from Starfield Wiki contributors; redistribution of these datasets must preserve attribution and the same license. No game images are imported.

The checked-in datasets run without a network connection. An offline rebuild requires the cache from an online build. Minimum-count guards and duplicate-key checks reject clearly incomplete parser results. Parser unit tests use literal offline fixtures. Application startup refreshes reference rows when file digests change; player tables are never replaced.

Coverage in this build: 128 system records, 109 resource records, 112 recipes/projects, 44 operational modules and 47 worlds. This is not a claim of complete game coverage. Coordinates use deterministic sector placement with named anchors and minimum spacing, not an alphabetical grid or real distances. Storage capacities and production rates remain null until the player measures them. Unresolved recipe leaves are explicitly returned as purchased components.

## Bounded planet catalog

From backend, run `../.venv/Scripts/python.exe -m data_pipeline.planet_catalog` (or add `--offline` / `--refresh`). The 47-name allowlist spans nine core systems. `Starfield:Deimos (planet)` resolves the ambiguous Deimos title. Only Planet Infobox facts are imported; expected names/systems, resource identities and source metadata are checked before writing `backend/data/planets.json`. `_reference` includes moon/planet type, orbital parent and provenance. Hazards are conservative environment-derived cautions, labeled approximate; no game images or article prose are copied.

Startup refreshes PlanetReference separately from editable PlanetProfile. A versioned expansion adds missing non-legacy worlds once and preserves edits and deletions. The separate Constellation sample-state service runs only for a new profile. See [source decisions](../data/SOURCES.md) for Jemison totals, the Suvorov/Lock distinction and explicit sample solar calibration.
