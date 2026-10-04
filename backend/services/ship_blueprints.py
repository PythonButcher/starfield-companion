"""Snapshot loadouts and explainable, unskilled ship planning estimates."""
import json
import math
from functools import lru_cache
from pathlib import Path

from services.supply_networks import bounded_list, object_fields
from validation import ApiError, number, string

FIELDS = {'name', 'notes', 'modules', 'crew_limit', 'jump_bonus'}
CATEGORIES = ('Reactor', 'Engine', 'Grav drive', 'Hab', 'Shield', 'Cockpit', 'Cargo',
              'Fuel tank', 'Landing gear', 'Landing bay', 'Docker', 'Structural', 'Weapon')
STAT_FIELDS = ('mass', 'hull', 'power', 'crew_capacity', 'crew_stations', 'shield',
               'maneuvering_thrust', 'grav_thrust', 'top_speed', 'cargo', 'fuel')


@lru_cache(maxsize=1)
def catalog():
    return json.loads((Path(__file__).resolve().parents[1] / 'data/reference/ship_modules.json').read_text(encoding='utf-8'))


def validate(data, creating=False):
    values = {}
    if creating or 'name' in data:
        values['name'] = string(data.get('name'), 'name', 100, True)
    if 'notes' in data:
        values['notes'] = string(data['notes'], 'notes', 30000)
    if 'crew_limit' in data:
        values['crew_limit'] = number(data['crew_limit'], 'crew limit', 0, 100, True)
    if 'jump_bonus' in data:
        values['jump_bonus'] = number(data['jump_bonus'], 'jump bonus', 0, 100)
    if 'modules' in data:
        modules = []
        for row in bounded_list(data['modules'], 100, 'modules'):
            object_fields(row, {'name', 'catalog_id', 'category', 'ship_class', 'count', 'stats'}, 'module')
            category = row.get('category')
            if category not in CATEGORIES or row.get('ship_class', '') not in ('', 'A', 'B', 'C'):
                raise ApiError('Choose a supported module category and class.')
            stats = object_fields(row.get('stats', {}), set(STAT_FIELDS), 'module stats')
            # Missing entries are unknown, never silently zero. Non-applicable fields
            # should be sent as zero by the catalog/custom-module editor.
            modules.append({'name': string(row.get('name'), 'module name', 120, True), 'category': category,
                            'ship_class': row.get('ship_class', ''), 'catalog_id': string(row.get('catalog_id', ''), 'catalog id', 64),
                            'count': number(row.get('count', 1), 'module count', 1, 100, True),
                            'stats': {key: None if stats.get(key) is None else number(stats[key], key, 0, 1000000)
                                      for key in STAT_FIELDS}})
        values['modules'] = modules
    return values


def evaluate(modules, crew_limit=3, jump_bonus=0):
    def total(stat, category=None):
        relevant = [row for row in modules if category is None or row['category'] == category]
        if any(row['stats'].get(stat) is None for row in relevant):
            return None
        return round(sum(row['stats'][stat] * row['count'] for row in relevant), 4)

    def count(category):
        return sum(row['count'] for row in modules if row['category'] == category)

    mass, thrust = total('mass'), total('maneuvering_thrust', 'Engine')
    grav_thrust = total('grav_thrust', 'Grav drive')
    capacity, stations = total('crew_capacity'), total('crew_stations')
    engines = [row for row in modules if row['category'] == 'Engine']
    speed = (None if any(row['stats']['top_speed'] is None for row in engines)
             else min((row['stats']['top_speed'] for row in engines), default=0))
    mobility = (None if mass is None or thrust is None else
                max(0, min(100, math.floor(11.9 * thrust / mass - 47.6 + 0.5))) if mass > 0 else 0)
    jump = (None if mass is None or grav_thrust is None else
            round(min(30, (682.911 * grav_thrust ** 3 / mass) ** (1 / 3) * (1 + jump_bonus / 100)), 2)
            if mass > 0 and count('Grav drive') == 1 else 0)
    stats = {'mass': mass, 'hull': total('hull'), 'shield': total('shield', 'Shield'),
             'mobility': mobility, 'top_speed': speed, 'jump_range': jump,
             'crew_capacity': None if capacity is None or stations is None else math.floor(min(capacity, stations, crew_limit)),
             'crew_rating': capacity, 'crew_stations': stations, 'cargo': total('cargo'), 'fuel': total('fuel'),
             'reactor_power': total('power', 'Reactor'), 'engine_power': total('power', 'Engine')}
    warnings = []
    for category in ('Reactor', 'Grav drive', 'Cockpit', 'Landing bay', 'Docker'):
        if count(category) != 1:
            warnings.append(f'Install exactly one {category.lower()} (currently {count(category)}).')
    if not count('Engine'):
        warnings.append('Add engines before flight planning.')
    if not count('Landing gear'):
        warnings.append('Add landing gear; landing thrust and attachment geometry must be checked in game.')
    if count('Shield') > 1:
        warnings.append('Only one shield generator is supported; the displayed shield total includes all planned modules.')
    if count('Grav drive') > 1:
        stats['jump_range'] = None
    if stats['engine_power'] is not None and stats['engine_power'] > 12:
        warnings.append('Engine demand exceeds the 12-power engine allocation limit.')
    reactors = [row for row in modules if row['category'] == 'Reactor']
    reactor_class = reactors[0]['ship_class'] if len(reactors) == 1 and count('Reactor') == 1 else ''
    incompatible = [row['name'] for row in modules if row['ship_class'] and reactor_class and row['ship_class'] > reactor_class]
    if incompatible:
        warnings.append('Modules exceed reactor class: ' + ', '.join(incompatible))
    if reactor_class in ('B', 'C'):
        warnings.append(f'Class {reactor_class} requires Piloting rank {3 if reactor_class == "B" else 4}.')
    if any(value is None for value in stats.values()):
        warnings.append('Some module measurements are unknown. Complete their stats to resolve the affected totals.')
    if stats['jump_range'] is not None and stats['jump_range'] < 15 and modules:
        warnings.append('Estimated jump range is below 15 LY; reduce mass or upgrade the grav drive.')
    return {'stats': stats, 'reactor_class': reactor_class or 'Unspecified', 'warnings': warnings,
            'module_count': sum(row['count'] for row in modules),
            'method': 'Base module totals. Mobility = clamp(round(11.9 × maneuvering thrust / mass − 47.6), 0, 100). '
                      'Jump estimate = min(30, (682.911 × grav thrust³ / mass)⅓ × bonus). '
                      'Crew = floor(min(module crew rating, stations, entered command limit)). '
                      'Top speed uses the slowest engine at full power. No crew, skill, damage or optimization bonuses '
                      'except the entered jump bonus. Placement, landing thrust, weapons and flight legality require in-game checks.'}
