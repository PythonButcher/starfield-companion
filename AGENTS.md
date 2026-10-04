# Starfield collaboration

Read [project_docs/INDEX.md](project_docs/INDEX.md), then the single current [active gate](project_docs/active/active_gate/README.md) before changing the project. The API contract and architecture are supporting references. Archived briefs are historical only.

Work incrementally; preserve user data and unrelated changes. Use React JavaScript, Tailwind v4 tokens in `frontend/src/index.css`, Flask app factory and domain blueprints. Never import backend files into frontend code. AI tests must use mock mode. Cite seeded game facts in `backend/data/SOURCES.md`. No scraped game assets, secrets, database files, uploads, or dependency directories in Git. Use UTC timestamps and JSON API errors. Commit verified vertical slices; never rewrite history or discard changes.

Commands (from repository root, PowerShell):

- `python -m venv .venv`; `.venv/Scripts/python -m pip install -r backend/requirements.txt`
- `.venv/Scripts/python -m pytest -q backend`
- `.venv/Scripts/python backend/main.py`
- `npm --prefix frontend install`; `npm --prefix frontend run lint`; `npm --prefix frontend run build`
- `python .codex/hooks/pre_tool_use_policy.py --self-test`
- `git diff --check`

Explain meaningful decisions, run proportionate checks, and record results and limitations in the execution status and run report. Keep the active gate forward-looking. Return control to the user after the requested scope is verified and documented.
