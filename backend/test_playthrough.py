"""Exercise the app-to-extractor boundary with artificial saves and isolated DBs."""

import hashlib
import os
import time

from models import db, ExpeditionLog, Ship, PlanetProfile, OutpostPlan
from test_save_reader import _container, _raw, _save


def test_playthrough_not_configured_and_no_cache(client):
    response = client.get('/api/playthrough')
    assert response.status_code == 200
    assert response.json['status'] == 'not_configured'
    assert response.json['snapshot'] is None
    assert response.json['error'] is None
    assert response.headers['Cache-Control'] == 'no-store'
    assert response.json['checked_at'].endswith('Z')


def test_real_extractor_boundary_manual_refresh_and_preservation(app, client, tmp_path):
    path = _save(tmp_path)
    before = hashlib.sha256(path.read_bytes()).hexdigest(), path.stat().st_mtime_ns
    app.config['SAVE_COPY_FOLDER'] = str(tmp_path)
    with app.app_context():
        models = (ExpeditionLog, Ship, PlanetProfile, OutpostPlan)
        counts = [db.session.query(model).count() for model in models]
    first = client.get('/api/playthrough').json
    assert first['status'] == 'ready'
    assert first['snapshot']['player']['level'] == 74
    assert first['snapshot']['source']['filename'] == path.name
    assert first['snapshot']['coverage']['gameplay'] == 'undecoded'
    later = _save(tmp_path, _container(_raw(name='Later Explorer')), name='later.sfs')
    os.utime(later, (time.time() - 3, time.time() - 3))
    second = client.get('/api/playthrough').json
    assert second['status'] == 'ready'
    assert second['snapshot']['player']['name'] == 'Later Explorer'
    assert second['snapshot']['source']['filename'] == 'later.sfs'
    assert (hashlib.sha256(path.read_bytes()).hexdigest(), path.stat().st_mtime_ns) == before
    with app.app_context():
        assert counts == [db.session.query(model).count() for model in models]


def test_refresh_failure_keeps_last_success_and_recovers(app, client, tmp_path):
    _save(tmp_path)
    app.config['SAVE_COPY_FOLDER'] = str(tmp_path)
    good = client.get('/api/playthrough').json['snapshot']
    newest = _save(tmp_path, b'broken', name='broken.sfs')
    os.utime(newest, (time.time() - 3, time.time() - 3))
    failed = client.get('/api/playthrough').json
    assert failed['status'] == 'stale'
    assert failed['snapshot'] == good
    assert failed['error']['code'] == 'truncated_save'
    newest.write_bytes(_container(_raw(name='Recovered')))
    os.utime(newest, (time.time() - 3, time.time() - 3))
    recovered = client.get('/api/playthrough').json
    assert recovered['status'] == 'ready'
    assert recovered['error'] is None
    assert recovered['snapshot']['player']['name'] == 'Recovered'


def test_empty_missing_and_changed_folder_never_show_another_folders_data(app, client, tmp_path):
    app.config['SAVE_COPY_FOLDER'] = str(tmp_path)
    assert client.get('/api/playthrough').json['error']['code'] == 'no_saves'
    _save(tmp_path)
    assert client.get('/api/playthrough').json['status'] == 'ready'
    app.config['SAVE_COPY_FOLDER'] = str(tmp_path / 'missing')
    missing = client.get('/api/playthrough').json
    assert missing['status'] == 'unavailable'
    assert missing['snapshot'] is None
    assert missing['error']['code'] == 'folder_unavailable'
    app.config['SAVE_COPY_FOLDER'] = ''
    assert client.get('/api/playthrough').json['status'] == 'not_configured'


def test_browser_cannot_choose_local_paths_or_write_records(app, client, tmp_path):
    _save(tmp_path)
    app.config['SAVE_COPY_FOLDER'] = str(tmp_path)
    response = client.get('/api/playthrough?folder=C:/unrelated&file=C:/unrelated.sfs')
    assert response.json['status'] == 'ready'
    assert response.json['snapshot']['source']['filename'] == 'copied.sfs'
    assert client.post('/api/playthrough', json={'folder': 'C:/unrelated'}).status_code == 405
