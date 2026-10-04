"""Conservative rate-budget planning; no game timers or extraction rates are invented."""
from collections import Counter

from models import db, OutpostPlan, PlanetProfile, Resource
from services.outposts import evaluate as evaluate_outpost
from validation import ApiError, boolean, number, string

FIELDS = {'name', 'notes', 'nodes', 'links'}


def object_fields(value, fields, label):
    if not isinstance(value, dict) or set(value) - fields:
        raise ApiError(f'Invalid {label} fields.')
    return value


def bounded_list(value, maximum, label):
    if not isinstance(value, list) or len(value) > maximum:
        raise ApiError(f'{label} must be a list of at most {maximum} entries.')
    return value


def rates(value):
    aliases = {alias.casefold(): r.name for r in db.session.scalars(db.select(Resource))
               for alias in (r.name, r.symbol) if alias}
    aliases.update({'he3': 'Helium-3', 'he-3': 'Helium-3', 'helium 3': 'Helium-3'})
    result, seen = [], set()
    for row in bounded_list(value, 30, 'resources'):
        object_fields(row, {'resource', 'rate'}, 'resource')
        name = string(row.get('resource'), 'resource', 100, True)
        name = aliases.get(name.casefold(), name)
        if name.casefold() in seen:
            raise ApiError('A resource may occur only once per node or route.')
        seen.add(name.casefold())
        result.append({'resource': name, 'rate': None if row.get('rate') is None
                       else number(row['rate'], 'rate', 0, 1000000)})
    return result


def validate(data, creating=False):
    values = {}
    if creating or 'name' in data:
        values['name'] = string(data.get('name'), 'name', 100, True)
    if 'notes' in data:
        values['notes'] = string(data['notes'], 'notes', 30000)
    for kind, maximum in [('nodes', 60), ('links', 120)]:
        if kind not in data:
            continue
        result, ids, outpost_ids = [], set(), set()
        for row in bounded_list(data[kind], maximum, kind):
            allowed = ({'id', 'name', 'system', 'x', 'y', 'outpost_id', 'production'} if kind == 'nodes'
                       else {'id', 'source', 'target', 'kind', 'resources', 'fuel_node_id', 'fuel_rate', 'enabled'})
            object_fields(row, allowed, kind)
            identifier = string(row.get('id'), 'id', 64, True)
            if identifier in ids:
                raise ApiError(f'Duplicate {kind} id.')
            ids.add(identifier)
            if kind == 'nodes':
                item = {'id': identifier, 'name': string(row.get('name'), 'node name', 100, True),
                        'system': string(row.get('system', ''), 'system'),
                        'x': number(row.get('x', 100), 'x', -10000, 10000),
                        'y': number(row.get('y', 100), 'y', -10000, 10000),
                        'outpost_id': None if row.get('outpost_id') is None else number(row['outpost_id'], 'outpost_id', 1, 2147483647, True),
                        'production': rates(row.get('production', []))}
                if item['outpost_id'] is not None:
                    if item['outpost_id'] in outpost_ids:
                        raise ApiError('An existing outpost may appear only once in a network; reuse its node to avoid double-counting supply.')
                    outpost_ids.add(item['outpost_id'])
            else:
                link_kind = row.get('kind', 'inter-system')
                if link_kind not in ('local', 'inter-system'):
                    raise ApiError('Route kind must be local or inter-system.')
                item = {'id': identifier, 'source': string(row.get('source'), 'source', 64, True),
                        'target': string(row.get('target'), 'target', 64, True), 'kind': link_kind,
                        'resources': rates(row.get('resources', [])),
                        'fuel_node_id': string(row.get('fuel_node_id', ''), 'fuel node', 64),
                        'fuel_rate': None if row.get('fuel_rate') is None else number(row['fuel_rate'], 'fuel rate', 0, 1000000),
                        'enabled': boolean(row.get('enabled', True), 'enabled')}
            result.append(item)
        values[kind] = result
    return values


