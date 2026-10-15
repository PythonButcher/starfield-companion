# Project run report

## Manual copied-save app connection — 2026-10-14 (America/New_York)

Branch: `codex/mission-run-1`. Command Hub's **Current playthrough** panel reads
the configured separate copy folder through `GET /api/playthrough`. It displays
character, level, location, playtime, experience, save date, game versions and
plugin groups. Reads happen on page entry or Refresh save / Refresh terminal.
Known compact playtime strings are presented in plain English; unfamiliar formats
stay unchanged. Save/read/check timestamps distinguish game progress from app reads.

The per-app service uses a lock and retains only the last successful metadata
snapshot in memory. Failed extraction labels it stale, while missing setup or
an unreadable initial save has a clear empty/error state. A changed folder clears
the snapshot. The server accepts no client-selected path or write method, returns
no-store responses, and performs no save writes or player-model imports. There
is no background polling, persisted snapshot or automatic copy job. The local
ignored `.env` was configured with `STARFIELD_SAVE_FOLDER`; committed example
configuration leaves it blank. All existing secret/configuration lines were retained.

Verification:

- Backend suite with workspace-local temporary storage: **131 passed**, including five new API integration cases and 29 extractor cases.
- Frontend lint and production build: **passed**, 99 modules.
- Full isolated browser suite: **21 passed**, including two new playthrough flows.
- Final targeted playthrough browser tests after plain-English playtime display: **2 passed**.
- Real copied-folder endpoint: **ready**, with player header and all three plugin groups decoded. All copied-save SHA-256 hashes and modification times were unchanged.
- Built frontend against the real save: character/location visible, manual refresh successful, no browser errors, and no horizontal overflow at 390px.
- Private desktop/mobile screenshots were visually inspected; they remain under ignored `backend/instance/save_extracts/app-desktop.png` and `app-mobile.png`.
- Policy self-test: **12 cases passed**. Active-gate validation, local Markdown links and whitespace checks: **passed**.

API tests exercise the real Python extractor with artificial saves, refresh to a
newer file, corrupt-file retention and recovery, missing/changed configuration,
path-selection refusal and unchanged player-model counts. Browser tests cover
visible values, manual refresh, stale labels, recovery, plugin details, shared
terminal refresh and desktop/mobile layouts. The browser-test backend explicitly
disables the real copy-folder setting and uses an in-memory database, temporary
uploads and mock AI.

Initial browser startup was restricted by the Windows sandbox, so browser checks
ran outside it. The first full suite passed 20/21: the new request-count assertion
assumed one initial request, while React StrictMode intentionally mounts twice.
The corrected assertion checks one additional read per click; the suite passed.
The local server on port 5000 returned a missing-route response while a fresh
factory/test-client route worked. Restarting that verification process did not
resolve the default-port response. A fresh app-factory instance on port 5002
served the actual player database and real copied save correctly; that instance
is left running with mock AI for user review. The default-port issue is not
claimed fixed, and the user-facing review link uses port 5002.

Limits: this snapshot represents the saved game, not continuously live gameplay.
Inventory, ship builds, outposts, missions and survey data remain undecoded, and
manual app records stay separate. Automatic copying will be scoped after the
user reviews this connection. The Context Ledger-specific audit is not applicable;
the project's active-gate validator and local-link audit are used.

## Copied-save extraction — 2026-10-11 (America/New_York)

Branch: `codex/mission-run-1`. Scope: an independently implemented local Python
extractor, not an app UI or live game connection.

Delivered `backend/save_reader/` and `scripts/extract_save.py` using only the
Python standard library. The tool decodes the BCPS/zlib container, known player
and save headers, and full/light/medium plugin lists into schema-versioned JSON.
It can select the newest copied `.sfs` file by modification time and optionally
export the complete decompressed binary for research. Output publication refuses
existing files. Input sizes, offsets, chunk expansion and plugin counts are
bounded. The module has no database, game-folder writes or network dependency.
Published format research is attributed in the extractor guide; no upstream
source or executable is vendored.

