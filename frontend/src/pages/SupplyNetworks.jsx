import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { crud, request } from '../api/client';
import { useResource } from '../hooks/useResource';
import usePlanAnalysis from '../hooks/usePlanAnalysis';
import NetworkCanvas from '../components/supply/NetworkCanvas';
import { NodeForm, RouteForm } from '../components/supply/NetworkForms';
import { Button, Input, Panel, ResourceState, SectionHeader, Select, Tag, TextArea, Toast, Modal } from '../components/ui';
import { downloadText } from '../utils/storage';

const api = crud('/api/supply-networks');
const example = {
  name: 'Constellation supply corridor', notes: 'Illustrative network. Replace these example rates with measured production and fuel use.',
  nodes: [
    { id: 'luna', name: 'Luna Supply Depot', system: 'Sol', x: 150, y: 285, outpost_id: null, production: [{ resource: 'Iron', rate: 8 }, { resource: 'Helium-3', rate: 2 }] },
    { id: 'vectera', name: 'Vectera Foundry', system: 'Narion', x: 500, y: 155, outpost_id: null, production: [{ resource: 'Aluminum', rate: 2 }] },
    { id: 'jemison', name: 'Jemison Exchange', system: 'Alpha Centauri', x: 830, y: 355, outpost_id: null, production: [] },
  ],
  links: [
    { id: 'luna-vectera', source: 'luna', target: 'vectera', kind: 'inter-system', enabled: true, fuel_node_id: 'luna', fuel_rate: 0.5, resources: [{ resource: 'Iron', rate: 4 }, { resource: 'Helium-3', rate: 1 }] },
    { id: 'vectera-jemison', source: 'vectera', target: 'jemison', kind: 'inter-system', enabled: true, fuel_node_id: 'vectera', fuel_rate: 0.5, resources: [{ resource: 'Iron', rate: 2 }, { resource: 'Aluminum', rate: 2 }] },
  ],
};
const payload = (draft) => ({ name: draft.name, notes: draft.notes, nodes: draft.nodes, links: draft.links });

