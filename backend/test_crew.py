import pytest
from models import db, CrewMember
from seed import seed_reference


def test_crew_seed_crud_and_filter(app, client):
    assert len(client.get('/api/crew').json) == 9
    sarah = client.get('/api/crew?q=Sarah').json[0]
    assert {'name': 'Lasers', 'rank': 3} in sarah['skills']
    assert sarah['_sources']
    with app.app_context():
        seed_reference()
        assert db.session.query(CrewMember).count() == 9
    response = client.post('/api/crew', json={'name': 'Test recruit', 'skills': [{'name': 'Piloting', 'rank': 2}]})
    assert response.status_code == 201
    path = f"/api/crew/{response.json['id']}"
    assert client.get(path).json['name'] == 'Test recruit'
    assert client.patch(path, json={'assigned_ship': 'Frontier'}).json['assigned_ship'] == 'Frontier'
    assert len(client.get('/api/crew?assignment=ship&skill=pilot').json) == 1
    assert client.patch(path, json={'assigned_outpost': 'Base'}).status_code == 400
    assert client.put(path, json={'assigned_ship': '', 'assigned_outpost': 'Base'}).status_code == 200
    assert client.delete(path).status_code == 200
    for method in ('get', 'patch', 'put', 'delete'):
        assert getattr(client, method)(path, json={}).status_code == 404


@pytest.mark.parametrize('data', [{}, {'name': ''}, {'name': 'x', 'is_companion': 1}, {'name': 'x', 'skills': 'bad'}, {'name': 'x', 'skills': [{'name': 'Piloting', 'rank': 5}]}, {'name': 'x', 'skills': [{'name': 'Piloting', 'rank': 2}, {'name': 'piloting', 'rank': 3}]}, {'name': 'x', 'portrait_url': 'javascript:alert(1)'}, {'name': 'x', 'assigned_ship': 'x', 'assigned_outpost': 'y'}])
def test_bad_crew(client, data):
    assert client.post('/api/crew', json=data).status_code == 400


def test_optimizer_scores_are_explainable(client):
    result = client.get('/api/crew/optimize?goal=outpost&slots=2')
    assert result.status_code == 200
    assert {row['member']['name'] for row in result.json['selected']} == {'Lin', 'Heller'}
    assert result.json['total_score'] == sum(row['score'] for row in result.json['selected'])
    for goal in ('ship', 'combat'):
        data = client.get(f'/api/crew/optimize?goal={goal}&slots=3').json
        assert len(data['selected']) <= 3
        for row in data['selected']:
            assert row['score'] == sum(reason['rank'] * reason['weight'] for reason in row['reasons'])
    assert client.get('/api/crew/optimize?goal=outpost&slots=2').json == result.json


@pytest.mark.parametrize('query', ['goal=bad', 'slots=0', 'slots=21', 'slots=x', 'slots=1.5'])
def test_optimizer_validation(client, query):
    assert client.get('/api/crew/optimize?' + query).status_code == 400


def test_empty_optimizer_and_invalid_filter(app, client):
    with app.app_context():
        db.session.execute(db.delete(CrewMember))
        db.session.commit()
    assert client.get('/api/crew/optimize').json['selected'] == []
    assert client.get('/api/crew?assignment=invalid').status_code == 400