Read-only verification covered all five files in the separate copy folder,
`D:\Starfield\StarfieldCompanionSaves`. All player headers and plugin lists
decoded, each using engine 27/save format 153/game version 1.16.244.0. Folder mode
selected the exit save with the highest modification time. SHA-256 digests and
modification times matched before and after the five-file run. The newest save
expanded to 38,532,276 bytes in 147 chunks. A private JSON preview is stored at
ignored `backend/instance/save_extracts/preview-20261011-final.json`. Real save bytes,
research exports and private snapshots are excluded from the commit.

Verification:

- `.venv/Scripts/python.exe -m pytest -q backend --basetemp=backend/instance/save-reader-final-tests`: **126 passed**, including 29 extractor cases.
- Real five-file extraction and source-preservation check: **passed**.
- CLI newest-file JSON export to the ignored preview path: **passed**.
- `npm --prefix frontend run lint`: **passed**.
- `npm --prefix frontend run build`: **passed** outside the Windows sandbox.
- Policy hook self-test: **12 cases passed**.
- Active-gate validator, active/root Markdown links and `git diff --check`: **passed**.

Tests cover multichunk padding and nondefault table offsets, metadata values,
UTF-8 names, creation details, unknown versions, invalid lengths/offsets,
checksums, oversized expansion, non-finite values, timestamp overflow,
undecoded plugin warnings, changing inputs, newest-file selection, `.partial`
exclusion, no silent stale fallback, atomic output and overwrite refusal.
Artificial fixture bytes are generated at test time; player saves are not fixtures.

The initial runs reported 28/29 and 125/126 passing tests: Windows sandbox
temporary-directory permissions blocked output publication in a child process.
The full suite passed with workspace-local temporary files. A sandboxed Vite
build failed on resolving `frontend/index.html`; the approved build outside that
sandbox passed. Browser tests were not rerun because no UI or HTTP routes changed.
The Context Ledger-specific documentation audit does not apply to this project's
unnumbered gate; the project's active-gate validator and link audit were used.

Limits: known save-layout family 140–153 is accepted, with synthetic evidence for
140/143/153 and real evidence only for 153. Gameplay records remain undecoded;
inventory, ship builds, outposts, missions and surveys are not inferred from raw
bytes. Unknown plugin layouts preserve the player header with a warning. File
age and read-time identity checks supplement, but do not replace, temporary-name
publication by the copy job. No original game-save folder was inspected, and no
player database, uploads or frontend behavior was changed. The next user decision
is which extracted fields should first appear in the app.

## Mission Run 2 report

Date: 2026-10-04 (America/New_York). Branch: `codex/mission-run-1`.

## Delivered experience

The amended mission adds two persistent design tools. **Supply Chain Visualizer** at `/logistics/supply-network` provides an original SVG cargo canvas, drag/pan/zoom and keyboard controls, saved outpost links, planned sites, directed resource manifests and Helium-3 budgeting. It distinguishes supplied, short, broken, unmeasured and paused routes. Shared budgets prevent double allocation; blocked routes can resume when imports arrive. Saved networks retain node positions, route priorities and notes; users can duplicate, undo edits and export JSON. Clearing starter samples retains any outpost used by a saved network.

**Ship Forge** at `/crew/blueprints` provides an original loadout schematic, 34 revision-attributed modules across A/B/C classes, custom measurements, saved module snapshots and comparisons between refits. It calculates total mass, hull, shield, cargo and fuel; full-power engine speed; estimated mobility and jump range; and crew capacity constrained by module rating, stations and the entered command allowance. Readiness diagnostics cover core modules, class compatibility, engine power, shield count and short jump range. A survey cutter and cargo tender open as editable examples. The Cargo Link Mapper likewise opens with a three-system corridor; examples become records only when explicitly saved.

Both tools are reached through workspace sub-tabs and Command Hub launchers. They reuse the JSON client, Tailwind tokens and accessible form/dialog primitives without adding a graphics dependency. Draft graph validation runs on Apply and keeps invalid values in the dialog. Debounced previews cancel stale responses and avoid displaying old statistics as current. New tables are added without modifying existing columns or player records.

