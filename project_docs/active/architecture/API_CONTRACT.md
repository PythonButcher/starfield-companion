# API contract

All `/api` responses are JSON. Errors: `{"error":{"code":"validation_error","message":"Human-readable reason","details":{}}}` (details optional). Status codes: 400 invalid input, 404 missing record, 413 upload too large, 502 upstream AI failure, 500 unexpected server failure without leaked internals.

List endpoints return arrays, expose `X-Total-Count`, and accept `q`, `tag`, `limit` (1–200, default 100), `offset` (>=0) where applicable. PATCH and PUT are partial updates; omitted fields are unchanged. DELETE returns `{"deleted":id}`. Timestamps are UTC ISO 8601.

## Health and reference

`GET /api/health` → `{"status":"systems_nominal"}`.
`GET /api/systems?q=Sol&limit=1` returns an array of system records with `id,name,x,y,type,faction,description,level,layout_only,_source`. Sol is at `(0,0)` with spectral type G2 and level 1. Use IDs returned by the current catalog; they are not fixed game identifiers. Coordinates are illustrative map units, never light years.
`GET /api/research` → array of seed records, e.g. `{"research Project":"Medical Treatment 1","required Skills":"None","required Research":"None","required_materials_normalized":[{"name":"Aluminum","qty":2}]}` with additional inherited description fields. Quantities in the inherited catalog are not independently verified.

`GET /api/systems/<id>` returns `{system, planets, outposts, missions}`. The ID is the system payload ID returned by `/api/systems`, not an internal reference-row ID. Planets are full profiles with a case-insensitive system match; outposts use linked planet IDs and include analysis. Missions are Active, using their explicit target system when supplied or their linked world's system otherwise. An uncatalogued sector has empty arrays; an unknown system ID is JSON 404. Coordinates are stable schematic sector positions; level tags use <=15 safe, 16–39 caution and >=40 danger.

## Constellation profile and fleet

`GET /api/ships` returns an array of `{id,name,home_ship,notes,crew}`. Crew contains full roster records whose assigned_ship matches that registry name, independent of frontend roster filters. Existing crew assignment APIs remain unchanged.

`GET /api/starter` returns `{status}`: `active`, `cleared`, `existing_profile` or `disabled`. Only an empty, previously unseeded profile receives the illustrative playthrough. Tests can set `SEED_STARTER_STATE=False` independently of reference seeding. Startup never applies samples to an existing profile, including one whose user content has been deleted.

`POST /api/starter/clear` requires `{"confirm":"CLEAR STARTER"}` and returns `{removed,preserved,status}`. `removed` counts unchanged samples removed or restored to their pre-sample values. Modified rows, referenced logs, ships/outposts with retained crew assignments, and changed surveys are preserved. Uploaded files and reference worlds remain. Missing/incorrect confirmation returns 400. Repeated clearing is idempotent, and cleared samples never auto-return.

Sample dates are fixed UTC timestamps, not live game time. The Vectera log's 2026-05-14 UTC date displays as stardate 2330.134. Luna's two 6-power arrays use an explicit sample solar_factor of 2/3: 8 generated minus 5 consumed = +3.

## Journal

`GET /api/logs` supports `q` across title, notes, narrative, planet and system; `tag` is case-insensitive exact membership. Results are newest first.
`POST /api/logs` requires nonblank `title` (max 100). Optional: `planet_name`, `system_name`, `mood` (100), `location` (200), `raw_notes`, `ai_narrative` (30,000), `log_type` (Exploration/Combat/Trade/Faction/Personal), `tags` (up to 50 nonblank strings, each max 100), `planet_id` (existing ID or null). Unknown keys are 400.
`GET /api/logs/<id>` returns a record; `PATCH|PUT /api/logs/<id>` validates supplied fields; `DELETE /api/logs/<id>` removes it and detaches linked media.

