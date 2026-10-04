"""Planning graphs and loadouts must conserve supply and preserve player snapshots."""
from copy import deepcopy

import pytest

from models import db, OutpostPlan
from services.ship_blueprints import catalog, evaluate


def node(identifier, production=None, system='Sol', **extra):
    return dict(id=identifier, name=identifier, system=system, x=100, y=200, production=production or []) | extra


def route(identifier, source, target, resource='Iron', rate=2, **extra):
    return dict(id=identifier, source=source, target=target, kind='local', resources=[{'resource': resource, 'rate': rate}], **extra)


def analyze(client, nodes, links):
    response = client.post('/api/supply-networks/analyze', json={'nodes': nodes, 'links': links})
    assert response.status_code == 200, response.json
    return response.json


def test_cargo_reservations_fuel_imports_and_competing_routes(client):
    nodes = [node('mine', [{'resource': 'Iron', 'rate': 4}]), node('fuel', [{'resource': 'He3', 'rate': 1}]),
             node('factory', system='Narion')]
    inter = route('export', 'mine', 'factory', rate=4, fuel_node_id='mine', fuel_rate=1)
    inter['kind'] = 'inter-system'
    links = [inter, route('fuel-feed', 'fuel', 'mine', 'He-3', 1), route('competing', 'mine', 'fuel')]
    result = analyze(client, nodes, links)
    assert [r['status'] for r in result['links']] == ['shortage', 'ready', 'ready']
    # A later ready route reserves supply; changing order expresses planner priority.
    result = analyze(client, nodes, [links[1], links[0], links[2]])
    assert [r['status'] for r in result['links']] == ['ready', 'ready', 'shortage']
    assert result['nodes'][0]['remaining']['Helium-3'] == 0
    assert result['nodes'][2]['remaining']['Iron'] == 4


def test_cargo_fuel_shortage_and_unfunded_cycles(client):
    nodes = [node('a', [{'resource': 'Iron', 'rate': 4}]), node('b', system='Narion')]
    link = route('ab', 'a', 'b', fuel_node_id='a', fuel_rate=0.5)
    link['kind'] = 'inter-system'
    result = analyze(client, nodes, [link])
    assert result['links'][0]['status'] == 'shortage'
    assert 'Fuel shortage' in ' '.join(result['links'][0]['issues'])
    result = analyze(client, [node('a'), node('b')], [route('ab', 'a', 'b'), route('ba', 'b', 'a')])
    assert result['summary'] == {'shortage': 2}


def test_cargo_unknowns_and_dangling_references(client):
    result = analyze(client, [node('a', [{'resource': 'Iron', 'rate': None}]), node('b')],
                     [route('ab', 'a', 'b'), route('missing', 'b', 'absent')])
    assert result['links'][0]['status'] == 'unverified'
    assert result['links'][1]['status'] == 'broken'
    result = analyze(client, [node('a'), node('b', system='Narion')], [route('ab', 'a', 'b')])
    assert result['links'][0]['status'] == 'broken'


def test_linked_outpost_power_and_deletion(client, app):
    modules = client.get('/api/outposts/modules?limit=200').json
    extractor = next(m for m in modules if m['category'] == 'Extractors')
    world = client.get('/api/planets?q=Luna').json[0]
    resource = world['resources'][0]['name']
    with app.app_context():
        item = OutpostPlan(name='Actual site', planet_id=world['id'], modules=[
            {'module_id': extractor['id'], 'count': 1, 'resource': resource, 'rate_per_minute': 4}])
        db.session.add(item)
        db.session.commit()
        identifier = item.id
    nodes = [node('mine', outpost_id=identifier), node('sink')]
    result = analyze(client, nodes, [route('r', 'mine', 'sink', resource)])
    assert 'power deficit' in result['nodes'][0]['issues'][0]
    assert result['links'][0]['status'] == 'broken'
    client.delete(f'/api/outposts/{identifier}')
    result = analyze(client, nodes, [])
    assert 'deleted' in result['nodes'][0]['issues'][0]


