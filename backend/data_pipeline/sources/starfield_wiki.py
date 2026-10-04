"""Polite MediaWiki client with content-addressed raw response caching."""
import hashlib
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = 'https://starfieldwiki.net/w/api.php'
CACHE = Path(__file__).resolve().parents[1] / 'cache'


class WikiClient:
    def __init__(self, offline=False, refresh=False, api=API):
        self.offline, self.refresh, self.api = offline, refresh, api
        self.last_request = 0.0
        CACHE.mkdir(parents=True, exist_ok=True)

    def get(self, **params):
        params.update(format='json', maxlag=5)
        key = hashlib.sha256((self.api + json.dumps(params, sort_keys=True)).encode()).hexdigest()
        path = CACHE / (key + '.json')
        if path.exists() and (self.offline or not self.refresh):
            return json.loads(path.read_text(encoding='utf-8'))
        if self.offline:
            raise RuntimeError(f'No cached response for {params}. Run online first.')
        time.sleep(max(0, 1.05 - (time.monotonic() - self.last_request)))
        request = urllib.request.Request(self.api + '?' + urllib.parse.urlencode(params), headers={
            'User-Agent': 'StarfieldCompanion/0.1 (personal reference builder; attribution and project contact in repository README.md)',
        })
        self.last_request = time.monotonic()
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.load(response)
        if 'error' in data:
            raise RuntimeError(f'Wiki API error: {data["error"].get("code", "unknown")}')
        data['_fetched_at'] = datetime.now(timezone.utc).isoformat()
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        return data

    def categories(self, prefix):
        data = self.get(action='query', list='allcategories', acprefix=prefix, aclimit=500)
        return [item['*'] for item in data['query']['allcategories']]

    def members(self, category):
        params = {'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + category, 'cmlimit': 500}
        result = []
        while True:
            data = self.get(**params)
            result.extend(data['query']['categorymembers'])
            if 'continue' not in data:
                return result
            params.update(data['continue'])

    def pages(self, titles):
        result = []
        titles = sorted(set(titles))
        for start in range(0, len(titles), 50):
            data = self.get(action='query', prop='revisions', rvprop='content|ids|timestamp', rvslots='main', redirects=1, titles='|'.join(titles[start:start+50]))
            for page in data['query']['pages'].values():
                if 'missing' in page:
                    continue
                revision = page['revisions'][0]
                result.append({'title': page['title'], 'page_id': page['pageid'], 'revision': revision['revid'],
                               'timestamp': revision['timestamp'], 'fetched_at': data['_fetched_at'],
                               'wikitext': revision['slots']['main']['*'],
                               'source_url': 'https://starfieldwiki.net/wiki/' + urllib.parse.quote(page['title'].replace(' ', '_')),
                               'license': 'CC-BY-SA-4.0'})
        return result