Request fixture: `{"title":"Landing","planet_name":"Jemison","raw_notes":"Landed safely.","tags":["survey"]}`.
Response (201 on create): `{"id":1,"title":"Landing","planet_name":"Jemison","system_name":"","location":"","mood":"","log_type":"Exploration","raw_notes":"Landed safely.","ai_narrative":"","tags":["survey"],"planet_id":null,"date":"2026-10-03T23:00:00+00:00","updated_at":"2026-10-03T23:00:00+00:00","stardate":"2330.276"}`. Stardate is a cosmetic year+304/day-of-year display, not game time synchronization.

## AI

`POST /api/generate_narrative`: `{"raw_notes":"Landed safely.","title":"Landing","planet_name":"Jemison","tone":"stoic","length":"short"}` → `{"narrative":"Captain’s log…","model":"ship-computer-mock-v1","mode":"mock"}`. Notes required, 1–10,000 characters; title/planet max 100. Tones: stoic, dramatic, noir, scientific; lengths: short, medium, long. Provider selected by server configuration, not the client. Missing key uses mock even if live requested. Live provider failures become clean 502 errors.

`POST /api/strategize`: `{"hazards":["cold"],"environment":"Thin atmosphere","loadout":["Suit"],"skills":["Surveying"],"crew":["VASCO"]}` → `{"gear":["Check suit protection for cold."],"skills":["Review your Surveying rank before departure."],"crew_picks":["VASCO"],"risk_level":"moderate","explanation":"…","model":"ship-computer-mock-v1","mode":"mock"}`. Arrays follow the string-list constraints; environment max 1,000. Risk is low/moderate/high. Heuristic checklist, not a game mechanics simulation.

`GET /api/briefing` → `{"briefing":"Systems nominal…","model":"ship-computer-mock-v1","mode":"mock","log_count":0}`. Uses up to five latest logs; an empty archive returns a fixed welcome without calling the provider.

## Planets and resource hunt

`GET /api/planets` accepts `q`, `system` (exact), `resource` (exact name or symbol), `hazard` (substring), `min_gravity`, `max_gravity`, `limit`, `offset`. Numeric filters exclude unknown gravity. `GET /api/planets/<id>` returns a profile.
`POST /api/planets` requires `name`. `PATCH|PUT /api/planets/<id>` updates supplied fields. `DELETE /api/planets/<id>` detaches logs/media without deleting them.

Writable profile fixture: `{"name":"Test world","system_name":"Sol","type":"Rock","gravity":1.2,"temperature":"Cold","atmosphere":"Unknown","magnetosphere":"Unknown","water":"Unknown","biomes":[],"planetary_traits":[],"resources":["Iron","Copper"],"flora":null,"fauna":null,"hazards":["Cold"],"user_notes":"Landing site","surveyed_percent":25,"favorite":false,"outpost_candidate":true,"approximate":true}`. Names and environmental strings max 100 (type 50); notes max 30,000. String lists follow common list limits. Gravity 0–100 or null; flora/fauna integer 0–10,000 or null; survey integer 0–100; flags boolean. Unknown values remain unknown, never assumed zero.

Response adds `id`, read-only `_sources` (URL strings), and replaces resource names with `{"id":1,"name":"Iron","symbol":"Fe","type":"inorganic","rarity":"unknown"}` objects. Resource writes also accept objects with `name`, optional `symbol` (30), `type` (inorganic/organic), `rarity` (30). Case-insensitive names reuse catalog entries without overwriting catalog metadata.

Profiles additionally expose read-only `_reference`, null for uncatalogued identities, or `{source_url,revision,timestamp,fetched_at,license,orbits,body_type,orbital_position,landable,hazard_basis}` from PlanetReference. This is source metadata, independent of player edits. New databases contain 47 revision-attributed worlds in nine systems. Existing databases keep their legacy profiles and deletions while receiving only missing expansion identities. Gas/ice giants and asteroids are orbital entries; the inspector does not offer surface outpost creation for them. Unknown numerics remain null and hazard labels are explicitly inferred.
`GET /api/resources?q=Iron` returns resource objects with standard pagination.
`POST /api/resourcehunt` takes `{"resources":["Iron","Copper"]}` (at least one) and returns `{"resources":["iron","copper"],"method":"…","results":[{"planet":{},"matched_resources":["iron","copper"],"match_count":2,"hazard_count":1,"all_targets":true}]}`. `planet` is a full profile. Ranked by descending match count, ascending recorded hazard count, name and ID. This deterministic search neither calls AI nor infers unknown hazards.

