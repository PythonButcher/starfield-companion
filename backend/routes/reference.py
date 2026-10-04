from flask import Blueprint, jsonify
from models import db, ReferenceRecord
from validation import page, text_filter

bp = Blueprint('reference', __name__, url_prefix='/api')


@bp.get('/health')
def health():
    return jsonify(status='systems_nominal')


def catalog(name, fields):
    items = [item.payload for item in db.session.scalars(db.select(ReferenceRecord).where(ReferenceRecord.catalog == name).order_by(ReferenceRecord.id))]
    return page(text_filter(items, fields))


@bp.get('/systems')
def systems():
    return catalog('systems', ('name', 'faction'))


@bp.get('/research')
def research():
    return catalog('research', ('research Project', 'required Materials'))
