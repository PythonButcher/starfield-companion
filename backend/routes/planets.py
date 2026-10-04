from flask import Blueprint, jsonify, request
from sqlalchemy import func
from models import db, PlanetProfile, Resource
from validation import ApiError, body, boolean, number, page, record, string, strings, text_filter

bp = Blueprint('planets', __name__, url_prefix='/api')
FIELDS = {'name', 'system_name', 'type', 'gravity', 'temperature', 'atmosphere', 'magnetosphere', 'water', 'biomes', 'planetary_traits', 'resources', 'flora', 'fauna', 'hazards', 'user_notes', 'surveyed_percent', 'favorite', 'outpost_candidate', 'approximate'}


def resource_values(values):
    if not isinstance(values, list) or len(values) > 50:
        raise ApiError('resources must be a list of at most 50 names or resource objects.')
    result = []
    seen = set()
    for value in values:
        item = {'name': value} if isinstance(value, str) else value
        if not isinstance(item, dict) or set(item) - {'name', 'symbol', 'type', 'rarity'}:
            raise ApiError('A resource needs a name and optional symbol, type, rarity.')
        name = string(item.get('name'), 'resource name', 100, True)
        data = {'name': name, 'symbol': string(item.get('symbol', ''), 'symbol', 30),
                'type': string(item.get('type', 'inorganic'), 'resource type', 20),
                'rarity': string(item.get('rarity', 'unknown'), 'rarity', 30)}
        if data['type'] not in ('inorganic', 'organic'):
            raise ApiError('resource type must be inorganic or organic.')
        if name.casefold() not in seen:
            result.append(data)
            seen.add(name.casefold())
    return result


def resolve_resources(values):
    result = []
    for data in values:
        resource = db.session.scalar(db.select(Resource).where(func.lower(Resource.name) == data['name'].lower()))
        if resource is None:
            resource = Resource(**data)
            db.session.add(resource)
            db.session.flush()
        result.append(resource)
    return result


def validate_planet(data, creating=False):
    if creating and 'name' not in data:
        raise ApiError('name is required.')
    result = {}
    for key, value in data.items():
        if key in ('biomes', 'planetary_traits', 'hazards'):
            result[key] = strings(value, key)
        elif key == 'resources':
            result[key] = resource_values(value)
        elif key in ('favorite', 'outpost_candidate', 'approximate'):
            result[key] = boolean(value, key)
        elif key in ('gravity', 'flora', 'fauna'):
            result[key] = None if value is None else number(value, key, 0, 100 if key == 'gravity' else 10000, key != 'gravity')
        elif key == 'surveyed_percent':
            result[key] = number(value, key, 0, 100, True)
        else:
            maximum = 30000 if key == 'user_notes' else 50 if key == 'type' else 100
            result[key] = string(value, key, maximum, key == 'name')
    return result


def apply_planet(item, values):
    for key, value in values.items():
        setattr(item, key, resolve_resources(value) if key == 'resources' else value)


@bp.get('/planets')
def list_planets():
    items = text_filter([item.to_dict() for item in db.session.scalars(db.select(PlanetProfile).order_by(PlanetProfile.name, PlanetProfile.id))], ('name', 'system_name', 'user_notes'))
    for key in ('resource', 'hazard', 'system'):
        value = request.args.get(key, '').casefold().strip()
        if not value:
            continue
        if key == 'resource':
            items = [item for item in items if any(value in (res['name'].casefold(), res['symbol'].casefold()) for res in item['resources'])]
        elif key == 'hazard':
            items = [item for item in items if any(value in hazard.casefold() for hazard in item['hazards'])]
        else:
            items = [item for item in items if value == item['system_name'].casefold()]
    limits = {}
    for key in ('min_gravity', 'max_gravity'):
        if key in request.args and request.args[key] != '':
            try:
                limits[key] = number(float(request.args[key]), key, 0, 100)
            except ValueError as exc:
                raise ApiError(f'{key} must be a number.') from exc
    if limits.get('min_gravity', 0) > limits.get('max_gravity', 100):
        raise ApiError('min_gravity must not exceed max_gravity.')
    if limits:
        items = [item for item in items if item['gravity'] is not None and limits.get('min_gravity', 0) <= item['gravity'] <= limits.get('max_gravity', 100)]
    return page(items)


@bp.post('/planets')
def create_planet():
    values = validate_planet(body(FIELDS), True)
    item = PlanetProfile()
    apply_planet(item, values)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.get('/planets/<int:identifier>')
def get_planet(identifier):
    return jsonify(record(PlanetProfile, identifier).to_dict())


@bp.route('/planets/<int:identifier>', methods=['PUT', 'PATCH'])
def update_planet(identifier):
    item = record(PlanetProfile, identifier)
    apply_planet(item, validate_planet(body(FIELDS)))
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete('/planets/<int:identifier>')
def delete_planet(identifier):
    db.session.delete(record(PlanetProfile, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)


@bp.get('/resources')
def list_resources():
    return page(text_filter([item.to_dict() for item in db.session.scalars(db.select(Resource).order_by(Resource.name))], ('name', 'symbol')))


@bp.post('/resourcehunt')
def resource_hunt():
    data = body({'resources'})
    targets = strings(data.get('resources'), 'resources')
    if not targets:
        raise ApiError('Choose at least one resource.')
    targets = list(dict.fromkeys(target.casefold() for target in targets))
    results = []
    for item in db.session.scalars(db.select(PlanetProfile)):
        present = {value.casefold() for resource in item.resources for value in (resource.name, resource.symbol) if value}
        matched = [target for target in targets if target in present]
        if matched:
            planet = item.to_dict()
            results.append({'planet': planet, 'matched_resources': matched, 'match_count': len(matched),
                            'hazard_count': len(item.hazards), 'all_targets': len(matched) == len(targets)})
    results.sort(key=lambda row: (-row['match_count'], row['hazard_count'], row['planet']['name'].casefold(), row['planet']['id']))
    return jsonify(results=results, resources=targets, method='Most requested resources, then fewest recorded hazards, then name. Unknown hazards are not inferred.')
