import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { request, query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { Panel, SectionHeader, Input, Select, Button, Modal, ResourceState, EmptyState, Toast, Tag } from '../components/ui';
export default function Surveys() {
  const [params] = useSearchParams(); const [system, setSystem] = useState(params.get('system') || ''); const [tier, setTier] = useState('');
  const [editor, setEditor] = useState(null); const [planetId, setPlanetId] = useState(params.get('planet_id') || '');
  const resource = useResource('/api/surveys/gaps' + query({ system, tier }));
  const worlds = useResource('/api/planets?limit=200');
  return <><SectionHeader eyebrow="Survey / Field ledger" title="Survey Gap Ledger"><Link to="/galaxy">World Catalog ↗</Link></SectionHeader>
    <div className="toolbar"><Input label="Survey system filter" value={system} onChange={(e) => setSystem(e.target.value)} />
      <Select label="Completion tier" value={tier} onChange={(e) => setTier(e.target.value)}><option value="">All incomplete</option><option value="nearly">Nearly done (&gt;75%)</option></Select>
    </div>
    <ResourceState resource={worlds}><div className="toolbar"><Select label="Record survey on planet" value={planetId} onChange={(e) => setPlanetId(e.target.value)}>
      <option value="">Choose world</option>{worlds.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </Select><Button disabled={!planetId} onClick={() => setEditor({ planet: worlds.data.find((p) => p.id === Number(planetId)) })}>Record counters</Button></div></ResourceState>
    <ResourceState resource={resource}>{resource.data && <div className="stack">
      <p className="small muted">{resource.data.method}</p>
      <div>{resource.data.systems.map((s) => <Tag key={s.name}>{s.name}: {s.complete}/{s.total} catalogued worlds complete</Tag>)}</div>
      {resource.data.planets.length ? <div className="grid-cards">{resource.data.planets.map((entry) =>
        <Panel className="stack" key={entry.planet.id}><h2>{entry.planet.name}</h2><p>{entry.planet.system_name} / {entry.planet.surveyed_percent}%</p>
          {Object.entries(entry.counters).map(([name, count]) => <p key={name}>{name}: {count.scanned ?? '?'} / {count.total ?? '?'} — {count.remaining ?? 'unknown'} remaining</p>)}
          {entry.hint && <p className="small muted">{entry.hint}</p>}
          <Button variant="ghost" onClick={() => setEditor(entry)}>Update {entry.planet.name} counters</Button>
          <Link to={'/journal/new?' + new URLSearchParams({ title: 'Survey ' + entry.planet.name, planet: entry.planet.name, system: entry.planet.system_name, planet_id: entry.planet.id })}>Launch Expedition</Link>
        </Panel>)}</div> : <EmptyState title="No survey gaps on this channel">Record progress between 1% and 99% to track an expedition.</EmptyState>}
    </div>}</ResourceState>
    {editor && <SurveyEditor initial={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); worlds.reload(); }} />}
  </>;
}
function SurveyEditor({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState({ surveyed_percent: initial.planet.surveyed_percent });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const fields = ['scanned_flora', 'scanned_fauna', 'discovered_traits', 'scanned_resources'];
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await request('/api/surveys/' + initial.planet.id + '/counters', { method: 'PATCH', body: draft }); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return <Modal title={'Survey ' + initial.planet.name} onClose={onClose}><form onSubmit={save} className="stack">
    <p className="small muted">Enter the counts and percentage shown in-game. Blank counters are unknown; untouched counters remain unchanged.</p>
    <Toast error message={error} /><Input label="Survey completion percent" type="number" min="0" max="100" required value={draft.surveyed_percent}
      onChange={(e) => setDraft({ ...draft, surveyed_percent: Number(e.target.value) })} />
    {fields.map((key) => {
      const previous = Object.values(initial.counters || {}).find((c) => c.field === key);
      const value = Object.hasOwn(draft, key) ? draft[key] : previous?.scanned;
      return <Input key={key} label={key.replaceAll('_', ' ')} type="number" min="0" max={previous?.total ?? 10000} value={value ?? ''}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value === '' ? null : Number(e.target.value) })} />;
    })}<Button type="submit" disabled={busy}>Save survey counters</Button>
  </form></Modal>;
}
