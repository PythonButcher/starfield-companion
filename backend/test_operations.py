from services.operations import coverage
from models import db, PlanetProfile, SurveyProgress


def test_survey_unknown_bounds_and_filters(client):
    planet = client.post('/api/planets', json={'name': 'Ledger', 'system_name': 'Test', 'flora': 4, 'fauna': None, 'resources': ['Iron'], 'surveyed_percent': 80}).json
    route = f"/api/surveys/{planet['id']}/counters"
    result = client.patch(route, json={'scanned_flora': 3, 'scanned_resources': 1}).json
    assert result['counters']['flora']['remaining'] == 1
    assert result['counters']['fauna']['remaining'] is None
    assert client.patch(route, json={'scanned_flora': 5}).status_code == 400
    assert client.get('/api/surveys/gaps?system=Test&tier=nearly').json['planets'][0]['planet']['id'] == planet['id']
    client.patch(route, json={'surveyed_percent': 100})
    assert client.get('/api/surveys/gaps?system=Test').json['planets'] == []


def test_greedy_marginal_coverage_and_powered_extractors(client, app):
    with app.app_context():
        for planet in db.session.scalars(db.select(PlanetProfile)):
            db.session.delete(planet)
        db.session.commit()
    a = client.post('/api/planets', json={'name': 'A', 'resources': ['Iron', 'Copper']}).json
    client.post('/api/planets', json={'name': 'B', 'resources': ['Iron']})
    client.post('/api/planets', json={'name': 'C', 'resources': ['Aluminum']})
    result = client.get('/api/portfolio/coverage').json
    assert [r['planet']['name'] for r in result['recommendations']] == ['A', 'C']
    modules = client.get('/api/outposts/modules?limit=200').json
    extractor = next(m['id'] for m in modules if m['name'] == 'Extractor - Solid')
    solar = next(m['id'] for m in modules if m['name'] == 'Solar Array')
    item = client.post('/api/outposts', json={'name': 'Mine', 'planet_id': a['id'], 'modules': [{'module_id': extractor, 'count': 1, 'resource': 'Iron'}]}).json
    assert client.get('/api/portfolio/coverage').json['covered_count'] == 0
    client.patch('/api/outposts/' + str(item['id']), json={'modules': item['modules'] + [{'module_id': solar, 'count': 1}]})
    result = client.get('/api/portfolio/coverage').json
    assert result['covered_count'] == 1
    assert next(r for r in result['resources'] if r['name'] == 'Iron')['covered']
    assert not next(r for r in result['resources'] if r['name'] == 'Copper')['covered']


def test_radar_empty_then_cross_module_state(client):
    empty = client.get('/api/radar/session_handover').json
    assert empty['position']['source'] == 'Unknown' and empty['recent_logs'] == []
    world = client.post('/api/planets', json={'name': 'Resume', 'system_name': 'Sol', 'surveyed_percent': 80, 'favorite': True}).json
    client.post('/api/logs', json={'title': 'Last landing', 'planet_name': 'Resume', 'system_name': 'Sol', 'ai_narrative': 'Ready to explore.'})
    client.post('/api/missions', json={'title': 'Return', 'priority': 'High', 'target_system': 'Sol'})
    modules = client.get('/api/outposts/modules?limit=200').json
    extractor = next(m['id'] for m in modules if m['name'] == 'Extractor - Solid')
    client.post('/api/outposts', json={'name': 'No power', 'planet_id': world['id'], 'modules': [{'module_id': extractor, 'count': 1}]})
    result = client.get('/api/radar/session_handover').json
    assert result['position']['system'] == 'Sol'
    assert result['missions'][0]['title'] == 'Return'
    assert result['outpost_alerts'][0]['net_power'] == -5
    assert result['survey_targets'][0]['planet']['id'] == world['id']
    assert result['narrative'] == 'Ready to explore.'
    activity = client.get('/api/hub/map_activity').json
    assert 'Sol' in activity['outposts'] and 'Sol' in activity['missions']
    client.patch(f"/api/surveys/{world['id']}/counters", json={'scanned_resources': 0})
    assert client.get('/api/radar/session_handover').json['position']['source'] == 'Survey update'
