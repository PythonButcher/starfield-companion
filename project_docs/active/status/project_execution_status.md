# Execution status

Phase: Copied-save extraction experiment.
Branch: `codex/mission-run-1`.
Status: local extractor verified; ready for user review of extracted data and selection of an app connection.

The independent Python module and CLI decode copied saves into versioned JSON containing player details, save timestamps, game versions and plugin lists. Folder mode selects the newest direct `.sfs` file by modification time. Resource limits, integrity checks and read-only input handling protect the extraction boundary. JSON and optional research exports refuse existing output names.

Five real copied saves in the user's separate folder decoded successfully using format 153. SHA-256 hashes and modification times were unchanged after verification. A private JSON preview remains under ignored `backend/instance/save_extracts/`. Save files and exports are not committed. The app's existing player database and uploads were not touched.

Verification: **126 backend tests passed**, including 29 extractor cases; frontend lint and production build passed; 12 policy cases passed. Backend tests used workspace-local temporary storage because Windows sandbox temp-directory renames were blocked. The frontend build passed outside the sandbox after a Vite path-resolution restriction. Documentation checks and final whitespace results are recorded in the run report. AI tests use mock mode.

Limits: inventory, ship construction, outposts, missions and surveys remain undecoded. A saved location that names a ship does not supply its ship stats. Only format 153 has real-save evidence; synthetic fixtures exercise 140 and 143. The copy job must publish completed files using a temporary extension. Automatic monitoring, app UI and API integration are not implemented.

Results and limits: [run report](RUN_REPORT.md). Usage and format references: [extractor guide](../../../backend/save_reader/README.md). The [active gate](../active_gate/README.md) routes the next bounded request. Existing terminal functionality and its verification history are documented in the run report.