The terminal has five primary workspaces: **Command Hub**, **Galaxy & Surveys**, **Logistics & Industry**, **Fleet & Crew**, and **Logbook & Archives**. Nested tools retain their existing APIs. Legacy module routes redirect with queries and anchors intact; system search opens Galaxy directly. Command Hub provides resume radar, ship briefing, The Frontier, crew/outpost telemetry, recent logs, survey milestones and three creation shortcuts. Drive-By remains available throughout the terminal.

Fresh profiles receive a single transactional **Constellation starter state**: The Frontier; Barrett and VASCO assigned; the Vectera artifact-discovery log at stardate 2330.134; One Small Step with two checked steps; an active Narion survey checklist; Luna Extraction Post; and Vectera/Jemison/Kreet survey progress. Footer settings clear unchanged examples only after explicit confirmation. Modified records, attached media, linked logs and player additions are kept. Restarts do not reapply or resurrect samples. Existing profiles receive no sample playthrough content.

The catalog contains **47 revision-attributed worlds in nine systems**, with normalized resource symbols, environment fields, inferred hazard cautions, and orbital parent metadata. PlanetReference stores source payloads independently of editable profiles. The planets-v2 expansion adds missing new worlds once; it preserves legacy edits and deletions. The cached MediaWiki build reproduces the checked-in catalog exactly.

The **128-system sector map** uses stable spaced positions with Sol and Alpha Centauri central, Cheyenne northwest, Volii southwest and Kryx northeast. Selecting a star opens its spectral class, level/faction indicators, worlds and moons, outposts and active missions. Planet selection opens environmental readings, resource deposits, survey gaps, notes, media, source links, expedition-log creation and surface-outpost planning. Gas/ice giants and asteroid moons retain orbital records without a surface-build action. Planet inspectors can be closed and reopened through the same system link.

Unnamed outpost forms no longer issue invalid preview requests. Validation feedback appears after blur or submission; native required fields still prevent empty saves. Fractional calibration values remain editable and save correctly. Atmospheric & Orbital Calibration, the resource prospecting description, vacuum warnings and local ship-computer telemetry use terminal language. Briefings include the latest logged location.

## Verification

| Check | Result |
|---|---|
| `.venv/Scripts/python.exe -m pytest -q backend` | **97 passed**, zero failures; original 71 retained plus 26 Run 2 cases |
| `npm --prefix frontend run lint` | **Zero errors** |
| `npm --prefix frontend run build` | **Passed**; 98 modules, 367.26 kB JS / 112.95 kB gzip |
| `npm --prefix frontend test` | **19 passed**; original ten flows plus nine Run 2 flows |
| Browser follow-up for fractional calibration | **1 passed** after allowing the seeded 2/3 factor in the numeric field |
| Policy hook self-test | **12 cases passed** |
| Offline planet builder | **47 worlds reproduced byte-for-byte** |
| Offline ship-module builder | **34 modules reproduced byte-for-byte** |
| Active-gate validator | **Passed** |
| Active/root/supporting Markdown links | **No broken local links** |
| `git diff --check` | **Passed** |

Backend coverage includes fresh boot, restart idempotence, legacy upgrade preservation, conservative starter removal, retained user edits and linked samples, system/world/asset joins, source metadata, deterministic sector positions and parser unknowns. The original helium-search test now verifies Luna's presence instead of assuming it is the first alphabetical supplier in the larger catalog.

New design-tool tests cover ordered reservations, shared fuel/cargo consumption, imported fuel, unfunded cycles, unknown rates, broken endpoints, linked outpost power/deletion, duplicate outpost protection, bounded/type-safe validation, blueprint mass effects, crew constraints, illegal loadout diagnostics, UTC CRUD and snapshot independence. A starter-clear regression protects network-linked Luna plans.

