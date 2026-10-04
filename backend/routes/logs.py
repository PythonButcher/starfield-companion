from flask import Blueprint, jsonify
from models import db, ExpeditionLog, PlanetProfile
from validation import ApiError, body, foreign_key, page, record, string, strings, text_filter

bp = Blueprint('logs', __name__, url_prefix='/api/logs')
FIELDS = {'title', 'planet_name', 'system_name', 'location', 'mood', 'log_type', 'raw_notes', 'ai_narrative', 'tags', 'planet_id'}


def validate_log(data, creating=False):
    result = {}
    if creating and 'title' not in data:
        raise ApiError('title is required.')
    for key, value in data.items():
        if key == 'tags':
            result[key] = strings(value, key)
        elif key == 'planet_id':
            result[key] = foreign_key(value, key, PlanetProfile)
        else:
            maximum = 30000 if key in ('raw_notes', 'ai_narrative') else 200 if key == 'location' else 100
            result[key] = string(value, key, maximum, key == 'title')
    if 'log_type' in result and result['log_type'] not in ('Exploration', 'Combat', 'Trade', 'Faction', 'Personal'):
        raise ApiError('Unknown log_type.')
    return result


@bp.get('')
def list_logs():
    items = [item.to_dict() for item in db.session.scalars(db.select(ExpeditionLog).order_by(ExpeditionLog.date.desc(), ExpeditionLog.id.desc()))]
    return page(text_filter(items, ('title', 'raw_notes', 'ai_narrative', 'planet_name', 'system_name')))


@bp.post('')
def create_log():
    item = ExpeditionLog(**validate_log(body(FIELDS), True))
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.get('/<int:identifier>')
def get_log(identifier):
    return jsonify(record(ExpeditionLog, identifier).to_dict())


@bp.route('/<int:identifier>', methods=['PATCH', 'PUT'])
def update_log(identifier):
    item = record(ExpeditionLog, identifier)
    for key, value in validate_log(body(FIELDS)).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete('/<int:identifier>')
def delete_log(identifier):
    db.session.delete(record(ExpeditionLog, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)
