"""Build the bounded Settled Systems catalog from revision-attributed infoboxes.

Run from backend: python -m data_pipeline.planet_catalog [--offline].
No prose or images are imported; hazard labels are conservative app inferences.
"""
import argparse
import json
import re
from pathlib import Path

import mwparserfromhell as mw
from data_pipeline.parsers import clean, provenance
from data_pipeline.sources.starfield_wiki import WikiClient

DATA = Path(__file__).resolve().parents[1] / 'data'
WORLDS = {
    'Sol': ['Mercury', 'Venus', 'Earth', 'Luna', 'Mars', 'Phobos', 'Deimos',
            'Jupiter', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Saturn', 'Titan',
            'Enceladus', 'Rhea', 'Uranus', 'Neptune', 'Pluto'],
    'Alpha Centauri': ['Jemison', 'Gagarin', 'Olivas', 'Chawla', 'Kurtz', 'Bondar', 'Voss', 'Zamka'],
    'Cheyenne': ['Akila', 'Codos', 'Montara', 'Montara Luna', 'Bindi', 'Washakie'],
    'Volii': ['Volii Alpha', 'Volii Beta', 'Volii Epsilon'],
    'Narion': ['Vectera', 'Kreet', 'Anselon', 'Niira', 'Sumati'],
    'Kryx': ['Suvorov'],
    'Porrima': ['Porrima II', 'Porrima III'],
    'Olympus': ['Nesoi', 'Ananke'],
    'Bessel': ['Bessel III'],
}


def life_count(value):
    if value.casefold() == 'none':
        return 0
    match = re.search(r'\((\d+)\)', value)
    return int(match[1]) if match else None


def parse_planet(page, resources):
    template = next((t for t in mw.parse(page['wikitext']).filter_templates()
                     if str(t.name).strip().casefold() == 'planet infobox'), None)
    if template is None:
        raise ValueError(f"No planet infobox: {page['title']}")
    values = {str(p.name).strip(): clean(str(p.value)) for p in template.params}
    name = values.get('name', page['title'].split(':', 1)[1])
    deposits = []
    for resource in filter(None, (r.strip() for r in values.get('resource', '').split(','))):
        if resource not in resources:
            raise ValueError(f'{name}: unknown resource {resource}')
        deposits.append({k: resources[resource][k] for k in ('name', 'symbol', 'type', 'rarity')})
    hazards = []
    temperature = values.get('temp', '')
    atmosphere = values.get('atmosphere', '')
    if any(term in temperature.casefold() for term in ('cold', 'frozen', 'freeze')):
        hazards.append('Cold exposure')
    if any(term in temperature.casefold() for term in ('hot', 'inferno', 'scorched')):
        hazards.append('Heat exposure')
    if atmosphere.casefold() == 'none':
        hazards.append('Vacuum')
    elif atmosphere and 'O₂' not in atmosphere and 'O2' not in atmosphere:
        hazards.append('Non-breathable atmosphere')
    if values.get('magnetosphere', '').casefold() in ('none', 'weak'):
        hazards.append('Limited radiation protection')
    water = values.get('water', '')
    if water and water.casefold() not in ('none', 'safe'):
        hazards.append(water + ' water')
    gravity = values.get('gravity', '')
    traits = [s.strip() for s in values.get('trait', '').split(',') if s.strip()]
    biomes = [re.sub(r'^\s*\*?\s*(?:\d+%\s*)?', '', s).strip()
              for s in values.get('biomes', '').splitlines() if s.strip()]
    return {
        'name': name, 'system_name': values['system'].removesuffix(' System'),
        'type': values.get('type') or 'Unknown',
        'gravity': float(gravity) if re.fullmatch(r'\d+(?:\.\d+)?', gravity) else None,
        'temperature': temperature or 'Unknown', 'atmosphere': atmosphere or 'Unknown',
        'magnetosphere': values.get('magnetosphere') or 'Unknown', 'water': water or 'Unknown',
        'flora': life_count(values.get('flora', '')), 'fauna': life_count(values.get('fauna', '')),
        'biomes': biomes, 'planetary_traits': traits, 'resources': deposits, 'hazards': hazards,
        'approximate': True, 'surveyed_percent': 0, 'favorite': False, 'outpost_candidate': False,
        '_sources': [page['source_url']],
        '_reference': {**provenance(page), 'orbits': values.get('orbits') or values['system'],
                       'body_type': 'Moon' if values.get('orbits') else 'Planet',
                       'orbital_position': values.get('orbital_position', ''),
                       'landable': values.get('type', '').casefold() not in ('gas giant', 'ice giant', 'asteroid'),
                       'hazard_basis': 'Preparation labels inferred from the recorded environment; not numeric game danger ratings.'},
    }


def build(offline=False, refresh=False):
    resources = {r['name']: r for r in json.loads((DATA / 'reference/resources.json').read_text(encoding='utf-8'))}
    expected = {name: system for system, names in WORLDS.items() for name in names}
    pages = WikiClient(offline=offline, refresh=refresh).pages([
        'Starfield:' + ('Deimos (planet)' if name == 'Deimos' else name) for name in expected])
    rows = [parse_planet(page, resources) for page in pages]
    if {p['name']: p['system_name'] for p in rows} != expected:
        raise ValueError('Catalog pages do not match the requested worlds and systems.')
    rows.sort(key=lambda p: (p['system_name'], p['name']))
    (DATA / 'planets.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Built {len(rows)} sourced worlds in {len(WORLDS)} systems.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    build(args.offline, args.refresh)