export default function SupplyNetworks() {
  const [params, setParams] = useSearchParams();
  const records = useResource('/api/supply-networks?limit=200');
  const outposts = useResource('/api/outposts?limit=200');
  const [selection, setSelection] = useState(null); const [version, setVersion] = useState(0); const [dirty, setDirty] = useState(false);
  function choose(item, check = true) {
    if (check && dirty && !window.confirm('Discard unsaved changes to this network?')) return;
    setSelection(item); setVersion((v) => v + 1); setDirty(false); setParams(item.id ? { id: item.id } : {});
  }
  return <><SectionHeader eyebrow="Logistics / Inter-system operations" title="Supply Chain Visualizer">
    <Button variant="ghost" onClick={() => choose(example)}>Example corridor</Button>
    <Button onClick={() => choose({ name: 'New supply network', notes: '', nodes: [], links: [] })}>New network</Button>
  </SectionHeader>
    <ResourceState resource={records}><ResourceState resource={outposts}>
      {records.data && outposts.data && <>
        <div className="toolbar"><Select label="Open saved network" value={selection?.id || params.get('id') || ''} onChange={(e) => {
          const item = records.data.find((r) => String(r.id) === e.target.value); if (item) choose(item);
        }}><option value="">{records.data.length ? 'Choose a saved network' : 'First network ready to chart — start with the corridor below'}</option>{records.data.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
          <Link to="/logistics/outposts">Manage real outposts ↗</Link></div>
        <NetworkEditor key={version} initial={selection || records.data.find((r) => String(r.id) === params.get('id')) || example} outposts={outposts.data}
          onDirty={setDirty} onSaved={(item) => { records.reload(); choose(item, false); }} onDeleted={() => { records.reload(); choose(example, false); }} />
      </>}
    </ResourceState></ResourceState>
  </>;
}

function NetworkEditor({ initial, outposts, onDirty, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [history, setHistory] = useState([]); const [selection, setSelection] = useState({ kind: 'node', id: initial.nodes[0]?.id });
  const [form, setForm] = useState(null); const [connectFrom, setConnectFrom] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState(false);
  // Placement does not change supply budgets, so dragging never floods the API.
  const analysis = usePlanAnalysis('/api/supply-networks/analyze', { nodes: draft.nodes.map((n) => ({ ...n, x: 0, y: 0 })), links: draft.links });
  const data = analysis.data;
  const node = draft.nodes.find((n) => selection.kind === 'node' && n.id === selection.id);
  const link = draft.links.find((r) => selection.kind === 'link' && r.id === selection.id);
  const liveNode = data?.nodes.find((n) => n.id === node?.id);
  const liveLink = data?.links.find((r) => r.id === link?.id);
  function change(next, remember = true) {
    if (remember) setHistory((old) => [...old.slice(-29), draft]);
    setDraft(next); onDirty(true); setError('');
  }
  function connect(source = draft.nodes[0]?.id || '', target = draft.nodes[1]?.id || '') {
    setForm({ kind: 'link', item: { id: crypto.randomUUID(), source, target, kind: 'inter-system', enabled: true, fuel_node_id: source, fuel_rate: null, resources: [] } });
    setConnectFrom('');
  }
  async function save(copy = false) {
    if (!draft.name.trim()) { setError('Give your network a name before saving.'); return; }
    setBusy(true); setError('');
    try { onSaved(await (draft.id && !copy ? api.update(draft.id, payload(draft)) : api.create(payload(draft)))); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api.remove(draft.id); onDeleted(); } catch (err) { setError(err.message); } finally { setBusy(false); setDeleting(false); }
  }
  async function applyGraphItem(kind, item) {
    const key = kind === 'node' ? 'nodes' : 'links';
    const next = { ...draft, [key]: draft[key].some((row) => row.id === item.id)
      ? draft[key].map((row) => row.id === item.id ? item : row) : [...draft[key], item] };
    // Validate on explicit Apply; rejected input remains in its editable dialog.
    await request('/api/supply-networks/analyze', { method: 'POST', body: { nodes: next.nodes, links: next.links } });
    change(next); setSelection({ kind, id: item.id }); setForm(null);
  }
  return <div className="stack">
    <div className="tool-intro"><div><p className="eyebrow">CARGO LINK MAPPER</p><h2>Every shipment has a destination.</h2><p className="muted">Connect extraction sites, relay fuel and follow your materials across the Settled Systems.</p></div>
      <Tag>{draft.id ? (JSON.stringify(payload(draft)) === JSON.stringify(payload(initial)) ? 'Saved network' : 'Unsaved changes') : 'Unsaved planning example / draft'}</Tag></div>
    <div className="toolbar"><Input label="Network name" maxLength="100" value={draft.name} onChange={(e) => change({ ...draft, name: e.target.value })} />
      <Button disabled={busy} onClick={() => save()}>Save network</Button>
      <Button variant="ghost" disabled={busy} onClick={() => save(true)}>Save a copy</Button>
      <Button variant="ghost" disabled={!history.length} onClick={() => { const previous = history.at(-1); setHistory(history.slice(0, -1)); setDraft(previous); onDirty(true); }}>Undo edit</Button>
    </div>
    <Toast error message={error} />
    <div className="design-layout">
      <Panel className="canvas-panel"><NetworkCanvas nodes={draft.nodes} links={draft.links} analysis={data} selection={selection} onSelect={setSelection} connectFrom={connectFrom} onConnect={connect}
        onMove={(id, x, y) => change({ ...draft, nodes: draft.nodes.map((n) => n.id === id ? { ...n, x, y } : n) }, false)} />
        <div className="canvas-actions"><Button disabled={draft.nodes.length >= 60} onClick={() => setForm({ kind: 'node', item: { id: crypto.randomUUID(), name: '', system: '', x: 250 + draft.nodes.length % 3 * 250, y: 150 + draft.nodes.length % 4 * 95, outpost_id: null, production: [] } })}>+ Place outpost</Button>
          <Button variant="ghost" disabled={draft.nodes.length < 2 || draft.links.length >= 120} onClick={() => connect()}>+ Draw cargo link</Button>
          {connectFrom && <Button variant="ghost" onClick={() => setConnectFrom('')}>Cancel connection</Button>}
        </div>
        <div className="network-legend">{[['ready', 'Supplied'], ['shortage', 'Supply / fuel shortage'], ['broken', 'Broken endpoint'], ['unverified', 'Needs measurement']].map(([status, label]) => <span key={status} className={`route-state ${status}`}>● {label}</span>)}</div>
      </Panel>
      <Panel className="stack design-inspector" aria-label="Network inspector"><p className="eyebrow">Operations inspector</p>
        {node ? <><h2>{liveNode?.name || node.name}</h2><Tag>{liveNode?.system || node.system || 'Uncharted system'}</Tag>
          <div className="actions"><Button variant="ghost" onClick={() => setForm({ kind: 'node', item: node })}>Edit site</Button><Button variant="ghost" disabled={draft.nodes.length < 2} onClick={() => setConnectFrom(node.id)}>Connect from here</Button></div>
          {node.outpost_id && <Link to={`/logistics/outposts?id=${node.outpost_id}`}>Open linked outpost ↗</Link>}
          <h3>Unreserved supply</h3>{Object.entries(liveNode?.remaining || {}).map(([name, value]) => <div className="manifest-line" key={name}><span>{name}</span><strong>{value == null ? 'Unmeasured' : `${Number(value.toFixed(3))} / min`}</strong></div>)}
          {!Object.keys(liveNode?.remaining || {}).length && <p className="small muted">Receiving depot. Add measured production or an inbound route to supply it.</p>}
          <p className="small muted">{liveNode?.depots_required ?? '—'} cargo-link depots required</p>
          {liveNode?.issues.map((issue) => <p key={issue} className="diagnostic broken">{issue}</p>)}{liveNode?.advisory && <p className="diagnostic shortage">{liveNode.advisory}</p>}
          <Button variant="ghost" onClick={() => { change({ ...draft, nodes: draft.nodes.filter((n) => n.id !== node.id) }); setSelection({}); }}>Remove site</Button><p className="small muted">Removing a site keeps its routes visible as broken until you reconnect them.</p>
        </> : link ? <><h2>Cargo route</h2><span className={`route-state ${liveLink?.status || 'pending'}`}>{liveLink?.status || 'Calculating'}</span>
          <p>{draft.nodes.find((n) => n.id === link.source)?.name || 'Missing site'} → {draft.nodes.find((n) => n.id === link.target)?.name || 'Missing site'}</p>
          {link.resources.map((r) => <div className="manifest-line" key={r.resource}><span>{r.resource}</span><strong>{r.rate ?? '?'} / min</strong></div>)}
          {link.kind === 'inter-system' && <p className="small">He-3 fuel budget: {link.fuel_rate ?? '?'} / min</p>}
          {liveLink?.issues.map((issue) => <p key={issue} className={`diagnostic ${liveLink.status}`}>{issue}</p>)}
          <Button onClick={() => setForm({ kind: 'link', item: link })}>Edit route</Button>
          <Button variant="ghost" onClick={() => change({ ...draft, links: draft.links.map((r) => r.id === link.id ? { ...r, enabled: !r.enabled } : r) })}>{link.enabled ? 'Pause route' : 'Resume route'}</Button>
          <Button variant="ghost" onClick={() => { change({ ...draft, links: draft.links.filter((r) => r.id !== link.id) }); setSelection({}); }}>Remove route</Button>
        </> : <><h2>Chart your corridor</h2><p className="muted">Select a site or route to inspect it. Place your first outpost, then connect it to a destination.</p></>}
      </Panel>
    </div>
    <Panel className="stack"><div className="card-heading"><div><p className="eyebrow">Directed route manifest</p><h2>{data ? data.summary.ready || 0 : '—'} / {draft.links.length} routes supplied</h2></div><Button variant="ghost" onClick={analysis.reload}>Refresh telemetry</Button></div>
      <ResourceState resource={analysis}>{data && <>
        {data.links.map((r, index) => <div className="route-row" key={r.id}><Button variant="ghost" className="route-select" onClick={() => setSelection({ kind: 'link', id: r.id })}>
          <span className={`route-state ${r.status}`}>{String(index + 1).padStart(2, '0')} · {r.status}</span><span>{data.nodes.find((n) => n.id === r.source)?.name || 'Missing site'} → {data.nodes.find((n) => n.id === r.target)?.name || 'Missing site'}</span></Button>
          <Button variant="ghost" disabled={index === 0} aria-label={`Prioritize route ${index + 1}`} onClick={() => { const links = [...draft.links]; [links[index - 1], links[index]] = [links[index], links[index - 1]]; change({ ...draft, links }); }}>↑ Priority</Button></div>)}
        {!data.links.length && <p className="muted">Place two sites, then draw your first directed cargo link.</p>}
        <p className="small muted">Priority follows this list. {data.method}</p>
      </>}</ResourceState>
      <details><summary>Planning notes & export</summary><div className="stack"><TextArea label="Network notes" value={draft.notes} maxLength="30000" onChange={(e) => change({ ...draft, notes: e.target.value })} />
        <div className="actions"><Button variant="ghost" onClick={() => downloadText('supply-network.json', JSON.stringify(payload(draft), null, 2), 'application/json')}>Export network JSON</Button>
          {draft.id && <Button variant="ghost" onClick={() => setDeleting(true)}>Delete saved network</Button>}</div></div></details>
    </Panel>
    {form?.kind === 'node' && <NodeForm initial={form.item} outposts={outposts} onClose={() => setForm(null)} onSave={(item) => applyGraphItem('node', item)} />}
    {form?.kind === 'link' && <RouteForm initial={form.item} nodes={data?.nodes || draft.nodes} onClose={() => setForm(null)} onSave={(item) => applyGraphItem('link', item)} />}
    {deleting && <Modal title="Delete this saved network?" onClose={() => setDeleting(false)}><p>Outposts and their production plans will remain available.</p><Button disabled={busy} onClick={remove}>Delete network permanently</Button></Modal>}
  </div>;
}
