from flask import Blueprint, jsonify
from models import db, Ship, StarterState, CrewMember
from services.starter import clear_starter
from validation import ApiError, body

bp = Blueprint('starter', __name__, url_prefix='/api')


@bp.get('/ships')
def ships():
    crew = list(db.session.scalars(db.select(CrewMember).order_by(CrewMember.name)))
    return jsonify([{**ship.to_dict(), 'crew': [c.to_dict() for c in crew if c.assigned_ship.casefold() == ship.name.casefold()]}
                    for ship in db.session.scalars(db.select(Ship).order_by(Ship.id))])


@bp.get('/starter')
def status():
    state = db.session.get(StarterState, 1)
    return jsonify(status=state.status if state else 'disabled')


@bp.post('/starter/clear')
def clear():
    if body({'confirm'}).get('confirm') != 'CLEAR STARTER':
        raise ApiError('Type CLEAR STARTER to remove unchanged starter records.')
    return jsonify(clear_starter())
