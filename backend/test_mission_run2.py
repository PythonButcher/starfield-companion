"""Fresh boot, upgrade, removal and connected map contracts for Mission Run 2."""
import json

import pytest
from main import create_app
from models import db, PlanetProfile, SeedMarker
from seed import seed_reference
from services.starter import initialize_starter
from data_pipeline.map_layout import sector_layout
from data_pipeline.planet_catalog import parse_planet, WORLDS


@pytest.fixture
def starter_app(tmp_path):
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///' + (tmp_path / 'player.db').as_posix(),
                      'UPLOAD_FOLDER': str(tmp_path / 'uploads'), 'AI_MODE': 'mock', 'OPENAI_API_KEY': ''})
    yield app
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


def test_fresh_constellation_state(starter_app):
    client = starter_app.test_client()
    assert client.get('/api/starter').json['status'] == 'active'
    ship = client.get('/api/ships').json[0]
    assert ship['name'] == 'The Frontier' and ship['home_ship']
    assert {c['name'] for c in ship['crew']} == {'Barrett', 'VASCO'}
    handover = client.get('/api/radar/session_handover').json
    assert handover['position']['planet'] == 'Vectera' and handover['position']['system'] == 'Narion'
    assert handover['stats']['assigned_crew'] == 2 and handover['stats']['outposts'] == 1
    assert handover['recent_logs'][0]['stardate'] == '2330.134'
    assert {m['title'] for m in handover['missions']} == {'One Small Step', 'Survey the Narion System'}
    mission = next(m for m in handover['missions'] if m['title'] == 'One Small Step')
    assert [s['done'] for s in mission['checklist']] == [True, True, False]
    assert handover['survey_targets'][0]['planet']['name'] == 'Kreet'
    plan = client.get('/api/outposts').json[0]
    assert plan['planet_name'] == 'Luna' and plan['analysis']['net_power'] == 3
    assert [m['count'] for m in plan['modules']] == [1, 2, 1]
    worlds = {p['name']: p for p in client.get('/api/planets').json}
    assert worlds['Vectera']['surveyed_percent'] == 100
    assert worlds['Jemison']['surveyed_percent'] == 65
    survey = client.get(f"/api/surveys/{worlds['Jemison']['id']}").json
    assert survey['counters']['flora']['scanned'] == 3
    assert survey['counters']['flora']['total'] == 8  # Sourced world totals, not illustrative brief denominators.
    assert survey['counters']['fauna']['scanned'] == 2
    assert survey['counters']['traits']['scanned'] == 1
    assert client.get('/api/briefing').json['mode'] == 'mock'
    assert 'Location: Vectera.' in client.get('/api/briefing').json['briefing']


def test_restart_never_reapplies_edits_or_deletions(starter_app):
    client = starter_app.test_client()
    log = client.get('/api/logs').json[0]
    client.delete('/api/logs/' + str(log['id']))
    barrett = next(c for c in client.get('/api/crew').json if c['name'] == 'Barrett')
    client.patch('/api/crew/' + str(barrett['id']), json={'assigned_ship': '', 'notes': 'My assignment'})
    restarted = create_app(dict(starter_app.config))
    with restarted.test_client() as again:
        assert again.get('/api/logs').json == []
        assert again.get('/api/crew/' + str(barrett['id'])).json['assigned_ship'] == ''
        assert len(again.get('/api/ships').json) == 1
    with restarted.app_context():
        db.session.remove()
        db.engine.dispose()


def test_existing_profile_not_seeded(app, client):
    client.post('/api/logs', json={'title': 'My own journey'})
    with app.app_context():
        initialize_starter(False)
        initialize_starter(True)
    assert client.get('/api/starter').json['status'] == 'existing_profile'
    assert len(client.get('/api/logs').json) == 1
    assert client.get('/api/ships').json == []
    assert client.get('/api/outposts').json == []


def test_expansion_preserves_legacy_edits_and_deleted_worlds(app):
    original = {'Jemison', 'Mars', 'Luna', 'Akila', 'Volii Alpha', 'Niira', 'Earth'}
    with app.app_context():
        for world in db.session.scalars(db.select(PlanetProfile)):
            if world.name not in original or world.name == 'Mars':
                db.session.delete(world)
            elif world.name == 'Luna':
                world.user_notes = 'Preserve my lunar base'
                world.surveyed_percent = 82
        db.session.delete(db.session.get(SeedMarker, 'planets-v2'))
        db.session.commit()
        seed_reference()
        worlds = {p.name: p for p in db.session.scalars(db.select(PlanetProfile))}
        assert len(worlds) == 46 and 'Mars' not in worlds
        assert worlds['Luna'].user_notes == 'Preserve my lunar base'
        assert worlds['Luna'].surveyed_percent == 82
        db.session.delete(worlds['Vectera'])
        db.session.commit()
        seed_reference()
        assert db.session.scalar(db.select(PlanetProfile).where(PlanetProfile.name == 'Vectera')) is None