@pytest.mark.parametrize('payload', [
    {'nodes': [node('a'), node('a')]}, {'nodes': [node('a', x='bad')]},
    {'nodes': [node('a', [{'resource': 'He3', 'rate': 1}, {'resource': 'Helium-3', 'rate': 1}])]},
    {'links': [route('a', 'x', 'y', rate=True)]}, {'links': [dict(id='x')]},
    {'nodes': [node('a', production=[{'resource': 'Iron', 'rate': -1}])]},
    {'nodes': [node('a', outpost_id=1), node('b', outpost_id=1)]},
])
def test_cargo_rejects_malformed_graphs(client, payload):
    response = client.post('/api/supply-networks/analyze', json=payload)
    assert response.status_code == 400
    assert response.json['error']['code'] == 'validation_error'


def loadout():
    modules = []
    for category in ('Reactor', 'Engine', 'Grav drive', 'Shield', 'Cockpit', 'Hab', 'Landing bay', 'Landing gear', 'Docker'):
        row = deepcopy(next(row for row in catalog() if row['category'] == category))
        row.pop('_source')
        row['count'] = 2 if category == 'Engine' else 1
        modules.append(row)
    return modules


def test_ship_totals_mass_effect_and_crew_constraints():
    modules = loadout()
    baseline = evaluate(modules, crew_limit=3)['stats']
    assert baseline['mass'] == sum(m['stats']['mass'] * m['count'] for m in modules)
    assert baseline['hull'] == sum(m['stats']['hull'] * m['count'] for m in modules)
    assert baseline['shield'] == 310 and baseline['top_speed'] == 150
    assert baseline['crew_capacity'] == 2
    heavy = deepcopy(modules)
    heavy[-1]['stats']['mass'] = 2000
    result = evaluate(heavy, crew_limit=1)['stats']
    assert result['mobility'] < baseline['mobility']
    assert result['jump_range'] < baseline['jump_range']
    assert result['crew_capacity'] == 1
    assert evaluate(modules, jump_bonus=100)['stats']['jump_range'] <= 30


def test_ship_unknowns_and_illegal_loadouts_are_honest():
    modules = loadout()
    modules[1]['stats']['mass'] = None
    modules[1]['ship_class'] = 'C'
    modules[1]['count'] = 10
    analysis = evaluate(modules)
    assert analysis['stats']['mass'] is None
    assert analysis['stats']['mobility'] is None
    assert analysis['stats']['jump_range'] is None
    assert any('12-power' in warning for warning in analysis['warnings'])
    assert any('reactor class' in warning for warning in analysis['warnings'])


@pytest.mark.parametrize('path,payload', [
    ('supply-networks', {'name': 'Mining ring', 'nodes': [node('a')], 'links': []}),
    ('ship-blueprints', {'name': 'Scout', 'modules': loadout(), 'crew_limit': 3, 'jump_bonus': 0}),
])
def test_design_record_lifecycle(client, path, payload):
    root = '/api/' + path
    created = client.post(root, json=payload)
    assert created.status_code == 201, created.json
    url = root + '/' + str(created.json['id'])
    assert created.json['created_at'].endswith('+00:00')
    updated = client.patch(url, json={'name': 'Revised', 'notes': 'Keep my design'})
    assert updated.status_code == 200
    assert client.get(url).json['name'] == 'Revised'
    assert client.get(root + '?q=Revised').headers['X-Total-Count'] == '1'
    assert client.post(root, json={'name': ''}).status_code == 400
    assert client.patch(url, json={'unknown': 3}).status_code == 400
    assert client.get(url).json['notes'] == 'Keep my design'
    assert client.delete(url).status_code == 200
    assert client.get(url).status_code == 404


def test_blueprint_snapshot_independence_and_validation(client):
    modules = loadout()
    modules[0]['stats']['hull'] = 888
    response = client.post('/api/ship-blueprints', json={'name': 'Custom refit', 'modules': modules})
    assert response.status_code == 201
    assert response.json['modules'][0]['stats']['hull'] == 888
    assert catalog()[0]['stats']['hull'] != 888
    modules[0]['stats']['mass'] = float('inf')
    assert client.post('/api/ship-blueprints/analyze', json={'modules': modules}).status_code == 400
    assert client.post('/api/ship-blueprints/analyze', json={'crew_limit': True}).status_code == 400
    assert len(client.get('/api/ship-blueprints/catalog').json['modules']) == 34
