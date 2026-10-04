"""Idempotent versioned seed batches; never overwrite edits or re-add deletions."""
import json
import hashlib
from pathlib import Path
from models import db, ReferenceRecord, SeedMarker, PlanetProfile, CrewMember

DATA = Path(__file__).resolve().parent / 'data'


def seed_reference():
    for name, filename in [('systems', 'starfield_universe.json'), ('research', 'research_clean.json')]:
        marker = f'{name}-v1'
        if db.session.get(SeedMarker, marker):
            continue
        for payload in json.loads((DATA / filename).read_text(encoding='utf-8')):
            db.session.add(ReferenceRecord(catalog=name, payload=payload))
        db.session.add(SeedMarker(name=marker))
    if not db.session.get(SeedMarker, 'planets-v1'):
        from routes.planets import apply_planet, validate_planet
        for payload in json.loads((DATA / 'planets.json').read_text(encoding='utf-8')):
            sources = payload.pop('_sources', [])
            planet = PlanetProfile(sources=sources)
            apply_planet(planet, validate_planet(payload, True))
            db.session.add(planet)
        db.session.add(SeedMarker(name='planets-v1'))
    if not db.session.get(SeedMarker, 'crew-v1'):
        from routes.crew import validate_crew
        for payload in json.loads((DATA / 'crew_data.json').read_text(encoding='utf-8')):
            sources = payload.pop('_sources', [])
            db.session.add(CrewMember(sources=sources, **validate_crew(payload, True)))
        db.session.add(SeedMarker(name='crew-v1'))
    # Only reference rows are replaceable. Player tables are never refreshed.
    for name in ('recipes', 'outpost_modules', 'resources', 'systems'):
        path = DATA / 'reference' / (name + '.json')
        if not path.exists():
            continue
        raw = path.read_bytes()
        marker = 'catalog:' + name + ':' + hashlib.sha256(raw).hexdigest()
        if db.session.get(SeedMarker, marker):
            continue
        db.session.execute(db.delete(ReferenceRecord).where(ReferenceRecord.catalog == name))
        for payload in json.loads(raw):
            db.session.add(ReferenceRecord(catalog=name, payload=payload))
        db.session.add(SeedMarker(name=marker))
    db.session.commit()


if __name__ == '__main__':
    from main import create_app
    app = create_app()
    with app.app_context():
        seed_reference()
    print('Reference catalogs ready.')
