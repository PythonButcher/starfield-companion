"""Build a small attributed ship-module catalog from explicit Wiki tables."""
import argparse
import hashlib
import json
from pathlib import Path

from data_pipeline.parsers import clean, provenance, tables
from data_pipeline.sources.starfield_wiki import WikiClient

PAGES = ['Starfield:Ships', 'Starfield:Ship Modules', 'Starfield:Ship Building',
         'Starfield:Outposts', 'Starfield:Outpost Modules', 'Starfield:Frontier']
SECTIONS = {
    'Reactors': ('Reactor', 'Reactor', 4), 'Engines': ('Engine', 'Engine', 5),
    'Grav Drives': ('Grav Drive', 'Grav drive', 4),
    'Shield Generators': ('Generator', 'Shield', 4), 'Cockpits': ('Cockpit', 'Cockpit', 3),
    'All-in-One Berth': ('Module', 'Hab', 2), 'Control Station': ('Module', 'Hab', 2),
    'Workshop': ('Module', 'Hab', 1), 'Cargo Modules': ('Module', 'Cargo', 3),
    'Fuel Tanks': ('Tank', 'Fuel tank', 2), 'Landing Gear': ('Lander', 'Landing gear', 2),
    'Landing Bay': ('Bay', 'Landing bay', 1), 'Docker': ('Docker', 'Docker', 1),
}
STAT_FIELDS = ('mass', 'hull', 'power', 'crew_capacity', 'crew_stations', 'shield',
               'maneuvering_thrust', 'grav_thrust', 'top_speed', 'cargo', 'fuel')


def parse_ship_modules(page):
    result, counts = [], {}
    parsed = list(tables(page['wikitext']))
    chosen = []
    for section, (name_key, _, maximum) in SECTIONS.items():
        rows = [row for heading, row in parsed if heading == section]
        # Keep A/B/C alternatives and the exceptional 180 m/s engine, rather
        # than filling a small library with adjacent variants of one model.
        preferred = [next((row for row in rows if clean(row.get('Class', '')) == cls), None) for cls in ('A', 'B', 'C')]
        if section == 'Engines':
            preferred.append(next((row for row in rows if clean(row[name_key]) == 'White Dwarf 3015'), None))
        selected = []
        for row in preferred + rows:
            if row is not None and row not in selected:
                selected.append(row)
        chosen.extend((section, row) for row in selected[:maximum])
    for section, row in chosen:
        if section not in SECTIONS:
            continue
        name_key, category, maximum = SECTIONS[section]
        if counts.get(section, 0) >= maximum:
            continue
        counts[section] = counts.get(section, 0) + 1
        name = clean(row[name_key])

        def numeric(key, default=0):
            if key not in row:
                return default
            value = clean(row[key]).replace(',', '')
            try:
                return float(value)
            except ValueError:
                return None

        stats = dict.fromkeys(STAT_FIELDS, 0)
        stats.update(mass=numeric('Mass', None), hull=numeric('Hull', None),
                     cargo=numeric('Cargo'), crew_stations=numeric('Crew Stations', numeric('Crew stations')))
        ship_class = clean(row.get('Class', ''))
        if category == 'Reactor':
            stats.update(power=numeric('Power Generated', None), crew_capacity=numeric('Crew Capacity', None))
        elif category == 'Engine':
            stats.update(power=numeric('Max Power', None), maneuvering_thrust=numeric('Maneuvering Thrust', None),
                         crew_capacity=0.25, top_speed=180 if name == 'White Dwarf 3015' else {'A': 150, 'B': 140, 'C': 130}[ship_class])
        elif category == 'Shield':
            stats.update(power=numeric('Max Power', None), shield=numeric('Max Health', None), crew_capacity=numeric('Crew', None))
        elif category == 'Grav drive':
            stats.update(power=numeric('Max Power', None), grav_thrust=numeric('Grav Jump Thrust', None))
        elif category == 'Fuel tank':
            stats['fuel'] = numeric('Grav Jump Fuel', None)
        result.append({'catalog_id': hashlib.sha256(name.encode()).hexdigest()[:16], 'name': name,
                       'category': category, 'ship_class': ship_class, 'count': 1, 'stats': stats,
                       '_source': provenance(page)})
    if len(result) != sum(v[2] for v in SECTIONS.values()):
        raise ValueError('Ship table coverage changed; inspect the source before replacing the catalog.')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    pages = WikiClient(offline=args.offline).pages(PAGES)
    source = next(page for page in pages if page['title'] == 'Starfield:Ship Modules')
    rows = parse_ship_modules(source)
    target = Path(__file__).resolve().parents[1] / 'data/reference/ship_modules.json'
    target.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Wrote {len(rows)} attributed ship modules to {target}')


if __name__ == '__main__':
    main()
