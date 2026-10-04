"""Run from backend: python -m data_pipeline.build [--offline] [--refresh]."""
import argparse
import json
from pathlib import Path
from datetime import datetime, timezone
from data_pipeline.sources.starfield_wiki import WikiClient
from data_pipeline.parsers import parse_resources, parse_recipe, parse_research, parse_modules, parse_system
from data_pipeline.map_layout import sector_layout

OUTPUT = Path(__file__).resolve().parents[1] / 'data' / 'reference'


def build(offline=False, refresh=False):
    client = WikiClient(offline=offline, refresh=refresh)
    roots = {p['title']: p for p in client.pages(['Starfield:Resources', 'Starfield:Research Projects', 'Starfield:Outpost Modules'])}
    resources = parse_resources(roots['Starfield:Resources'])
    recipes = [r for p in client.pages(['Starfield:' + r['name'] for r in resources if r['type'] == 'manufactured'])
               if (r := parse_recipe(p))]
    research = parse_research(roots['Starfield:Research Projects'])
    titles, params = [], {'action': 'query', 'list': 'embeddedin', 'eititle': 'Template:System Infobox', 'eilimit': 500}
    while True:
        data = client.get(**params)
        titles.extend(p['title'] for p in data['query']['embeddedin'] if p['title'].startswith('Starfield:'))
        if 'continue' not in data:
            break
        params.update(data['continue'])
    systems = [s for p in client.pages(titles) if (s := parse_system(p))]
    legacy = json.loads((OUTPUT.parent / 'starfield_universe.json').read_text(encoding='utf-8'))
    old = {s['name']: s for s in legacy}
    for index, system in enumerate(sorted(systems, key=lambda s: s['name'])):
        original = old.get(system['name'], {})
        system.update(id=index + 1, x=original.get('x', (index % 12) * 120 - 660),
                      y=original.get('y', (index // 12) * 120 - 500),
                      faction=original.get('faction', 'Unrecorded'))
    catalogs = {'resources': resources, 'recipes': recipes + research,
                'outpost_modules': parse_modules(roots['Starfield:Outpost Modules']), 'systems': sector_layout(systems)}
    for name, minimum in {'resources': 70, 'recipes': 50, 'outpost_modules': 20, 'systems': 50}.items():
        rows = catalogs[name]
        if len(rows) < minimum:
            raise ValueError(f'{name}: only {len(rows)} rows; check source layout.')
        keys = [r.get('id', r['name']) for r in rows]
        if len(keys) != len(set(keys)):
            raise ValueError(f'Duplicate keys in {name}')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, rows in catalogs.items():
        (OUTPUT / (name + '.json')).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    manifest = {'built_at': datetime.now(timezone.utc).isoformat(), 'license': 'CC-BY-SA-4.0',
                'source': 'https://starfieldwiki.net', 'counts': {k: len(v) for k, v in catalogs.items()},
                'limitations': ['System positions are schematic, not game distances.',
                    'Planet suppliers use 47 sourced worlds plus user records.',
                    'Storage capacities and extraction rates require in-game measurements.',
                    'Research costs exclude skill discounts and sudden developments.',
                    'Unresolved recipe leaves are purchased components, not raw elements.']}
    planet_path = OUTPUT.parent / 'planets.json'
    if planet_path.exists():
        manifest['counts']['planets'] = len(json.loads(planet_path.read_text(encoding='utf-8')))
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest['counts']))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    build(args.offline, args.refresh)
