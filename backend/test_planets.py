import pytest
from models import db, PlanetProfile, Resource
from seed import seed_reference


def test_seed_and_resource_search(app, client):
    assert 40 <= len(client.get('/api/planets').json) <= 60
    moon = client.get('/api/planets?q=Luna').json[0]
    assert moon['_sources']
    assert moon['surveyed_percent'] == 0
    assert 'Luna' in {p['name'] for p in client.get('/api/planets?resource=He-3').json}
    assert all(item['system_name'] == 'Sol' for item in client.get('/api/planets?system=Sol').json)
    assert client.get('/api/planets?hazard=vacuum').json
    assert all(.3 <= item['gravity'] <= 1 for item in client.get('/api/planets?min_gravity=.3&max_gravity=1').json)
    assert client.get('/api/resources?q=iron').json[0]['symbol'] == 'Fe'
    with app.app_context():
        count = db.session.query(PlanetProfile).count()
        seed_reference()
        assert db.session.query(PlanetProfile).count() == count


def test_planet_crud_and_normalized_resources(app, client):
    response = client.post('/api/planets', json={'name': 'Test world', 'resources': ['Iron', 'iron'], 'gravity': 1.2})
    assert response.status_code == 201
    path = f"/api/planets/{response.json['id']}"
    assert len(response.json['resources']) == 1
    assert client.get(path).status_code == 200
    assert client.patch(path, json={'favorite': True, 'surveyed_percent': 80, 'user_notes': 'Safe landing'}).json['favorite']
    assert client.put(path, json={'resources': []}).json['resources'] == []
    assert client.delete(path).status_code == 200
    for method in ('get', 'patch', 'put', 'delete'):
        assert getattr(client, method)(path, json={}).status_code == 404
    with app.app_context():
        assert db.session.query(Resource).filter_by(name='Iron').count() == 1


@pytest.mark.parametrize('data', [{}, {'name': ''}, {'name': 'x', 'gravity': -1}, {'name': 'x', 'favorite': 'yes'}, {'name': 'x', 'surveyed_percent': 101}, {'name': 'x', 'resources': [{'name': 'x', 'type': 'metal'}]}, {'name': 'x', 'hazards': 'cold'}, {'name': 'x', 'flora': 1.5}, {'name': 'x', 'unknown': 1}])
def test_invalid_planets(client, data):
    assert client.post('/api/planets', json=data).status_code == 400


@pytest.mark.parametrize('query', ['min_gravity=x', 'max_gravity=nan', 'min_gravity=2&max_gravity=1', 'limit=0'])
def test_invalid_filters(client, query):
    assert client.get('/api/planets?' + query).status_code == 400


def test_resource_hunt_ranking(client):
    client.post('/api/planets', json={'name': 'Both', 'resources': ['Iron', 'Copper'], 'hazards': ['Cold']})
    client.post('/api/planets', json={'name': 'Both safe', 'resources': ['Iron', 'Copper']})
    data = client.post('/api/resourcehunt', json={'resources': ['Iron', 'Copper']}).json
    assert data['results'][0]['planet']['name'] == 'Both safe'
    assert data['results'][0]['all_targets']
    assert client.post('/api/resourcehunt', json={'resources': ['not-real']}).json['results'] == []
    for value in ([], 'Iron', None):
        assert client.post('/api/resourcehunt', json={'resources': value}).status_code == 400


def test_deleting_planet_detaches_log(client):
    planet = client.post('/api/planets', json={'name': 'Temporary'}).json
    log = client.post('/api/logs', json={'title': 'Visit', 'planet_id': planet['id']}).json
    client.delete(f"/api/planets/{planet['id']}")
    assert client.get(f"/api/logs/{log['id']}").json['planet_id'] is None
