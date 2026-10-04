"""Idempotent versioned seed batches; never overwrite edits or re-add deletions."""
import json
from pathlib import Path
from models import db, ReferenceRecord, SeedMarker

DATA = Path(__file__).resolve().parent / 'data'


def seed_reference():
    for name, filename in [('systems', 'starfield_universe.json'), ('research', 'research_clean.json')]:
        marker = f'{name}-v1'
        if db.session.get(SeedMarker, marker):
            continue
        for payload in json.loads((DATA / filename).read_text(encoding='utf-8')):
            db.session.add(ReferenceRecord(catalog=name, payload=payload))
        db.session.add(SeedMarker(name=marker))
    db.session.commit()


if __name__ == '__main__':
    from main import create_app
    app = create_app()
    with app.app_context():
        seed_reference()
    print('Reference catalogs ready.')
