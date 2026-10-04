def module(client, name):
    return next(m for m in client.get('/api/outposts/modules?limit=200').json if m['name'] == name)['id']


def test_outpost_power_cost_crud_and_detachment(client):
    world = client.post('/api/planets', json={'name': 'Vacuum', 'atmosphere': 'None', 'resources': ['Iron']}).json
    rows = [{'module_id': module(client, 'Wind Turbine'), 'count': 2},
            {'module_id': module(client, 'Extractor - Solid'), 'count': 1, 'resource': 'Iron', 'rate_per_minute': 2}]
    data = {'name': 'Iron mine', 'planet_id': world['id'], 'modules': rows}
    plan = client.post('/api/outposts/plan', json=data).json
    assert plan['generation'] == 0 and plan['net_power'] == -5
    assert plan['rates_per_minute']['Iron'] == 0
    assert plan['shopping_list']['Aluminum'] == 14
    item = client.post('/api/outposts', json=data).json
    response = client.patch('/api/outposts/' + str(item['id']), json={'modules': rows + [{'module_id': module(client, 'Solar Array'), 'count': 1}]})
    assert response.json['analysis']['net_power'] == 1
    client.delete('/api/planets/' + str(world['id']))
    assert client.get('/api/outposts/' + str(item['id'])).json['planet_id'] is None
    assert client.delete('/api/outposts/' + str(item['id'])).status_code == 200


def test_unknown_capacity_fuel_validation(client):
    storage = module(client, 'Storage - Solid')
    assert client.post('/api/outposts/plan', json={'modules': [{'module_id': storage, 'count': 1}]}).json['storage_capacity'] is None
    measured = client.post('/api/outposts/plan', json={'stored_mass': 200, 'modules': [{'module_id': storage, 'count': 2, 'capacity': 75}]}).json
    assert measured['storage_capacity'] == 150 and measured['storage_overflow']
    fuel = [{'module_id': module(client, 'Fueled Generator'), 'count': 1}]
    assert client.post('/api/outposts/plan', json={'modules': fuel}).json['generation'] == 0
    assert client.post('/api/outposts/plan', json={'modules': fuel, 'environment': {'fuel_available': True}}).json['generation'] == 20
    for invalid in [{'modules': [{'module_id': 'bad', 'count': 1}]}, {'modules': [{'module_id': storage, 'count': True}]}, {'planet_id': 99999}, {'environment': {'solar_factor': -1}}]:
        assert client.post('/api/outposts/plan', json=invalid).status_code == 400
