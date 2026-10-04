# API contract

All `/api` responses are JSON. Errors: `{"error":{"code":"validation_error","message":"Human-readable reason","details":{}}}` (details optional). Status codes: 400 invalid input, 404 missing record, 413 upload too large, 502 upstream AI failure, 500 unexpected server failure without leaked internals.

List endpoints return arrays, expose `X-Total-Count`, and accept `q`, `tag`, `limit` (1–200, default 100), `offset` (>=0) where applicable. PATCH and PUT are partial updates; omitted fields are unchanged. DELETE returns `{"deleted":id}`. Timestamps are UTC ISO 8601.

## Health and reference

`GET /api/health` → `{"status":"systems_nominal"}`.
`GET /api/systems?q=Sol&limit=1` → `[{"id":1,"name":"Sol","x":0,"y":0,"type":"G2V","faction":"United Colonies","description":"The birthplace of humanity."}]`. Coordinates are illustrative map units, never light years.
`GET /api/research` → array of seed records, e.g. `{"research Project":"Medical Treatment 1","required Skills":"None","required Research":"None","required_materials_normalized":[{"name":"Aluminum","qty":2}]}` with additional inherited description fields. Quantities in the inherited catalog are not independently verified.

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
`GET /api/resources?q=Iron` returns resource objects with standard pagination.
`POST /api/resourcehunt` takes `{"resources":["Iron","Copper"]}` (at least one) and returns `{"resources":["iron","copper"],"method":"…","results":[{"planet":{},"matched_resources":["iron","copper"],"match_count":2,"hazard_count":1,"all_targets":true}]}`. `planet` is a full profile. Ranked by descending match count, ascending recorded hazard count, name and ID. This deterministic search neither calls AI nor infers unknown hazards.

## Crew

`GET /api/crew` accepts `q` (name/role/faction/notes), `skill` (name substring), `assignment` (ship/outpost/unassigned), `limit`, `offset`. `GET /api/crew/<id>` returns one crew member.
`POST /api/crew` requires `name`. `PATCH|PUT /api/crew/<id>` updates supplied fields. `DELETE /api/crew/<id>` removes the roster record. The seed catalog is not reapplied over user edits or deletions.

Request fixture: `{"name":"Recruit","role":"Pilot","faction":"Independent","is_companion":false,"skills":[{"name":"Piloting","rank":3}],"traits":[],"assigned_ship":"Frontier","assigned_outpost":"","affinity":"Unknown","notes":"Ready","portrait_url":""}`. Response adds `id` and `_sources`. String fields max 100, notes 30,000, portrait URL 500 (HTTP(S) or blank). Skills require unique names and integer ranks 1–4; maximum 30. Traits follow list rules. Assignment to both a ship and outpost is rejected; switching requires clearing the other field in the same request.

`GET /api/crew/optimize?goal=ship&slots=3` accepts ship/outpost/combat and integer slots 1–20. Response: `{"goal":"ship","slots":3,"selected":[{"member":{},"score":12,"reasons":[{"skill":"Piloting","rank":4,"weight":3,"points":12}]}],"total_score":12,"weights":{"Piloting":3},"method":"…","limitations":"…"}`. Full member records and the complete goal weight map are returned. It maximizes additive rank × weight by selecting the highest positive individual scores, breaking ties by name then ID. Assignments are unchanged. It does not model stacking, exact skill effects, recruitment or Leadership slot exceptions; the UI exposes this limitation.
