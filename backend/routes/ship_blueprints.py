from flask import Blueprint, jsonify

from models import db, ShipBlueprint, iso
from services.ship_blueprints import CATEGORIES, FIELDS, STAT_FIELDS, catalog, evaluate, validate
from validation import body, page, record, text_filter

bp = Blueprint('ship_blueprints', __name__, url_prefix='/api/ship-blueprints')


def serialize(item):
    return {'id': item.id, 'name': item.name, 'notes': item.notes, 'modules': item.modules,
            'crew_limit': item.crew_limit, 'jump_bonus': item.jump_bonus,
            'created_at': iso(item.created_at), 'updated_at': iso(item.updated_at),
            'analysis': evaluate(item.modules, item.crew_limit, item.jump_bonus)}


@bp.get('/catalog')
def module_catalog():
    return jsonify(modules=catalog(), categories=CATEGORIES, stat_fields=STAT_FIELDS)


@bp.post('/analyze')
def analyze():
    values = validate(body(FIELDS))
    return jsonify(evaluate(values.get('modules', []), values.get('crew_limit', 3), values.get('jump_bonus', 0)))


@bp.get('')
def listing():
    return page(text_filter([serialize(item) for item in db.session.scalars(db.select(ShipBlueprint).order_by(ShipBlueprint.id.desc()))], ('name', 'notes')))


@bp.post('')
def create():
    item = ShipBlueprint(**validate(body(FIELDS), True))
    db.session.add(item)
    db.session.commit()
    return jsonify(serialize(item)), 201


@bp.get('/<int:identifier>')
def get(identifier):
    return jsonify(serialize(record(ShipBlueprint, identifier)))


@bp.patch('/<int:identifier>')
def update(identifier):
    item = record(ShipBlueprint, identifier)
    for key, value in validate(body(FIELDS)).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(serialize(item))


@bp.delete('/<int:identifier>')
def delete(identifier):
    db.session.delete(record(ShipBlueprint, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)
