"""Resolve shared recipe dependencies while consuming inventory exactly once."""
from collections import defaultdict
from models import db, PlanetProfile
from services.catalogs import catalog
from validation import ApiError


def resolve(target, quantity, inventory, recipes=None):
    recipes = recipes if recipes is not None else catalog('recipes')
    by_name = {r['name'].casefold(): r for r in recipes}
    recipe = by_name.get(target.casefold())
    if recipe is None:
        raise ApiError('Recipe not found.', 404, 'not_found')
    raw_names = {r['name'].casefold() for r in catalog('resources') if r['type'] in ('inorganic', 'organic')}

    def expand(stock):
        leaves, purchased = defaultdict(int), defaultdict(int)
        visited_count = 0
        def visit(name, amount, path):
            nonlocal visited_count
            visited_count += 1
            if visited_count > 10000 or len(path) > 40:
                raise ApiError('Recipe dependency graph exceeds the supported size.')
            key = name.casefold()
            if key in path:
                raise ApiError('Recipe dependency cycle: ' + ' → '.join((*path, key)), 422, 'recipe_cycle')
            used = min(stock.get(key, 0), amount)
            stock[key] = stock.get(key, 0) - used
            needed = amount - used
            node = {'name': name, 'quantity': amount, 'inventory_used': used, 'needed': needed, 'children': []}
            if needed:
                definition = by_name.get(key)
                if definition:
                    for child, qty in sorted(definition['ingredients'].items()):
                        node['children'].append(visit(child, needed * qty, (*path, key)))
                else:
                    (leaves if key in raw_names else purchased)[name] += needed
            return node
        tree = visit(recipe['name'], quantity, ())
        return tree, dict(sorted(leaves.items())), dict(sorted(purchased.items()))

    _, gross, gross_purchased = expand({})
    tree, deficits, purchased = expand({k.casefold(): v for k, v in inventory.items()})
    suppliers = {}
    planets = list(db.session.scalars(db.select(PlanetProfile).order_by(PlanetProfile.name)))
    for name in deficits:
        suppliers[name] = [{'id': p.id, 'name': p.name, 'system_name': p.system_name} for p in planets
                           if name.casefold() in {r.name.casefold() for r in p.resources}]
    return {'target': recipe['name'], 'quantity': quantity, 'tree': tree, 'raw_totals': gross,
            'deficits': deficits, 'purchased_components': purchased, 'gross_purchased_components': gross_purchased,
            'suppliers': suppliers, 'prerequisites': recipe.get('prerequisites', ''),
            'method': 'One output per recipe; inventory is consumed once across the entire dependency tree. Research prerequisites, skill discounts and random bonuses are excluded. Unknown recipe leaves require purchase; supplier coverage is limited to catalogued worlds.'}
