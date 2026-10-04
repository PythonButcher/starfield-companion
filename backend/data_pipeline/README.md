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

Coverage in this build: 128 system records, 109 resource records, 112 recipes/projects, and 44 operational modules. This is not a claim of complete game coverage. Planet suppliers use seven starter profiles plus player additions. Coordinates are a schematic grid with inherited positions retained for named starter systems. Storage capacities and production rates remain null until the player measures them. Unresolved recipe leaves are explicitly returned as purchased components.
