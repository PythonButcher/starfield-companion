from flask import Blueprint, jsonify, request
from models import db, PlayerObjective, PlanetProfile, ExpeditionLog, utcnow
from validation import ApiError, body, string, foreign_key, boolean, page, record, text_filter

bp = Blueprint('missions', __name__, url_prefix='/api/missions')
ENUMS = {'faction': ('Constellation', 'UC Vanguard', 'Freestar', 'Ryujin', 'Crimson Fleet', 'Independent'),
         'category': ('Main', 'Faction', 'Survey', 'Outpost', 'Personal'),
         'status': ('Active', 'Completed', 'Paused'), 'priority': ('High', 'Medium', 'Low')}
FIELDS = {'title', 'target_planet_id', 'target_system', 'notes', 'checklist', 'linked_log_ids', *ENUMS}


def validate(data, creating=False):
    if creating and 'title' not in data:
        raise ApiError('title is required.')
    values = {}
    for key, value in data.items():
        if key in ENUMS:
            if value not in ENUMS[key]:
                raise ApiError(f'Invalid {key}.')
            values[key] = value
        elif key == 'target_planet_id':
            values[key] = foreign_key(value, key, PlanetProfile)
        elif key == 'checklist':
            if not isinstance(value, list) or len(value) > 100:
                raise ApiError('checklist must contain at most 100 steps.')
            checked = []
            for step in value:
                if not isinstance(step, dict) or set(step) != {'id', 'text', 'done'}:
                    raise ApiError('Checklist steps require id, text and done.')
                checked.append({'id': string(step['id'], 'step id', 100, True),
                                'text': string(step['text'], 'step text', 500, True),
                                'done': boolean(step['done'], 'done')})
            if len({s['id'] for s in checked}) != len(checked):
                raise ApiError('Checklist IDs must be unique.')
            values[key] = checked
        elif key == 'linked_log_ids':
            if not isinstance(value, list) or len(value) > 100 or None in value:
                raise ApiError('linked_log_ids must contain at most 100 log IDs.')
            values[key] = list(dict.fromkeys(foreign_key(v, 'log ID', ExpeditionLog) for v in value))
        else:
            values[key] = string(value, key, 30000 if key == 'notes' else 100, key == 'title')
    return values


def apply(item, values):
    for key, value in values.items():
        setattr(item, key, value)
    if 'status' in values:
        item.completed_at = (item.completed_at or utcnow()) if values['status'] == 'Completed' else None


@bp.get('')
def listing():
    statement = db.select(PlayerObjective).order_by(PlayerObjective.created_at.desc(), PlayerObjective.id.desc())
    for key in ('faction', 'status'):
        if request.args.get(key):
            if request.args[key] not in ENUMS[key]:
                raise ApiError(f'Invalid {key} filter.')
            statement = statement.where(getattr(PlayerObjective, key) == request.args[key])
    if request.args.get('planet_id'):
        try:
            identifier = int(request.args['planet_id'])
        except ValueError as exc:
            raise ApiError('planet_id must be an integer.') from exc
        statement = statement.where(PlayerObjective.target_planet_id == identifier)
    return page(text_filter([o.to_dict() for o in db.session.scalars(statement)], ('title', 'notes', 'target_system')))


@bp.post('')
def create():
    item = PlayerObjective()
    apply(item, validate(body(FIELDS), True))
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.get('/<int:identifier>')
def get(identifier):
    return jsonify(record(PlayerObjective, identifier).to_dict())


@bp.patch('/<int:identifier>')
def update(identifier):
    item = record(PlayerObjective, identifier)
    apply(item, validate(body(FIELDS)))
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete('/<int:identifier>')
def delete(identifier):
    db.session.delete(record(PlayerObjective, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)
