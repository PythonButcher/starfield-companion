# Execution status

Phase: Manual copied-save app connection.
Branch: `codex/mission-run-1`.
Status: Current playthrough is connected and verified; ready for user review in Command Hub.

Command Hub displays character, level, saved location, playtime, experience, save date, game versions and plugin lists from the configured copied-save folder. The read-only API runs on page entry, Refresh save or Refresh terminal. Extraction failures retain the process's last successful reading with an explicit stale label. Folder changes clear that retained reading. No player models are imported or overwritten.

The local ignored `.env` points to `D:/Starfield/StarfieldCompanionSaves`. A real-folder API check succeeded, and source hashes and modification times were unchanged. The built app displayed the real character and location, refreshed successfully, fit a 390px viewport and had no browser errors. Private desktop/mobile screenshots remain under ignored `backend/instance/save_extracts/`. The verified review instance is running at `http://127.0.0.1:5002` using mock AI.

Verification: **131 backend tests passed**, **21 browser tests passed**, frontend lint and production build passed, and 12 policy cases passed. Two targeted browser cases also cover the final playtime formatting. Browser tests used isolated data, artificial save responses and mock AI outside the Windows sandbox. Final documentation checks and whitespace results are recorded in the run report.

Limits: inventory, ship construction, outposts, missions and surveys remain undecoded. A saved location that names a ship does not supply its ship stats. Last-successful readings are in memory and reset on backend restart. Automatic copying and background refresh are not enabled. The copy process must publish complete `.sfs` files with preserved modification times. The default-port verification issue is documented in the run report; the real app was verified on port 5002.

Results and limits: [run report](RUN_REPORT.md). Usage and format references: [extractor guide](../../../backend/save_reader/README.md). The [active gate](../active_gate/README.md) routes the next bounded request. Existing terminal functionality and its verification history are documented in the run report.
