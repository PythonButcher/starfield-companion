"""Local media storage. Only validated raster images and video containers are served."""
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import warnings

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from PIL import Image, UnidentifiedImageError

from models import db, MediaItem, PlanetProfile, ExpeditionLog
from validation import ApiError, body, foreign_key, page, record, string, strings, text_filter

bp = Blueprint('media', __name__)
FIELDS = {'caption', 'tags', 'planet_id', 'log_id'}


def metadata(data):
    values = {}
    for key, value in data.items():
        if key == 'caption':
            values[key] = string(value, key, 5000)
        elif key == 'tags':
            values[key] = strings(value, key)
        else:
            values[key] = foreign_key(value, key, PlanetProfile if key == 'planet_id' else ExpeditionLog)
    return values


def media_type(raw):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(raw)) as image:
                kind = image.format
                image.verify()
            if kind in ('JPEG', 'PNG', 'WEBP', 'GIF'):
                return {'JPEG': ('jpg', 'image/jpeg'), 'PNG': ('png', 'image/png'),
                        'WEBP': ('webp', 'image/webp'), 'GIF': ('gif', 'image/gif')}[kind]
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        pass
    # Validate MP4 box boundaries and require a recognized brand plus media and metadata.
    # Playback codecs remain browser-dependent; this is a container check, not transcoding.
    offset, boxes = 0, []
    while offset + 8 <= len(raw):
        size = int.from_bytes(raw[offset:offset + 4], 'big')
        kind = raw[offset + 4:offset + 8]
        if size < 8 or offset + size > len(raw):
            break
        boxes.append(kind)
        offset += size
    if (offset == len(raw) and raw[4:8] == b'ftyp' and
            raw[8:12] in (b'isom', b'iso2', b'mp41', b'mp42', b'avc1', b'M4V ') and
            b'mdat' in boxes and b'moov' in boxes):
        return 'mp4', 'video/mp4'
    raise ApiError('Upload a valid JPEG, PNG, WebP, GIF or MP4 file.')


@bp.post('/api/media')
def upload():
    if set(request.form) - FIELDS or set(request.files) != {'file'}:
        raise ApiError('Supply one file and optional caption, tags, planet_id and log_id.')
    import json
    data = dict(request.form)
    try:
        if 'tags' in data:
            data['tags'] = json.loads(data['tags'])
        for key in ('planet_id', 'log_id'):
            if key in data:
                data[key] = int(data[key]) if data[key] else None
    except (ValueError, TypeError) as exc:
        raise ApiError('Invalid attachment metadata.') from exc
    values = metadata(data)
    file = request.files['file']
    raw = file.read(current_app.config['MAX_FILE_SIZE'] + 1)
    if len(raw) > current_app.config['MAX_FILE_SIZE']:
        raise ApiError('Files must be 10 MB or smaller.', 413, 'file_too_large')
    extension, mime = media_type(raw)
    filename = f'{uuid4().hex}.{extension}'
    target = Path(current_app.config['UPLOAD_FOLDER']) / filename
    item = MediaItem(filename=filename, original_name=string(file.filename or 'upload', 'filename', 200),
                     mime_type=mime, size=len(raw), **values)
    try:
        target.write_bytes(raw)
        db.session.add(item)
        db.session.commit()
    except Exception:
        db.session.rollback()
        target.unlink(missing_ok=True)
        raise
    return jsonify(item.to_dict()), 201


@bp.get('/api/media')
def listing():
    statement = db.select(MediaItem).order_by(MediaItem.created_at.desc(), MediaItem.id.desc())
    for key in ('planet_id', 'log_id'):
        if request.args.get(key):
            try:
                identifier = int(request.args[key])
            except ValueError as exc:
                raise ApiError(f'{key} must be an integer.') from exc
            statement = statement.where(getattr(MediaItem, key) == identifier)
    return page(text_filter([item.to_dict() for item in db.session.scalars(statement)],
                            ('caption', 'original_name')))


@bp.get('/api/media/<int:identifier>')
def get(identifier):
    return jsonify(record(MediaItem, identifier).to_dict())


@bp.patch('/api/media/<int:identifier>')
def update(identifier):
    item = record(MediaItem, identifier)
    for key, value in metadata(body(FIELDS)).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete('/api/media/<int:identifier>')
def delete(identifier):
    item = record(MediaItem, identifier)
    target = Path(current_app.config['UPLOAD_FOLDER']) / item.filename
    # Failed unlink leaves the metadata available for retry.
    target.unlink(missing_ok=True)
    db.session.delete(item)
    db.session.commit()
    return jsonify(deleted=identifier)


@bp.get('/media/<filename>')
def serve(filename):
    item = db.session.scalar(db.select(MediaItem).where(MediaItem.filename == filename))
    if not item:
        raise ApiError('Media not found.', 404, 'not_found')
    response = send_from_directory(current_app.config['UPLOAD_FOLDER'], item.filename,
                                   mimetype=item.mime_type, conditional=True)
    response.headers['Content-Security-Policy'] = "default-src 'none'; media-src 'self'; img-src 'self'"
    return response