def test_clear_requires_confirmation_and_does_not_reseed(starter_app):
    client = starter_app.test_client()
    assert client.post('/api/starter/clear', json={}).status_code == 400
    assert client.get('/api/logs').json
    result = client.post('/api/starter/clear', json={'confirm': 'CLEAR STARTER'}).json
    assert result['preserved'] == 0 and result['status'] == 'cleared'
    assert client.get('/api/logs').json == [] and client.get('/api/ships').json == []
    assert client.get('/api/outposts').json == [] and client.get('/api/missions').json == []
    assert not any(c['assigned_ship'] for c in client.get('/api/crew').json)
    assert len(client.get('/api/planets').json) == 47
    assert not any(p['surveyed_percent'] for p in client.get('/api/planets').json)
    with starter_app.app_context():
        seed_reference()
        initialize_starter(True)
    assert client.get('/api/logs').json == []
    assert client.post('/api/starter/clear', json={'confirm': 'CLEAR STARTER'}).json['removed'] == 0


def test_clear_keeps_player_changes_and_linked_samples(starter_app):
    client = starter_app.test_client()
    starter_log = client.get('/api/logs').json[0]
    own_log = client.post('/api/logs', json={'title': 'My own log'}).json
    client.post('/api/missions', json={'title': 'Keep the artifact reference', 'linked_log_ids': [starter_log['id']]})
    outpost = client.get('/api/outposts').json[0]
    client.patch('/api/outposts/' + str(outpost['id']), json={'notes': 'Measured by me'})
    jemison = next(p for p in client.get('/api/planets').json if p['name'] == 'Jemison')
    client.patch(f"/api/surveys/{jemison['id']}/counters", json={'scanned_flora': 4})
    result = client.post('/api/starter/clear', json={'confirm': 'CLEAR STARTER'}).json
    assert result['preserved'] >= 4
    assert client.get('/api/logs/' + str(own_log['id'])).status_code == 200
    assert client.get('/api/logs/' + str(starter_log['id'])).status_code == 200
    assert client.get('/api/outposts/' + str(outpost['id'])).json['notes'] == 'Measured by me'
    assert client.get(f"/api/surveys/{jemison['id']}").json['counters']['flora']['scanned'] == 4
    assert client.get('/api/planets/' + str(jemison['id'])).json['surveyed_percent'] == 65


def test_system_inspector_connects_worlds_and_assets(starter_app):
    client = starter_app.test_client()
    systems = {s['name']: s for s in client.get('/api/systems?limit=200').json}
    sol = client.get('/api/systems/' + str(systems['Sol']['id'])).json
    assert len(sol['planets']) == 19
    assert sol['outposts'][0]['name'] == 'Luna Extraction Post'
    assert sol['missions'] == []
    narion = client.get('/api/systems/' + str(systems['Narion']['id'])).json
    assert {p['name'] for p in narion['planets']} == set(WORLDS['Narion'])
    assert narion['missions'][0]['title'] == 'Survey the Narion System'
    vectera = next(p for p in narion['planets'] if p['name'] == 'Vectera')
    assert vectera['_reference']['orbits'] == 'Anselon'
    assert client.get('/api/systems/99999').status_code == 404
    empty = next(s for name, s in systems.items() if name not in WORLDS)
    assert client.get('/api/systems/' + str(empty['id'])).json['planets'] == []


def test_reference_catalog_provenance_and_sector_layout(client):
    worlds = client.get('/api/planets').json
    assert len(worlds) == 47
    assert len({(p['system_name'], p['name']) for p in worlds}) == len(worlds)
    assert 'The Lock' not in {p['name'] for p in worlds}
    for world in worlds:
        assert world['_sources'] and world['_reference']['revision']
        assert world['_reference']['license'] == 'CC-BY-SA-4.0'
        assert all(r['symbol'] for r in world['resources'])
    systems = client.get('/api/systems?limit=200').json
    assert sector_layout(json.loads(json.dumps(systems))) == systems
    coords = {s['name']: (s['x'], s['y']) for s in systems}
    assert len(set(coords.values())) == len(systems)
    assert coords['Sol'] == (0, 0)
    assert coords['Cheyenne'][0] < 0 and coords['Cheyenne'][1] < 0
    assert coords['Volii'][0] < 0 < coords['Volii'][1]
    assert coords['Kryx'][0] > 0 > coords['Kryx'][1]


def test_planet_parser_retains_unknowns_and_rejects_non_planets():
    page = {'title': 'Starfield:Test', 'source_url': 'https://example.invalid', 'revision': 1,
            'timestamp': '2026-10-04T00:00:00Z', 'fetched_at': '2026-10-04T00:00:00Z', 'license': 'CC-BY-SA-4.0',
            'wikitext': '{{Planet Infobox|name=Test|system=Sol|type=Rock|temp=Cold|atmosphere=None}}'}
    row = parse_planet(page, {})
    assert row['flora'] is None and row['fauna'] is None and row['gravity'] is None
    assert row['hazards'] == ['Cold exposure', 'Vacuum']
    with pytest.raises(ValueError):
        parse_planet({**page, 'wikitext': '{{Place Infobox|planet=Suvorov}}'}, {})
