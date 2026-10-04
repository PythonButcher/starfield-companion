from io import BytesIO
from pathlib import Path
from PIL import Image


def picture():
    stream = BytesIO()
    Image.new('RGB', (8, 8), 'blue').save(stream, format='PNG')
    stream.seek(0)
    return stream


def test_media_lifecycle_and_detachment(client, app):
    log = client.post('/api/logs', json={'title': 'Photo log'}).json
    planet = client.get('/api/planets').json[0]
    result = client.post('/api/media', data={'file': (picture(), '../../photo.png'),
        'log_id': str(log['id']), 'planet_id': str(planet['id']), 'tags': '["Landing"]'})
    assert result.status_code == 201
    item = result.json
    assert '..' not in item['filename']
    assert client.get(item['url']).mimetype == 'image/png'
    assert len(client.get('/api/media?tag=landing&log_id=' + str(log['id'])).json) == 1
    assert client.patch('/api/media/' + str(item['id']), json={'caption': 'Arrival'}).json['caption'] == 'Arrival'
    client.delete('/api/logs/' + str(log['id']))
    assert client.get('/api/media/' + str(item['id'])).json['log_id'] is None
    assert client.delete('/api/media/' + str(item['id'])).status_code == 200
    assert not (Path(app.config['UPLOAD_FOLDER']) / item['filename']).exists()
    assert client.get(item['url']).status_code == 404


def test_media_rejects_spoof_missing_links_and_large_files(client, app):
    assert client.post('/api/media', data={'file': (BytesIO(b'<script>bad</script>'), 'a.png')}).status_code == 400
    assert client.post('/api/media', data={'file': (picture(), 'a.png'), 'planet_id': '9999'}).status_code == 400
    assert client.post('/api/media', data={'file': (picture(), 'a.png'), 'tags': '{}'}).status_code == 400
    app.config['MAX_FILE_SIZE'] = 4
    assert client.post('/api/media', data={'file': (picture(), 'a.png')}).status_code == 413
    assert not list(Path(app.config['UPLOAD_FOLDER']).iterdir())
    assert client.get('/media/../../config.py').status_code == 404


def test_mp4_container_validation(client):
    def box(kind, content):
        return (8 + len(content)).to_bytes(4, 'big') + kind + content
    raw = box(b'ftyp', b'isom0000') + box(b'moov', b'0000') + box(b'mdat', b'0000')
    result = client.post('/api/media', data={'file': (BytesIO(raw), 'clip.mp4')})
    assert result.status_code == 201
    assert result.json['mime_type'] == 'video/mp4'
    assert client.post('/api/media', data={'file': (BytesIO(raw[:-2]), 'clip.mp4')}).status_code == 400
