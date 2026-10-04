"""Transparent planning estimates, separate from simulation of the running game."""
from collections import defaultdict
from models import db, PlanetProfile
from services.catalogs import catalog
from validation import ApiError, number, string


def validate_modules(values):
    if not isinstance(values, list) or len(values) > 100:
        raise ApiError('modules must be a list of at most 100 entries.')
    known = {m['id']: m for m in catalog('outpost_modules')}
    result = []
    for row in values:
        if not isinstance(row, dict) or set(row) - {'module_id', 'count', 'resource', 'rate_per_minute', 'capacity'}:
            raise ApiError('Invalid module row.')
        identifier = string(row.get('module_id'), 'module_id', 100, True)
        if identifier not in known:
            raise ApiError('Unknown module_id.')
        item = {'module_id': identifier, 'count': number(row.get('count'), 'count', 1, 1000, True)}
        item['resource'] = string(row.get('resource', ''), 'resource')
        for key in ('rate_per_minute', 'capacity'):
            item[key] = None if row.get(key) is None else number(row[key], key, 0, 1000000)
        if item['resource'] and known[identifier]['category'] != 'Extractors':
            raise ApiError('Only extractors can produce a resource.')
        result.append(item)
    return result


def evaluate(modules, planet_id=None, environment=None, stored_mass=0):
    references = {m['id']: m for m in catalog('outpost_modules')}
    planet = db.session.get(PlanetProfile, planet_id) if planet_id else None
    environment = environment or {}
    generation = consumption = storage = 0
    shopping, rates = defaultdict(float), defaultdict(float)
    extracted, warnings, unknown_rates = set(), [], set()
    storage_unknown = False
    for row in modules:
        module = references.get(row['module_id'])
        if module is None:
            warnings.append('A saved module is absent from this reference revision.')
            continue
        count, power = row['count'], module['power']
        if power > 0:
            if 'Solar' in module['name']:
                power *= environment.get('solar_factor', 1)
                warnings.append('Solar output uses your measured factor; default 1 is the reference baseline.')
            if 'Wind' in module['name']:
                vacuum = planet and planet.atmosphere.casefold() in ('none', 'vacuum')
                power *= 0 if vacuum else environment.get('wind_factor', 1)
                warnings.append('Wind is zero in a recorded vacuum; other atmospheres use your measured factor.')
            if module['name'] == 'Fueled Generator' and not environment.get('fuel_available', False):
                power = 0
                warnings.append('Fueled generators need a supplied He-3 source; confirm fuel availability.')
            generation += power * count
        else:
            consumption += -power * count
        for material, quantity in module['cost'].items():
            shopping[material] += quantity * count
        if module['category'] == 'Storage':
            capacity = row.get('capacity', module['capacity'])
            if capacity is None:
                storage_unknown = True
            else:
                storage += capacity * count
        if module['category'] == 'Extractors' and row.get('resource'):
            resource = row['resource']
            present = {r.name.casefold() for r in planet.resources} if planet else set()
            if resource.casefold() not in present:
                warnings.append(f'{resource} is not a recorded deposit on this planet; verify the landing site.')
                continue
            extracted.add(resource)
            rate = row.get('rate_per_minute')
            if rate is None:
                unknown_rates.add(resource)
            else:
                rates[resource] += rate * count
    balance = round(generation - consumption, 3)
    return {'generation': round(generation, 3), 'consumption': consumption, 'net_power': balance,
            'storage_capacity': None if storage_unknown else storage,
            'known_storage_capacity': storage, 'storage_overflow': None if storage_unknown else stored_mass > storage,
            'shopping_list': dict(sorted(shopping.items())), 'extracted_resources': sorted(extracted),
            'rates_per_minute': {name: None if name in unknown_rates else (0 if balance < 0 else rates[name]) for name in extracted},
            'warnings': sorted(set(warnings)), 'method': 'Reference power × quantity × entered environment factor. Extraction is planned, not live telemetry. Underpowered rate is conservatively zero.'}