## Crew

`GET /api/crew` accepts `q` (name/role/faction/notes), `skill` (name substring), `assignment` (ship/outpost/unassigned), `limit`, `offset`. `GET /api/crew/<id>` returns one crew member.
`POST /api/crew` requires `name`. `PATCH|PUT /api/crew/<id>` updates supplied fields. `DELETE /api/crew/<id>` removes the roster record. The seed catalog is not reapplied over user edits or deletions.

Request fixture: `{"name":"Recruit","role":"Pilot","faction":"Independent","is_companion":false,"skills":[{"name":"Piloting","rank":3}],"traits":[],"assigned_ship":"Frontier","assigned_outpost":"","affinity":"Unknown","notes":"Ready","portrait_url":""}`. Response adds `id` and `_sources`. String fields max 100, notes 30,000, portrait URL 500 (HTTP(S) or blank). Skills require unique names and integer ranks 1–4; maximum 30. Traits follow list rules. Assignment to both a ship and outpost is rejected; switching requires clearing the other field in the same request.

`GET /api/crew/optimize?goal=ship&slots=3` accepts ship/outpost/combat and integer slots 1–20. Response: `{"goal":"ship","slots":3,"selected":[{"member":{},"score":12,"reasons":[{"skill":"Piloting","rank":4,"weight":3,"points":12}]}],"total_score":12,"weights":{"Piloting":3},"method":"…","limitations":"…"}`. Full member records and the complete goal weight map are returned. It maximizes additive rank × weight by selecting the highest positive individual scores, breaking ties by name then ID. Assignments are unchanged. It does not model stacking, exact skill effects, recruitment or Leadership slot exceptions; the UI exposes this limitation.

## Reference metadata and planning catalogs

`GET /api/reference/meta` returns `{built_at, license, source, counts, limitations}`. This build contains 47 worlds, 128 systems, 109 resources, 112 recipes/projects and 44 operational modules. System responses also carry `layout_only: true`, `level` and `_source` provenance; coordinates are schematic.

`GET /api/outposts/modules` and `GET /api/crafting/recipes` return paginated arrays with `q` filtering. Modules contain `id, name, category, power, cost, capacity, rate_per_minute, notes, _source`; negative power consumes electricity, positive power generates it. Unknown capacity/rate is null. Recipes contain `name, kind, output, ingredients, _source`, with `prerequisites` on research records. Ingredients map names to integer quantities. Provenance includes URL, revision, source/fetch timestamps and CC-BY-SA-4.0.

## Media

`POST /api/media` accepts multipart `file`, optional `caption`, JSON-encoded `tags`, and integer-string `planet_id`/`log_id`. Exactly one file is required. Maximum file size is 10 MiB; total request limit is 11 MiB. Accepted raster formats: JPEG, PNG, WebP, GIF. Accepted video container: MP4 with a recognized ftyp brand and bounded moov/mdat boxes. MIME comes from inspected content, not the submitted extension. Unsupported/spoofed content returns 400; oversized uploads return 413.

`GET /api/media` supports `q, tag, planet_id, log_id, limit, offset`. `GET /api/media/<id>` returns one record. `PATCH /api/media/<id>` accepts `caption` (max 5,000), `tags` (common string-list rules), `planet_id` and `log_id` (existing FK or null). Unknown keys and missing foreign references are 400. `DELETE /api/media/<id>` removes file and metadata.

Response example: `{"id":1,"filename":"<uuid>.png","original_name":"landing.png","mime_type":"image/png","size":2450,"caption":"Arrival","tags":["survey"],"planet_id":1,"log_id":2,"created_at":"2026-10-04T00:00:00+00:00","url":"/media/<uuid>.png"}`.

`GET /media/<filename>` serves only a registered UUID filename, with nosniff, restricted CSP and conditional/range handling. It never resolves arbitrary source paths. Log/planet deletion sets associations null and preserves uploaded files.

## Outposts

