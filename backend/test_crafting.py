import pytest
from services.crafting import resolve
from validation import ApiError


def test_recursive_inventory_and_supplier(client):
    response = client.post('/api/crafting/resolve', json={'target': 'Comm Relay', 'quantity': 2,
                      'inventory': {'Isocentered Magnet': 1, 'Copper': 1}})
    assert response.status_code == 200
    result = response.json
    assert result['raw_totals']['Copper'] == 2
    assert result['deficits']['Copper'] == 1
    assert result['deficits']['Nickel'] < result['raw_totals']['Nickel']
    frame = client.post('/api/crafting/resolve', json={'target': 'Adaptive Frame', 'quantity': 3, 'inventory': {'Adaptive Frame': 1, 'Iron': 1}}).json
    assert frame['deficits'] == {'Aluminum': 2, 'Iron': 1}
    assert any(p['name'] == 'Luna' for p in frame['suppliers']['Iron'])


def test_shared_inventory_cycle_and_validation(client, app):
    with app.app_context():
        recipes = [{'name': 'Top', 'ingredients': {'Left': 1, 'Right': 1}}, {'name': 'Left', 'ingredients': {'Iron': 2}}, {'name': 'Right', 'ingredients': {'Iron': 2}}]
        assert resolve('Top', 1, {'Iron': 3}, recipes)['deficits'] == {'Iron': 1}
        with pytest.raises(ApiError, match='cycle'):
            resolve('Loop', 1, {}, [{'name': 'Loop', 'ingredients': {'Loop': 1}}])
    for body in [{'target': 'Adaptive Frame', 'quantity': 0}, {'target': 'Adaptive Frame', 'inventory': {'Iron': -1}}, {'target': 'Adaptive Frame', 'inventory': {'iron': 1, 'Iron': 2}}]:
        assert client.post('/api/crafting/resolve', json=body).status_code == 400
    assert client.post('/api/crafting/resolve', json={'target': 'Missing'}).status_code == 404
