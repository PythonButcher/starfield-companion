# Reference-data provenance

Checked 2026-10-03 (America/New_York). The starter map and research JSON are inherited project data. Coordinates are illustrative map units. Research quantities have not yet been independently audited and the UI labels this limitation.

New planet and crew seed records include source URLs. Unknown numeric values are null; approximate or inferred summaries are marked. User survey progress starts at zero, not inferred from reference data.

AI SDK integration follows the [official OpenAI Python library](https://github.com/openai/openai-python); the pinned version is tested locally in mock mode. Live calls require a separately configured key.

Planet facts: [Jemison](https://www.starfielddb.com/planets/jemison/), [Mars](https://starfield.fandom.com/wiki/Mars), [Luna](https://www.starfielddb.com/planets/luna/), [Akila](https://www.starfielddb.com/planets/akila/), [Volii Alpha](https://www.starfielddb.com/planets/volii-alpha/), [Niira](https://www.starfielddb.com/planets/niira/), [Earth](https://www.starfielddb.com/planets/earth/). Additional gravity/traits: [Jemison wiki](https://starfield.fandom.com/wiki/Jemison), [Akila wiki](https://starfield.fandom.com/wiki/Akila). Seed `_sources` identify the pages for each record. Only concise factual fields are reproduced; no images or article prose are imported.

Hazards are inferred preparation labels from environment fields, not exhaustive game afflictions. Every starter profile is marked approximate for these summaries. Unknown flora/fauna counts and unsourced numeric gravity remain null; unverified resource rarity is `unknown`. Earth resource tables disagree in some sources; this catalog follows the dedicated Starfield DB Earth page (Mercury rather than Argon). Neon is represented as a city note on Volii Alpha.

Crew names and displayed skill ranks: [INARA companion catalog](https://inara.cz/starfield/companions/). Includes Sarah Morgan, Sam Coe, Barrett, Andreja, VASCO, Lin, Heller, Gideon Aker and Marika Boros. [Sarah's individual profile](https://inara.cz/starfield/companion/3/) confirms Lasers rank 3; one secondary guide incorrectly lists rank 4. Roles are concise app labels; traits/affinity/assignments start empty or unknown. No portraits are downloaded. [Companion skill reference](https://inara.cz/starfield/companion-skills/) explains that crew effects differ from player skills; optimizer weights are explicit app heuristics rather than claimed game multipliers.

## Licensed planning catalogs

The reference builder imports adapted tables/infobox facts from [Starfield Wiki](https://starfieldwiki.net), credited to its contributors under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each generated record under reference/ includes the source URL, revision ID and timestamps. Preserve attribution and share-alike licensing when redistributing those datasets.

Primary source pages: [Resources](https://starfieldwiki.net/wiki/Starfield:Resources), [Research Projects](https://starfieldwiki.net/wiki/Starfield:Research_Projects), [Outpost Modules](https://starfieldwiki.net/wiki/Starfield:Outpost_Modules), individual manufactured-resource pages and System Infobox transclusions. The builder extracts facts, strips wiki formatting and supplies schematic map positions; it does not import game assets. Baseline generator values vary with in-game conditions, so the planner exposes measured factors.

The generated planning catalogs replace the inherited system catalog at runtime. The original R.A.M. board still uses inherited research rows; the recursive resolver uses the revision-attributed research/recipe catalog. Seven starter planet profiles and nine crew profiles retain their separately documented provenance and limitations.