`GET/POST /api/outposts`, `GET/PATCH/DELETE /api/outposts/<id>`: persistent plans, standard list pagination and `q` over name/planet. Creation requires a nonblank name. Supported fields:

```json
{
  "name": "Luna iron base",
  "planet_id": 3,
  "planet_name": "Luna",
  "modules": [
    {"module_id": "<catalog-id>", "count": 2, "resource": "Iron", "rate_per_minute": null, "capacity": null}
  ],
  "environment": {"solar_factor": 1, "wind_factor": 1, "fuel_available": false},
  "stored_mass": 0,
  "notes": ""
}
```

Names max 100, notes max 30,000, count integer 1–1,000, maximum 100 module rows. Module IDs must exist. Only extractors accept a selected resource. Measured rate/capacity are nonnegative finite numbers up to 1,000,000 or null. Factors are 0–10; fuel is boolean; stored mass is 0–100,000,000. Linked planet name is derived from the referenced planet.

`POST /api/outposts/plan` accepts the same fields but does not require a name or persist anything. It returns `{generation, consumption, net_power, storage_capacity, known_storage_capacity, storage_overflow, shopping_list, extracted_resources, rates_per_minute, warnings, method}`. CRUD responses add this under `analysis`, along with id and UTC created/updated timestamps.

Calculation sums module baseline power × count, applies entered solar/wind factors, sets wind to zero for a recorded vacuum and disables fueled generation unless fuel is confirmed. Selected deposits absent from the linked planet are excluded with a warning. A deficit conservatively makes known extraction rates zero. Unknown measured rates remain null. Any unknown selected storage capacity makes total capacity and overflow null; known subtotal is still exposed. No live inventory or game telemetry is inferred. Planet deletion detaches plans while preserving their name/notes.

## Crafting resolver

`POST /api/crafting/resolve`:

```json
{"target":"Adaptive Frame","quantity":3,"inventory":{"Adaptive Frame":1,"Iron":1}}
```

Target is a catalog name, case-insensitive; quantity integer 1–10,000. Inventory maps at most 200 unique case-insensitive names to integer counts 0–100,000,000. Invalid types/counts are 400; unknown target 404; dependency cycles 422 `recipe_cycle`. Traversal is bounded to 40 dependency levels and 10,000 visited nodes.

Response contains `target, quantity, tree, raw_totals, deficits, purchased_components, gross_purchased_components, suppliers, prerequisites, method`. A tree node has `name, quantity, inventory_used, needed, children`. The example returns raw deficits `{"Aluminum":2,"Iron":1}`. Gross raw totals are computed without inventory; net expansion consumes each inventory item once across all branches. Suppliers map each missing raw resource to recorded `{id,name,system_name}` planets; no match is an empty array. Non-resource leaves with no recipe are purchase requirements, never mislabeled as raw elements. Research prerequisites, skill discounts and random bonuses are excluded.

## Missions and linked journal creation

`GET/POST /api/missions`, `GET/PATCH/DELETE /api/missions/<id>`. List filters: `q, faction, status, planet_id, limit, offset`.

Creation requires `title` (nonblank, max 100). Writable fields are `title, faction, category, status, priority, target_planet_id, target_system, notes, checklist, linked_log_ids`. Factions: Constellation, UC Vanguard, Freestar, Ryujin, Crimson Fleet, Independent. Categories: Main, Faction, Survey, Outpost, Personal. Status: Active, Completed, Paused. Priority: High, Medium, Low. Defaults: Independent/Personal/Active/Medium. System max 100; notes max 30,000.

Checklist has at most 100 `{id,text,done}` objects: unique nonblank string ID (max 100), nonblank text (max 500), boolean done. Linked logs are up to 100 existing integer IDs. Planet may be an existing ID or null. Response adds `id, target_planet_name, created_at, completed_at`. Entering Completed sets UTC completion time; reopening/pausing clears it.

`POST /api/logs` additionally accepts optional `mission_id`. Log creation and mission linkage commit atomically; a missing mission is 400 with no orphan log. Missing planet/system names are derived from linked `planet_id`. Log deletion removes that ID from every mission. Mission deletion preserves its logs.

