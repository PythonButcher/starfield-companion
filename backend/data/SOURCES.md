# Reference-data provenance

Checked 2026-10-03 (America/New_York). The starter map and research JSON are inherited project data. Coordinates are illustrative map units. Research quantities have not yet been independently audited and the UI labels this limitation.

Planet and crew seed records include source URLs. Unknown numeric values are null; approximate or inferred summaries are marked. Reference survey progress is zero; the separately declared Constellation starter playthrough supplies illustrative player progress only on a fresh profile.

AI SDK integration follows the [official OpenAI Python library](https://github.com/openai/openai-python); the pinned version is tested locally in mock mode. Live calls require a separately configured key.

Planet facts: [Jemison](https://www.starfielddb.com/planets/jemison/), [Mars](https://starfield.fandom.com/wiki/Mars), [Luna](https://www.starfielddb.com/planets/luna/), [Akila](https://www.starfielddb.com/planets/akila/), [Volii Alpha](https://www.starfielddb.com/planets/volii-alpha/), [Niira](https://www.starfielddb.com/planets/niira/), [Earth](https://www.starfielddb.com/planets/earth/). Additional gravity/traits: [Jemison wiki](https://starfield.fandom.com/wiki/Jemison), [Akila wiki](https://starfield.fandom.com/wiki/Akila). Seed `_sources` identify the pages for each record. Only concise factual fields are reproduced; no images or article prose are imported.

Hazards are inferred preparation labels from environment fields, not exhaustive game afflictions. Every starter profile is marked approximate for these summaries. Unknown flora/fauna counts and unsourced numeric gravity remain null; unverified resource rarity is `unknown`. Earth resource tables disagree in some sources; this catalog follows the dedicated Starfield DB Earth page (Mercury rather than Argon). Neon is represented as a city note on Volii Alpha.

Crew names and displayed skill ranks: [INARA companion catalog](https://inara.cz/starfield/companions/). Includes Sarah Morgan, Sam Coe, Barrett, Andreja, VASCO, Lin, Heller, Gideon Aker and Marika Boros. [Sarah's individual profile](https://inara.cz/starfield/companion/3/) confirms Lasers rank 3; one secondary guide incorrectly lists rank 4. Roles are concise app labels; traits/affinity/assignments start empty or unknown. No portraits are downloaded. [Companion skill reference](https://inara.cz/starfield/companion-skills/) explains that crew effects differ from player skills; optimizer weights are explicit app heuristics rather than claimed game multipliers.

## Licensed planning catalogs

The reference builder imports adapted tables/infobox facts from [Starfield Wiki](https://starfieldwiki.net), credited to its contributors under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each generated record under reference/ includes the source URL, revision ID and timestamps. Preserve attribution and share-alike licensing when redistributing those datasets.

Primary source pages: [Resources](https://starfieldwiki.net/wiki/Starfield:Resources), [Research Projects](https://starfieldwiki.net/wiki/Starfield:Research_Projects), [Outpost Modules](https://starfieldwiki.net/wiki/Starfield:Outpost_Modules), individual manufactured-resource pages and System Infobox transclusions. The builder extracts facts, strips wiki formatting and supplies schematic map positions; it does not import game assets. Baseline generator values vary with in-game conditions, so the planner exposes measured factors.

The generated planning catalogs replace the inherited system catalog at runtime. The original research board still uses inherited research rows; the recursive resolver uses the revision-attributed research/recipe catalog. Nine crew profiles retain their separately documented provenance and limitations. The legacy planet sources above explain existing editable profiles; new profiles use the Wiki catalog described below.

## Mission Run 2 world catalog

Checked 2026-10-04. `planets.json` contains **47 worlds in nine systems**, adapted from Starfield Wiki contributors under **CC-BY-SA-4.0**. Each record has `_sources` and `_reference` with its exact page URL, revision ID, source timestamp, fetch timestamp and license. Reproduce with `python -m data_pipeline.planet_catalog` from backend, or add `--offline` to use the ignored local API cache. The builder rejects missing worlds, system mismatches, non-planet infoboxes and unknown resources. It imports no images or article prose.

| System | Worlds | Source examples |
|---|---:|---|
| Sol | 19 | [Luna](https://starfieldwiki.net/wiki/Starfield:Luna), [Deimos moon](https://starfieldwiki.net/wiki/Starfield:Deimos_%28planet%29) |
| Alpha Centauri | 8 | [Jemison](https://starfieldwiki.net/wiki/Starfield:Jemison), [Kurtz](https://starfieldwiki.net/wiki/Starfield:Kurtz) |
| Cheyenne | 6 | [Akila](https://starfieldwiki.net/wiki/Starfield:Akila), [Montara Luna](https://starfieldwiki.net/wiki/Starfield:Montara_Luna) |
| Volii | 3 | [Volii Alpha](https://starfieldwiki.net/wiki/Starfield:Volii_Alpha) |
| Narion | 5 | [Vectera](https://starfieldwiki.net/wiki/Starfield:Vectera), [Kreet](https://starfieldwiki.net/wiki/Starfield:Kreet) |
| Kryx | 1 | [Suvorov](https://starfieldwiki.net/wiki/Starfield:Suvorov) |
| Porrima | 2 | [Porrima II](https://starfieldwiki.net/wiki/Starfield:Porrima_II), [Porrima III](https://starfieldwiki.net/wiki/Starfield:Porrima_III) |
| Olympus | 2 | [Nesoi](https://starfieldwiki.net/wiki/Starfield:Nesoi), [Ananke](https://starfieldwiki.net/wiki/Starfield:Ananke) |
| Bessel | 1 | [Bessel III](https://starfieldwiki.net/wiki/Starfield:Bessel_III) |

Resource symbols/rarities come from the separately revision-attributed [Resources](https://starfieldwiki.net/wiki/Starfield:Resources) table. Environment fields and orbital parents come from each world's infobox. Cold/heat, vacuum, radiation protection and water warnings are app inferences, not exhaustive afflictions or invented numeric hazard ratings. Gas giants, ice giants and asteroid moons remain orbital records without a surface-outpost action.

The Lock is a [prison on Suvorov](https://starfieldwiki.net/wiki/Starfield:The_Lock), so it is not counted as a planet. Jemison's sourced totals are 8 flora, 9 fauna and 3 traits, overriding the illustrative 5/4/1 denominators in the mission brief. Existing player profiles are preserved rather than silently changed to match a refreshed source.

Sector coordinates are app illustrations with Sol/Alpha Centauri central, Cheyenne northwest, Volii southwest and Kryx northeast. Other stars use deterministic spaced positions, not alphabetical rows. They are not distances or a reconstruction of the game's map. Narion's displayed Freestar affiliation follows its catalogued FC worlds, including Vectera.

## Illustrative Constellation playthrough

The Frontier, Barrett, VASCO, Vectera artifact discovery and the initial Constellation journey provide the setting; the [Vectera source](https://starfieldwiki.net/wiki/Starfield:Vectera) describes the opening artifact discovery. The narrative is original prose. Crew skills retain the INARA attribution above. The assignments, Stardate 2330.134, Luna base, Narion checklist and exact progress numbers are requested **sample player state**, not claims about the canonical game save or quest scripting. Barrett aboard the Frontier is an illustrative assignment.

Vectera starts at 100%; Jemison has 3 flora, 2 fauna and 1 trait recorded at 65%; Kreet starts at 25%. Their total counts remain sourced. Solar Array baseline power is 6 and Extractor - Solid demand is 5 from the [Outpost Modules](https://starfieldwiki.net/wiki/Starfield:Outpost_Modules) table. The Luna sample explicitly assumes solar_factor=2/3, so two arrays produce 8 and the extractor leaves +3. Storage capacity and extraction rates remain unknown until measured; no nonexistent game power rule is inferred.
