from flask import Blueprint, jsonify

from models import db, SupplyNetwork, iso
from services.supply_networks import FIELDS, evaluate, validate
from validation import body, page, record, text_filter

bp = Blueprint('supply_networks', __name__, url_prefix='/api/supply-networks')


def serialize(item):
    return {'id': item.id, 'name': item.name, 'notes': item.notes, 'nodes': item.nodes, 'links': item.links,
            'created_at': iso(item.created_at), 'updated_at': iso(item.updated_at),
            'analysis': evaluate(item.nodes, item.links)}


@bp.post('/analyze')
def analyze():
    values = validate(body(FIELDS))
    return jsonify(evaluate(values.get('nodes', []), values.get('links', [])))


@bp.get('')
def listing():
    return page(text_filter([serialize(item) for item in db.session.scalars(db.select(SupplyNetwork).order_by(SupplyNetwork.id.desc()))], ('name', 'notes')))


@bp.post('')
def create():
    item = SupplyNetwork(**validate(body(FIELDS), True))
    db.session.add(item)
    db.session.commit()
    return jsonify(serialize(item)), 201


@bp.get('/<int:identifier>')
def get(identifier):
    return jsonify(serialize(record(SupplyNetwork, identifier)))


@bp.patch('/<int:identifier>')
def update(identifier):
    item = record(SupplyNetwork, identifier)
    for key, value in validate(body(FIELDS)).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(serialize(item))


@bp.delete('/<int:identifier>')
def delete(identifier):
    db.session.delete(record(SupplyNetwork, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)
