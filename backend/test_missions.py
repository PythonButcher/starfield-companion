def test_mission_lifecycle_filters_checklist_and_dates(client):
    data = {'title': 'Survey goal', 'faction': 'Constellation', 'priority': 'High',
            'checklist': [{'id': 'one', 'text': 'Land', 'done': False}]}
    response = client.post('/api/missions', json=data)
    assert response.status_code == 201
    item = response.json
    route = '/api/missions/' + str(item['id'])
    assert client.get('/api/missions?faction=Constellation').json[0]['id'] == item['id']
    completed = client.patch(route, json={'status': 'Completed'}).json
    assert completed['completed_at'].endswith('+00:00')
    assert client.patch(route, json={'status': 'Active'}).json['completed_at'] is None
    assert client.patch(route, json={'checklist': [{'id': 'one', 'text': 'Land', 'done': True}]}).json['checklist'][0]['done']
    assert client.get('/api/missions?status=Paused').json == []
    assert client.delete(route).status_code == 200
    assert client.get(route).status_code == 404


def test_mission_links_are_transactional(client):
    mission = client.post('/api/missions', json={'title': 'Linked mission'}).json
    log = client.post('/api/logs', json={'title': 'Mission log', 'mission_id': mission['id']}).json
    route = '/api/missions/' + str(mission['id'])
    assert client.get(route).json['linked_log_ids'] == [log['id']]
    client.delete('/api/logs/' + str(log['id']))
    assert client.get(route).json['linked_log_ids'] == []
    assert client.post('/api/logs', json={'title': 'Invalid', 'mission_id': 99999}).status_code == 400
    for body in [{'title': 'x', 'priority': 'urgent'}, {'title': 'x', 'linked_log_ids': [99999]},
                 {'title': 'x', 'checklist': [{'id': 'a', 'text': 'A', 'done': 'yes'}]}]:
        assert client.post('/api/missions', json=body).status_code == 400
