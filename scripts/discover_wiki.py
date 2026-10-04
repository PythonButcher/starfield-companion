import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from data_pipeline.sources.starfield_wiki import WikiClient, CACHE
client = WikiClient()
for prefix in ['Starfield-Planets', 'Starfield-Moons', 'Starfield-Systems', 'Starfield-Star Systems', 'Starfield-Resources', 'Starfield-Research', 'Starfield-Skills', 'Starfield-Crew', 'Starfield-Outpost', 'Starfield-Ship Parts']:
    values = client.categories(prefix)
    print(prefix, values[:40], flush=True)
pages = client.pages(['Starfield:Sol', 'Starfield:Alpha Centauri', 'Starfield:Research', 'Starfield:Research Laboratory', 'Starfield:Outposts', 'Starfield:Outpost Modules', 'Starfield:Astrodynamics', 'Starfield:Iron', 'Starfield:Resources'])
(CACHE / 'discovery-pages.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2),encoding='utf-8')
for page in pages:
    if page['title'] in ['Starfield:Iron']:
        continue
    print('\nPAGE', page['title'], page['wikitext'][:4500], flush=True)