def evaluate(nodes, links):
    """Reserve complete routes in order, retrying blocked routes after imports arrive.

    A route fires at most once per evaluation. Unfunded cycles cannot manufacture
    resources, and fuel must reach an endpoint before its inter-system route opens.
    Unknown measured rates remain unverified; they never become free supply.
    """
    resolved, balances = {}, {}
    for node in nodes:
        item = {**node, 'issues': [], 'production': node['production']}
        if node['outpost_id']:
            outpost = db.session.get(OutpostPlan, node['outpost_id'])
            if not outpost:
                item['issues'].append('Linked outpost has been deleted. Relink or convert to a planned site.')
            else:
                planet = db.session.get(PlanetProfile, outpost.planet_id) if outpost.planet_id else None
                analysis = evaluate_outpost(outpost.modules, outpost.planet_id, outpost.environment, outpost.stored_mass)
                item.update(name=outpost.name, system=planet.system_name if planet else '',
                            production=[{'resource': r, 'rate': v} for r, v in analysis['rates_per_minute'].items()])
                if analysis['net_power'] < 0:
                    item['issues'].append('Outpost power deficit: restore generation before exporting.')
        resolved[node['id']] = item
        balances[node['id']] = {r['resource']: r['rate'] for r in item['production']}

    results, pending, depot_counts = [], [], Counter()
    for link in links:
        result = {**link, 'status': 'pending', 'issues': []}
        results.append(result)
        source, target = resolved.get(link['source']), resolved.get(link['target'])
        if not link['enabled']:
            result.update(status='paused', issues=['Route paused by the planner.'])
            continue
        if not source or not target:
            result['issues'].append('Route endpoint is missing.')
        elif source['id'] == target['id']:
            result['issues'].append('A route needs two different outposts.')
        else:
            depot_counts.update([source['id'], target['id']])
            if source['issues'] or target['issues']:
                result['issues'].append('An endpoint is offline. Inspect its outpost diagnostics.')
            if not source['system'] or not target['system']:
                result['issues'].append('Chart both endpoint systems before opening this route.')
            elif link['kind'] == 'local' and source['system'].casefold() != target['system'].casefold():
                result['issues'].append('Different systems require an inter-system cargo link.')
        if link['kind'] == 'inter-system' and link['fuel_node_id'] not in (link['source'], link['target']):
            result['issues'].append('Choose one endpoint to supply Helium-3 fuel.')
        if result['issues']:
            result['status'] = 'broken'
            continue
        if not link['resources'] or any(r['rate'] is None or r['rate'] <= 0 for r in link['resources']):
            result.update(status='unverified', issues=['Enter positive measured cargo rates (units/min).'])
            continue
        if link['kind'] == 'inter-system' and (link['fuel_rate'] is None or link['fuel_rate'] <= 0):
            result.update(status='unverified', issues=['Enter positive measured Helium-3 consumption (units/min).'])
            continue
        demands = Counter({(link['source'], r['resource']): r['rate'] for r in link['resources']})
        if link['kind'] == 'inter-system':
            demands[(link['fuel_node_id'], 'Helium-3')] += link['fuel_rate']
        pending.append((result, demands))

    while pending:
        advanced = False
        for result, demands in pending[:]:
            if all(balances[n].get(r) is not None and balances[n][r] + 1e-9 >= demand
                   for (n, r), demand in demands.items()):
                for (n, r), demand in demands.items():
                    balances[n][r] = max(0, balances[n][r] - demand)
                for cargo in result['resources']:
                    stock = balances[result['target']]
                    # A known import is a usable lower bound even if local extraction is unknown.
                    stock[cargo['resource']] = (stock.get(cargo['resource']) or 0) + cargo['rate']
                result['status'] = 'ready'
                pending.remove((result, demands))
                advanced = True
        if not advanced:
            break
    for result, demands in pending:
        shortage = False
        for (n, r), demand in demands.items():
            stock = balances[n].get(r, 0)
            if stock is None:
                result['issues'].append(f'{resolved[n]["name"]}: measure {r} supply before confirming this route.')
            elif stock + 1e-9 < demand:
                shortage = True
                fuel = r == 'Helium-3' and result['kind'] == 'inter-system' and n == result['fuel_node_id']
                result['issues'].append(f'{"Fuel shortage — " if fuel else "Supply shortage — "}{resolved[n]["name"]}: '
                                        f'{r} needs {demand:g}/min; {stock:g}/min remains.')
        result['status'] = 'shortage' if shortage else 'unverified'
    for identifier, item in resolved.items():
        item['remaining'] = balances[identifier]
        item['depots_required'] = depot_counts[identifier]
        item['advisory'] = ('More than three link depots: verify your Outpost Management allowance.'
                            if depot_counts[identifier] > 3 else '')
    return {'nodes': list(resolved.values()), 'links': results,
            'summary': dict(Counter(r['status'] for r in results)),
            'method': 'Measured units/min. Routes reserve complete shipments in list order, retrying after imports. '
                      'Fuel is consumed at one endpoint. No storage buffers, transit times or partial shipments are simulated.'}
