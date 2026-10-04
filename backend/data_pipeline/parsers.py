"""Conservative parsers for explicit Wiki tables and infoboxes."""
import re
import hashlib
import mwparserfromhell as mw


def clean(text):
    return mw.parse(text).strip_code().strip()


def provenance(page):
    return {key: page[key] for key in ('source_url', 'revision', 'timestamp', 'fetched_at', 'license')}


def ingredients(text):
    result = {}
    for qty, link in re.findall(r'(\d+)\s*(\[\[[^\]]+\]\])', text):
        name = clean(link)
        result[name] = result.get(name, 0) + int(qty)
    return result


def tables(text):
    section = ''
    for match in re.finditer(r'^=+\s*([^=\n]+?)\s*=+\s*$|\{\|.*?\|\}', text, re.M | re.S):
        if match.group(1):
            section = match.group(1).strip()
            continue
        table = match.group()
        header = re.search(r'^!.*?(?=^\|-|^\|})', table, re.M | re.S)
        if not header:
            continue
        headers = [clean(x) for x in re.split(r'!!|\n!', header.group().lstrip('!').strip())]
        for row in re.split(r'^\|-.*$', table, flags=re.M)[1:]:
            row = row.split('|}')[0].strip()
            if not row.startswith('|') or row.startswith('|+'):
                continue
            placeholders = {}
            def protect(match):
                key = f'@@{len(placeholders)}@@'
                placeholders[key] = match.group()
                return key
            protected = re.sub(r'\[\[.*?\]\]|\{\{.*?\}\}', protect, row[1:], flags=re.S)
            cells = re.split(r'\|\||\n\|', protected)
            cells = [re.sub(r'@@\d+@@', lambda m: placeholders[m.group()], cell).strip() for cell in cells]
            if len(cells) == len(headers):
                yield section, dict(zip(headers, cells))


def parse_resources(page):
    result = []
    for section, row in tables(page['wikitext']):
        if 'Name' not in row or 'Rarity' not in row:
            continue
        kind = next((k for k in ('inorganic', 'organic', 'manufactured') if k in section.lower()), None)
        if not kind:
            continue
        rarity = clean(row['Rarity'])
        result.append({'name': clean(row['Name']), 'type': kind, 'symbol': clean(row.get('Symbol', '')),
                       'state': clean(row.get('State', '')),
                       'rarity': ['common', 'uncommon', 'rare', 'exotic', 'unique'][int(rarity)] if rarity.isdigit() and int(rarity) < 5 else rarity,
                       '_source': provenance(page)})
    return result


def parse_recipe(page):
    section = re.search(r'==\s*Crafting Components\s*==(.*?)(?=\n==|\Z)', page['wikitext'], re.S)
    materials = ingredients(section.group(1)) if section else {}
    if not materials:
        return None
    return {'name': page['title'].split(':', 1)[1], 'kind': 'component', 'output': 1,
            'ingredients': materials, '_source': provenance(page)}


def parse_research(page):
    result = []
    for _, row in tables(page['wikitext']):
        if 'Project' in row and 'Req. Resources' in row:
            materials = ingredients(row['Req. Resources'])
            if materials:
                result.append({'name': clean(row['Project']), 'kind': 'research', 'output': 1,
                               'ingredients': materials, 'prerequisites': clean(row.get('Req. Projects', '')),
                               '_source': provenance(page)})
    return result


def parse_modules(page):
    result = []
    for section, row in tables(page['wikitext']):
        if section not in ('Builders', 'Extractors', 'Power', 'Storage') or 'Outpost Module' not in row:
            continue
        name = clean(row['Outpost Module'])
        power = clean(row.get('Power', '0'))
        if not re.fullmatch(r'-?\d+', power):
            raise ValueError(f'Unrecognized power: {name}: {power}')
        result.append({'id': hashlib.sha256((section + ':' + name).encode()).hexdigest()[:16],
                       'name': name, 'category': section, 'power': int(power),
                       'cost': ingredients(row.get('Crafting Materials', '')),
                       'capacity': None, 'rate_per_minute': None, 'notes': clean(row.get('Notes', '')),
                       '_source': provenance(page)})
    return result


def parse_system(page):
    for template in mw.parse(page['wikitext']).filter_templates():
        if str(template.name).strip().lower() == 'system infobox':
            values = {str(p.name).strip(): clean(str(p.value)) for p in template.params}
            return {'name': values.get('name', page['title'].split(':', 1)[1].removesuffix(' System')),
                    'type': values.get('class', 'Unknown'), 'faction': 'Unrecorded',
                    'level': int(values['level']) if values.get('level', '').isdigit() else None,
                    'description': 'Wiki system reference; schematic navigation coordinates.',
                    'layout_only': True, '_source': provenance(page)}
    return None