## Coverage portfolio

`GET /api/portfolio/coverage` returns:

`{coverage_percent, covered_count, catalog_count, inactive_plans, resources, missing, recommendations, method}`.

Resources carry reference fields plus boolean `covered`. Only selected extractor resources present on the linked world count; plans with a power deficit are excluded. The denominator is the reference catalog's inorganic resource count.

Each recommendation has `{planet,new_resources,gain,rank}`. At each of up to three steps, candidates are ranked by additional still-missing resources, then name/ID; that marginal set is removed before ranking the next choice. Existing outpost planets are excluded. It is a heuristic over planet-wide recorded deposits, not a guaranteed one-site layout or globally optimal solution.

## Survey ledger

`GET /api/surveys/gaps?system=Sol&tier=nearly` returns `{planets,systems,method}`. System filter is case-insensitive exact match. Tier is blank/all incomplete or `nearly` (>75%). Only worlds with 0 < surveyed_percent < 100 are included. System rollups always count catalogued worlds, with `name,total,complete,completion_percent`.

Each entry contains `planet,counters,updated_at,hint`. Counters are keyed flora/fauna/traits/resources and hold `{field,scanned,total,remaining}`; unentered counters or unknown totals yield null remaining. Hints mention ocean/coastal biomes only when the profile records an ocean biome and a fauna gap.

`GET /api/surveys/<planet_id>` returns one such entry at any completion percentage, including 0 and 100; unknown IDs return 404. Sourced empty trait/resource sets have a known total of zero, while empty custom-world sets retain unknown totals. Starter Jemison has 3/8 flora, 2/9 fauna and 1/3 traits, with independently recorded 65% completion.

`PATCH /api/surveys/<planet_id>/counters` accepts `scanned_flora, scanned_fauna, discovered_traits, scanned_resources` (nonnegative integers bounded by known totals, otherwise 10,000; null clears to unknown), plus `surveyed_percent` (integer 0–100). Omitted counters are unchanged. The response is the updated ledger entry. Progress timestamps are UTC, and deleting a planet cascades its survey counters.

## Session radar and Hub

`GET /api/radar/session_handover` returns `position, home_ship, missions, outpost_alerts, survey_targets, recent_logs, narrative, favorites, milestones, stats, limitations`. `home_ship` is `{id,name,home_ship,notes}` or null.

- Position: `{planet,system,source,at}`, taking the newer of latest journal date and survey update; empty records report Unknown.
- Missions: active High priority objectives, oldest first.
- Alerts: `{id,name,net_power,storage_overflow}` for negative power or known overflow.
- Survey targets: incomplete worlds in the exact current system. Schematic map coordinates are not used to infer nearby systems.
- Recent logs: newest three full journal records; narrative is the latest AI narrative truncated to 600 characters.
- Favorites and milestones: favored worlds and 100%-surveyed worlds.
- Stats: `assigned_crew,outposts,coverage_percent,media`. Crew count means an assigned ship or outpost, not recruitment status.

`GET /api/hub/map_activity` returns `{outposts:[system names],missions:[system names]}`; missions are Active only. Hub separately loads `GET /api/briefing` and uses existing log/planet APIs for deep links.

## Supply networks

`GET/POST /api/supply-networks`, `GET/PATCH/DELETE /api/supply-networks/<id>` persist named graphs. Lists support `q` over name/notes and standard pagination, newest ID first. Create requires nonblank `name` (100); `notes` max 30,000. Responses include UTC `created_at`, `updated_at` and computed `analysis`.

`nodes` (max 60) contain `{id,name,system,x,y,outpost_id,production}`. IDs are unique nonblank strings up to 64 characters; name/system max 100; name required. Coordinates are finite numbers from -10,000 to 10,000. `outpost_id` is null or a positive integer. An existing outpost may be referenced only once per graph. Missing/deleted references remain diagnosable instead of destroying routes. Linked sites derive their name, system and production from OutpostPlan/PlanetProfile; planned sites use their own entered `production`.

