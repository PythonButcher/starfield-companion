from flask import Blueprint, jsonify
from models import db, OutpostPlan, PlanetProfile, iso
from services.outposts import validate_modules, evaluate
from validation import ApiError, body, string, number, boolean, foreign_key, record, page, text_filter

bp = Blueprint('outposts', __name__, url_prefix='/api/outposts')
FIELDS = {'name', 'planet_id', 'planet_name', 'modules', 'notes', 'environment', 'stored_mass'}


def validate(data, creating=False):
    values = {}
    if creating and 'name' not in data:
        raise ApiError('name is required.')
    for key, value in data.items():
        if key == 'modules':
            values[key] = validate_modules(value)
        elif key == 'planet_id':
            values[key] = foreign_key(value, key, PlanetProfile)
        elif key == 'stored_mass':
            values[key] = number(value, key, 0, 100000000)
        elif key == 'environment':
            if not isinstance(value, dict) or set(value) - {'solar_factor', 'wind_factor', 'fuel_available'}:
                raise ApiError('Invalid environment assumptions.')
            values[key] = {k: boolean(v, k) if k == 'fuel_available' else number(v, k, 0, 10) for k, v in value.items()}
        else:
            values[key] = string(value, key, 30000 if key == 'notes' else 100, key == 'name')
    return values


def serialize(item):
    data = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    data.update(created_at=iso(item.created_at), updated_at=iso(item.updated_at),
                analysis=evaluate(item.modules, item.planet_id, item.environment, item.stored_mass))
    return data


@bp.post('/plan')
def plan():
    values = validate(body(FIELDS))
    return jsonify(evaluate(values.get('modules', []), values.get('planet_id'),
                            values.get('environment'), values.get('stored_mass', 0)))


@bp.get('')
def listing():
    return page(text_filter([serialize(o) for o in db.session.scalars(db.select(OutpostPlan).order_by(OutpostPlan.id))], ('name', 'planet_name')))


@bp.post('')
def create():
    values = validate(body(FIELDS), True)
    if values.get('planet_id'):
        values['planet_name'] = record(PlanetProfile, values['planet_id']).name
    item = OutpostPlan(**values)
    db.session.add(item)
    db.session.commit()
    return jsonify(serialize(item)), 201


@bp.get('/<int:identifier>')
def get(identifier):
    return jsonify(serialize(record(OutpostPlan, identifier)))


@bp.patch('/<int:identifier>')
def update(identifier):
    item = record(OutpostPlan, identifier)
    values = validate(body(FIELDS))
    if values.get('planet_id'):
        values['planet_name'] = record(PlanetProfile, values['planet_id']).name
    for key, value in values.items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(serialize(item))


@bp.delete('/<int:identifier>')
def delete(identifier):
    db.session.delete(record(OutpostPlan, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)
