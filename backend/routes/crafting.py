from flask import Blueprint, jsonify
from services.crafting import resolve
from validation import ApiError, body, string, number

bp = Blueprint('crafting', __name__, url_prefix='/api/crafting')


@bp.post('/resolve')
def resolve_recipe():
    data = body({'target', 'quantity', 'inventory'})
    target = string(data.get('target'), 'target', 100, True)
    quantity = number(data.get('quantity', 1), 'quantity', 1, 10000, True)
    inventory = data.get('inventory', {})
    if not isinstance(inventory, dict) or len(inventory) > 200:
        raise ApiError('inventory must map up to 200 material names to counts.')
    cleaned = {}
    for name, count in inventory.items():
        name = string(name, 'inventory name', 100, True)
        if name.casefold() in {key.casefold() for key in cleaned}:
            raise ApiError('Inventory names must be unique ignoring case.')
        cleaned[name] = number(count, name, 0, 100000000, True)
    return jsonify(resolve(target, quantity, cleaned))
