import json, time, urllib.parse, urllib.request
from pathlib import Path
queries = [
    {'action':'query','list':'allcategories','acprefix':'Starfield-','aclimit':500},
    {'action':'query','prop':'revisions','rvprop':'content','rvslots':'main','titles':'Starfield:Jemison|Starfield:Sol|Starfield:Sarah Morgan|Starfield:Iron|Starfield:Medical Treatment 1|Starfield:Adaptive Frame'},
]
folder = Path('backend/data_pipeline/cache')
folder.mkdir(parents=True, exist_ok=True)
for index, params in enumerate(queries):
    params.update(format='json', maxlag=5)
    url = 'https://starfieldwiki.net/w/api.php?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'StarfieldCompanion/0.1 (personal companion; source attribution in backend/data/SOURCES.md)'}), timeout=30) as response:
        data = json.load(response)
    (folder / f'probe-{index}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    if index == 0:
        print([item['*'] for item in data['query']['allcategories']])
    else:
        for page in data['query']['pages'].values():
            print(page['title'], page.get('revisions', [{}])[0].get('slots', {}).get('main', {}).get('*', 'MISSING')[:7000])
    time.sleep(1)