Browser coverage includes the five-workspace hierarchy, active navigation, preserved legacy queries/anchors, zero untouched-form errors, Narion/Vectera and Sol/Luna navigation, Jemison counters, planet-inspector reopening, starter confirmation/cancellation, existing CRUD/media/planning flows and 390 px layouts. The first run found one ambiguous Jemison selector that also matched Kurtz's orbital parent; the corrected complete suite passed. Desktop Hub and Galaxy screenshots and the mobile Galaxy screenshot were visually inspected. The browser test servers used an in-memory database, temporary uploads and mock AI, without touching the user's database or uploaded files.

The added browser flows verify canvas dragging and saved positions, fuel shortage/repair, keyboard placement and connections, deletion/undo, custom ship measurements, refit comparisons, save/reload and completed JSON export. Analysis failure recovery and both tools at 390 px are covered. Desktop and mobile cargo/ship screenshots were visually inspected. Initial test selectors were corrected to scroll the drag target into view and use the select's accessible role/name. An Edge context teardown race was resolved by awaiting download completion before closing the exporting test; the final complete suite passed with 19/19 tests.

The Windows filesystem sandbox initially blocked esbuild's parent-directory/config access. The approved build and browser commands ran outside that restriction and passed. No live paid AI calls, Electron native-window test, package installation or external publication was performed.

## Source decisions and limits

1. Jemison's catalog totals are **8 flora, 9 fauna and 3 traits**. The illustrative starter progress remains 65%, with 3 flora, 2 fauna and 1 trait scanned. The brief's 5/4/1 denominators were not inserted as false reference facts.
2. **The Lock is a location on Suvorov**, so it is not duplicated as a world. The Deimos page is explicitly disambiguated to the moon.
3. The two solar arrays have a sourced baseline of 6 each; the extractor uses 5. The sample plan records an explicit solar factor of **2/3**, yielding 8 generated and **+3 net power**. That factor is illustrative, not a game formula. Storage capacity and extraction rates remain unmeasured.
4. The starter assignments, mission state, log prose and progress are an editable example playthrough. The fixed UTC sample log date produces the requested cosmetic stardate; no game-save integration is implied.
5. Map coordinates are schematic sector positions, not physical distances or an exact game map. Hazard labels are preparation inferences, not invented numeric game ratings. Full source URLs, revisions and licensing are in [provenance](../../../backend/data/SOURCES.md).
6. World coverage is deliberately bounded at 47. Existing player profiles retain their environmental edits, even when newer reference facts differ. The immutable reference payload is separate from the editable overlay.
7. Starter clearing is deliberately conservative and may leave edited sample records. It retains media files and their referenced logs, and is not a destructive whole-profile reset.
8. Cargo calculations use measured units/minute and complete-route reservations. They do not simulate buffers, actual cargo-ship cadence or partial shipments. Link-depot counts above three require the player to check their skill allowance. Templates use illustrative rates; linked real plans preserve unknown extraction rates.
9. Ship jump range uses an explicitly labelled community-derived estimate; mobility follows the documented thrust/mass formula. Ship geometry, landing thrust, weapon grouping, crew/skill/optimization bonuses and flight legality require the game. The schematic is illustrative, not an importable in-game blueprint. Sources, equations and attribution are exposed in the UI and [source register](../../../backend/data/SOURCES.md).

## Documentation and handoff

README, architecture and API contracts describe the five workspaces and design-tool endpoints. The user's amended mission text is preserved in [AMENDED_MISSION_BRIEF.md](../../archive/mission-run-2/AMENDED_MISSION_BRIEF.md), with the root file routing to it. The Mission Run 1 report and initial Run 2 specification also remain archived. The single active gate is forward-looking and returns workflow review to the user. The Context Ledger-specific audit script is not applicable to this repository's phase vocabulary; Starfield's gate, link and hook checks pass.

Implementation commits: `ad624f2` (starter state, worlds and sector layout), `a24d3fb` (workspace UI), and `3df86b2` (cargo networks, Ship Forge, sourced modules and regressions). Documentation is committed separately on the same branch. No push or pull request is part of this mission. Control returns to the user for workflow review or a concrete new request.