`links` (max 120) contain `{id,source,target,kind,resources,fuel_node_id,fuel_rate,enabled}`. IDs are unique within links; endpoint IDs max 64. `kind` is `local` or `inter-system`; `enabled` is boolean, default true. Fuel rate is null or a finite number 0–1,000,000. Fuel must be assigned to one endpoint for an inter-system route.

Both `production` and `resources` are lists of at most 30 `{resource,rate}` objects. Resource names are nonblank, max 100, unique after alias normalization (known resource names/symbols and He3/He-3 map to canonical names). Rates are null for unknown or finite 0–1,000,000 units/min. Unknown nested keys, duplicate IDs, malformed types and nonfinite numbers are JSON 400. Structurally valid but operationally incomplete plans may be saved.

`POST /api/supply-networks/analyze` accepts the same fields without a required network name; it does not persist. Returns `{nodes,links,summary,method}`. Resolved nodes add `issues,remaining,depots_required,advisory`; links add `status,issues`. Statuses: `ready`, `shortage`, `broken`, `unverified`, `paused`. Broken endpoints, self-links, cross-system local links and offline outposts cannot ship. Unknown/zero shipment or fuel rates require measurement. Complete routes reserve cargo and fuel from the same budgets in list order; blocked routes are retried after known imports. Each route executes once per evaluation, preventing unfunded cycles. Remaining values are usable lower bounds when unknown local production has a known import. No travel times, inventory buffers, partial shipments or game integration are implied. More than three depots produces an allowance advisory. Starter clearing preserves outposts referenced by saved networks.

## Ship blueprints

`GET/POST /api/ship-blueprints`, `GET/PATCH/DELETE /api/ship-blueprints/<id>` persist module snapshots. Lists use standard pagination and `q` over name/notes, newest ID first. Create requires `name` (nonblank, max 100); `notes` max 30,000; `crew_limit` integer 0–100, default 3; `jump_bonus` finite percent 0–100, default 0. No fleet/crew assignment changes are implied by saving a blueprint.

`modules` is a list of at most 100 `{name,category,ship_class,catalog_id,count,stats}` objects. Module name max 120; optional catalog ID max 64; class is blank/A/B/C; count integer 1–100. Categories: Reactor, Engine, Grav drive, Hab, Shield, Cockpit, Cargo, Fuel tank, Landing gear, Landing bay, Docker, Structural, Weapon. Stats are `mass,hull,power,crew_capacity,crew_stations,shield,maneuvering_thrust,grav_thrust,top_speed,cargo,fuel`; each is null/omitted for unknown or a finite number 0–1,000,000. Explicit zero means no contribution. Power means generation on reactors and demand on powered modules. Unknown keys, booleans masquerading as numbers and invalid categories/classes are JSON 400.

`GET /api/ship-blueprints/catalog` returns `{modules,categories,stat_fields}` with 34 reference modules and `_source` URL/revision/license per row. Clients omit `_source` when saving snapshots. The stable catalog ID is a reference hint; saved stats remain independent and editable.

`POST /api/ship-blueprints/analyze` accepts the same fields without a required name, returning `{stats,reactor_class,warnings,module_count,method}`. CRUD responses include this under `analysis` plus UTC timestamps. Stats include `mass,hull,shield,mobility,top_speed,jump_range,crew_capacity,crew_rating,crew_stations,cargo,fuel,reactor_power,engine_power`. Unknown contributing measurements propagate to affected stats as null. Empty builds return zeros and readiness guidance; incomplete or incompatible builds remain saveable with warnings.

Mobility: clamp(round(11.9 × engine maneuvering thrust / mass − 47.6), 0, 100). Jump estimate: min(30, cube-root(682.911 × grav thrust³ / mass) × (1 + jump_bonus/100)), rounded to two decimals. Multiple drives make jump range unknown. Crew capacity: floor(min(total crew rating, total stations, entered crew_limit)). Full-power speed uses the minimum installed engine speed. Checks cover required core modules, reactor-class compatibility, one shield maximum, engine demand above 12 and low jump range. They do not certify module placement, landing thrust, weapon groups or flight legality. See [sources and limits](../../../backend/data/SOURCES.md).
