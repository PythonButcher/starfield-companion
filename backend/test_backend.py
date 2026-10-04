import pytest
from models import db, ReferenceRecord
from seed import seed_reference


def test_health_reference_and_idempotent_seed(app, client):
    assert client.get('/api/health').json == {'status': 'systems_nominal'}
    assert len(client.get('/api/systems').json) >= 10
    assert client.get('/api/research').json[0]['required_materials_normalized']
    with app.app_context():
        before = db.session.query(ReferenceRecord).count()
        seed_reference()
        assert db.session.query(ReferenceRecord).count() == before
    assert client.get('/api/systems?q=Sol&limit=1').json[0]['name'] == 'Sol'


def test_log_lifecycle_filter_and_pagination(client):
    response = client.post('/api/logs', json={'title': 'Survey', 'planet_name': 'Jemison', 'raw_notes': 'Landed safely.', 'tags': ['survey']})
    assert response.status_code == 201
    item = response.json
    assert item['date'].endswith('+00:00')
    assert item['stardate']
    path = f"/api/logs/{item['id']}"
    assert client.get(path).json['raw_notes'] == 'Landed safely.'
    assert client.patch(path, json={'title': 'Revised', 'tags': ['new']}).json['title'] == 'Revised'
    assert client.put(path, json={'location': 'New Atlantis'}).status_code == 200
    assert client.get('/api/logs?q=jemison&tag=new').headers['X-Total-Count'] == '1'
    assert client.get('/api/logs?tag=survey').json == []
    assert client.get('/api/logs?offset=1').json == []
    assert client.delete(path).json == {'deleted': item['id']}
    for method in ('get', 'patch', 'put', 'delete'):
        assert getattr(client, method)(path, json={}).status_code == 404


@pytest.mark.parametrize('data', [{}, {'title': ''}, {'title': 7}, {'title': 'x', 'notes': 'bad'}, {'title': 'x', 'tags': 'bad'}, {'title': 'x', 'planet_id': 999}, {'title': 'x', 'log_type': 'invalid'}])
def test_log_validation(client, data):
    response = client.post('/api/logs', json=data)
    assert response.status_code == 400
    assert response.json['error']['code'] == 'validation_error'
    assert client.get('/api/logs').json == []


@pytest.mark.parametrize('query', ['limit=0', 'limit=no', 'offset=-1', 'limit=201'])
def test_pagination_validation(client, query):
    assert client.get('/api/logs?' + query).status_code == 400


def test_json_errors(client):
    assert client.post('/api/logs', data='not json').status_code == 400
    assert client.get('/api/not-found').status_code == 404
    assert client.get('/api/not-found').is_json
    assert client.post('/api/health').status_code == 405


def test_mock_ai_and_briefing(client):
    payload = {'raw_notes': 'Found a mineral deposit.', 'planet_name': 'Mars', 'tone': 'scientific', 'length': 'long'}
    result = client.post('/api/generate_narrative', json=payload)
    assert result.status_code == 200
    assert result.json['mode'] == 'mock'
    assert 'mineral deposit' in result.json['narrative']
    assert result.json == client.post('/api/generate_narrative', json=payload).json
    assert client.get('/api/briefing').json['log_count'] == 0
    client.post('/api/logs', json={'title': 'Landing', 'raw_notes': 'Touchdown confirmed'})
    assert 'Touchdown' in client.get('/api/briefing').json['briefing']
    strategy = client.post('/api/strategize', json={'hazards': ['cold', 'radiation', 'vacuum'], 'crew': ['VASCO']}).json
    assert strategy['risk_level'] == 'high'
    assert strategy['crew_picks'] == ['VASCO']


@pytest.mark.parametrize('data', [{}, {'raw_notes': ''}, {'raw_notes': 'x', 'tone': 'invalid'}, {'raw_notes': 'x', 'length': 'invalid'}])
def test_ai_validation(client, data):
    assert client.post('/api/generate_narrative', json=data).status_code == 400


def test_strategy_validation(client):
    assert client.post('/api/strategize', json={'hazards': 'cold'}).status_code == 400


def test_no_key_falls_back_to_mock(app, client):
    app.config['AI_MODE'] = 'live'
    assert client.post('/api/generate_narrative', json={'raw_notes': 'Test'}).json['mode'] == 'mock'


def test_upstream_failure_is_clean_502(app, client, monkeypatch):
    from services.ai.providers import OpenAIProvider
    from validation import ApiError
    def unavailable(*args, **kwargs):
        raise ApiError('AI provider unavailable.', 502, 'ai_provider_error')
    monkeypatch.setattr(OpenAIProvider, '_request', unavailable)
    app.config.update(AI_MODE='live', OPENAI_API_KEY='test-only')
    result = client.post('/api/generate_narrative', json={'raw_notes': 'Test'})
    assert result.status_code == 502
    assert result.json['error']['code'] == 'ai_provider_error'


def test_reset_requires_confirmation(app):
    result = app.test_cli_runner().invoke(args=['reset-db'])
    assert result.exit_code != 0
