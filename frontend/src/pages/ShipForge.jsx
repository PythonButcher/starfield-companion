import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { crud } from '../api/client';
import { useResource } from '../hooks/useResource';
import usePlanAnalysis from '../hooks/usePlanAnalysis';
import { Button, Input, Modal, Panel, ResourceState, SectionHeader, Select, Tag, TextArea, Toast } from '../components/ui';
import ModuleForm from '../components/fleet/ModuleForm';
import ShipSchematic from '../components/fleet/ShipSchematic';
import { downloadText } from '../utils/storage';

const api = crud('/api/ship-blueprints');
const FIELDS = ['name', 'notes', 'modules', 'crew_limit', 'jump_bonus'];
const STATS = [['mass', 'Total mass', '', false], ['mobility', 'Mobility', '/ 100', true], ['top_speed', 'Top speed', 'm/s', false],
  ['jump_range', 'Jump range', 'LY', true], ['hull', 'Hull', 'HP', false], ['shield', 'Shield', 'HP', false], ['crew_capacity', 'Crew capacity', 'crew', false], ['cargo', 'Cargo', 'mass', false]];
const payload = (draft) => Object.fromEntries(FIELDS.map((key) => [key, draft[key]]));
const snapshot = (module) => structuredClone(Object.fromEntries(Object.entries(module).filter(([key]) => key !== '_source')));
const format = (value) => value == null ? '—' : Number(value.toFixed(2)).toLocaleString();

function template(catalog, hauler = false) {
  const modules = ['Cockpit', 'Hab', 'Reactor', 'Engine', 'Grav drive', 'Shield', 'Cargo', 'Fuel tank', 'Landing gear', 'Landing bay', 'Docker']
    .map((category) => ({ ...snapshot(catalog.find((m) => m.category === category)), count: category === 'Engine' ? (hauler ? 4 : 2) : category === 'Cargo' && hauler ? 5 : category === 'Landing gear' ? 4 : 1 }));
  return { name: hauler ? 'Constellation cargo tender' : 'Constellation survey cutter', modules, crew_limit: 3, jump_bonus: 0,
    notes: 'Original planning example using sourced base modules. Confirm module placement and flight checks in the game.' };
}

export default function ShipForge() {
  const [params, setParams] = useSearchParams();
  const records = useResource('/api/ship-blueprints?limit=200'); const catalog = useResource('/api/ship-blueprints/catalog');
  const [selected, setSelected] = useState(null); const [version, setVersion] = useState(0); const [dirty, setDirty] = useState(false);
  function choose(item, check = true) {
    if (check && dirty && !window.confirm('Discard unsaved changes to this blueprint?')) return;
    setSelected(item); setVersion((v) => v + 1); setDirty(false); setParams(item.id ? { id: item.id } : {});
  }
  return <><SectionHeader eyebrow="Fleet & Crew / Blueprint manager" title="Ship Forge">
    <Button variant="ghost" disabled={!catalog.data} onClick={() => choose(template(catalog.data.modules))}>Survey cutter template</Button>
    <Button variant="ghost" disabled={!catalog.data} onClick={() => choose(template(catalog.data.modules, true))}>Cargo tender template</Button>
    <Button onClick={() => choose({ name: 'New ship blueprint', modules: [], notes: '', crew_limit: 3, jump_bonus: 0 })}>New blueprint</Button>
  </SectionHeader>
    <ResourceState resource={catalog}><ResourceState resource={records}>{catalog.data && records.data && <>
      <div className="toolbar"><Select label="Open saved blueprint" value={selected?.id || params.get('id') || ''} onChange={(e) => {
        const item = records.data.find((r) => String(r.id) === e.target.value); if (item) choose(item);
      }}><option value="">{records.data.length ? 'Choose a saved blueprint' : 'Your first design starts with the survey cutter below'}</option>{records.data.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
        <span className="small muted">{catalog.data.modules.length} reference modules · custom measurements supported</span></div>
      <ForgeEditor key={version} initial={selected || records.data.find((r) => String(r.id) === params.get('id')) || template(catalog.data.modules)} catalog={catalog.data} records={records.data} onDirty={setDirty}
        onSaved={(item) => { records.reload(); choose(item, false); }} onDeleted={() => { records.reload(); choose(template(catalog.data.modules), false); }} />
    </>}</ResourceState></ResourceState>
  </>;
}

function ForgeEditor({ initial, catalog, records, onDirty, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(() => structuredClone(initial)); const [history, setHistory] = useState([]);
  const [category, setCategory] = useState('Reactor'); const [moduleId, setModuleId] = useState('');
  const [editing, setEditing] = useState(null); const [comparison, setComparison] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState(false);
  const analysis = usePlanAnalysis('/api/ship-blueprints/analyze', { modules: draft.modules, crew_limit: draft.crew_limit, jump_bonus: draft.jump_bonus });
  const options = catalog.modules.filter((m) => m.category === category);
  const selectedModule = options.find((m) => m.catalog_id === moduleId) || options[0];
  const other = records.find((r) => String(r.id) === comparison); const stats = analysis.data?.stats;
  function change(next) { setHistory((old) => [...old.slice(-29), draft]); setDraft(next); onDirty(true); setError(''); }
  async function save(copy = false) {
    if (!draft.name.trim()) { setError('Give this blueprint a name before saving.'); return; }
    setBusy(true); setError('');
    try { onSaved(await (draft.id && !copy ? api.update(draft.id, payload(draft)) : api.create(payload(draft)))); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api.remove(draft.id); onDeleted(); } catch (err) { setError(err.message); } finally { setBusy(false); setDeleting(false); }
  }
  return <div className="stack">
    <div className="tool-intro"><div><p className="eyebrow">FLEET BLUEPRINT & LOADOUT MANAGER</p><h2>Build for the journey ahead.</h2><p className="muted">Assemble a loadout, read its flight envelope and keep every refit on file.</p></div>
      <Tag>{draft.id ? (JSON.stringify(payload(draft)) === JSON.stringify(payload(initial)) ? 'Saved blueprint' : 'Unsaved changes') : 'Unsaved design / editable template'}</Tag></div>
    <div className="toolbar"><Input label="Blueprint name" maxLength="100" value={draft.name} onChange={(e) => change({ ...draft, name: e.target.value })} />
      <Button disabled={busy} onClick={() => save()}>Save blueprint</Button><Button variant="ghost" disabled={busy} onClick={() => save(true)}>Save a copy</Button>
      <Button variant="ghost" disabled={!history.length} onClick={() => { setDraft(history.at(-1)); setHistory(history.slice(0, -1)); onDirty(true); }}>Undo edit</Button></div>
    <Toast error message={error} />
    <div className="forge-layout"><Panel className="canvas-panel"><ShipSchematic modules={draft.modules} name={draft.name} reactorClass={analysis.data?.reactor_class} /></Panel>
      <Panel className="stack"><p className="eyebrow">Flight envelope / base loadout</p><h2>{draft.name}</h2>
        <ResourceState resource={analysis}><div className="ship-stats">{STATS.map(([key, label, unit, estimated]) => <div key={key} data-testid={`ship-stat-${key}`}><span>{label}{estimated && <small> · estimate</small>}</span><strong>{format(stats?.[key])} <small>{unit}</small></strong>
          {other && <small className="stat-comparison">{stats?.[key] == null || other.analysis.stats[key] == null ? 'Comparison unavailable' : `${stats[key] - other.analysis.stats[key] >= 0 ? '+' : ''}${format(stats[key] - other.analysis.stats[key])} vs ${other.name}`}</small>}
        </div>)}</div></ResourceState>
        <Select label="Compare with saved blueprint" value={comparison} onChange={(e) => setComparison(e.target.value)}><option value="">No comparison</option>{records.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
        <p className="small muted">Base stats use module snapshots. Mobility and jump range are planning estimates; top speed assumes full engine power.</p>
      </Panel></div>
    <div className="design-layout forge-workbench"><Panel className="stack"><div className="card-heading"><div><p className="eyebrow">Loadout manifest</p><h2>{draft.modules.reduce((s, m) => s + m.count, 0)} installed modules</h2></div><Tag>Saved stats survive catalog updates</Tag></div>
      <div className="module-manifest">{draft.modules.map((module, index) => <div className="module-row" key={index}>
        <div className={`module-badge category-${module.category.replaceAll(' ', '-').toLowerCase()}`}>{module.category === 'Reactor' ? '◈' : module.category === 'Engine' ? '»' : module.category === 'Grav drive' ? '◎' : '▦'}</div>
        <div><h3>{module.name}</h3><span className="small muted">{module.category} {module.ship_class && `· Class ${module.ship_class}`} · {format(module.stats.mass)} mass each · × {module.count}</span></div>
        <div className="actions"><Button variant="ghost" aria-label={`Edit module ${index + 1}: ${module.name}`} onClick={() => setEditing({ index, module })}>Edit</Button>
          <Button variant="ghost" aria-label={`Remove module ${index + 1}: ${module.name}`} onClick={() => change({ ...draft, modules: draft.modules.filter((_, i) => i !== index) })}>×</Button></div>
      </div>)}</div>
      {!draft.modules.length && <div className="design-prompt"><h3>Start with the heart of your ship.</h3><p>Add a reactor, then engines, a grav drive and living space. You can also open a ready-to-edit template above.</p></div>}
    </Panel>
      <div className="stack"><Panel className="stack"><p className="eyebrow">Module library</p><h2>Equip your vessel</h2>
        <Select label="Catalog category" value={category} onChange={(e) => setCategory(e.target.value)}>{catalog.categories.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select label="Ship module catalog" value={selectedModule?.catalog_id || ''} onChange={(e) => setModuleId(e.target.value)}>{!options.length && <option value="">Enter a custom module below</option>}{options.map((m) => <option key={m.catalog_id} value={m.catalog_id}>{m.name}{m.ship_class ? ` · ${m.ship_class}` : ''}</option>)}</Select>
        {selectedModule && <div className="module-preview"><strong>{selectedModule.name}</strong><span>{format(selectedModule.stats.mass)} mass · {format(selectedModule.stats.hull)} hull</span><a href={selectedModule._source.source_url} target="_blank" rel="noreferrer">Module source ↗</a></div>}
        <Button disabled={!selectedModule || draft.modules.length >= 100} onClick={() => change({ ...draft, modules: [...draft.modules, snapshot(selectedModule)] })}>Add catalog module</Button>
        <Button variant="ghost" disabled={draft.modules.length >= 100} onClick={() => setEditing({ index: -1, module: { name: '', category, ship_class: '', catalog_id: '', count: 1, stats: Object.fromEntries(catalog.stat_fields.map((key) => [key, ['mass', 'hull'].includes(key) ? null : 0])) } })}>+ Custom module</Button>
      </Panel><Panel className="stack"><p className="eyebrow">Design checks</p><h2>Flight readiness</h2>
        {analysis.data?.warnings.map((warning) => <p className="diagnostic shortage" key={warning}>{warning}</p>)}
        {analysis.data && !analysis.data.warnings.length && <p className="route-state ready">Basic loadout checks passed. Confirm geometry and landing thrust in the ship builder.</p>}
        <p className="small muted">Reactor power: {format(stats?.reactor_power)} · Engine demand: {format(stats?.engine_power)} / 12<br />Crew rating: {format(stats?.crew_rating)} · Stations: {format(stats?.crew_stations)}</p>
      </Panel></div></div>
    <Panel className="stack"><details><summary>Assumptions, provenance & blueprint notes</summary><div className="stack">
      <div className="two-column"><Input label="Crew command limit" type="number" min="0" max="100" step="1" value={draft.crew_limit} onChange={(e) => change({ ...draft, crew_limit: Math.max(0, Math.min(100, Math.floor(Number(e.target.value)))) })} />
        <Input label="Jump range bonus (%)" type="number" min="0" max="100" step="any" value={draft.jump_bonus} onChange={(e) => change({ ...draft, jump_bonus: Math.max(0, Math.min(100, Number(e.target.value))) })} /></div>
      <p className="small muted">{analysis.data?.method}</p><p className="small muted">Module facts and mobility formula: <a href="https://starfieldwiki.net/wiki/Starfield:Ship_Modules" target="_blank" rel="noreferrer">Starfield Wiki contributors (CC-BY-SA-4.0)</a>. Crew constraints: <a href="https://help.bethesda.net/app/answers/detail/a_id/61004/~/crew-management---starfield" target="_blank" rel="noreferrer">Bethesda</a>. Jump estimate: <a href="https://www.reddit.com/r/Starfield/comments/17w724e/" target="_blank" rel="noreferrer">AllensProject’s community measurements</a>; verify boundary jumps in game.</p>
      <TextArea label="Blueprint notes" value={draft.notes} maxLength="30000" onChange={(e) => change({ ...draft, notes: e.target.value })} />
      <div className="actions"><Button variant="ghost" onClick={() => downloadText('ship-blueprint.json', JSON.stringify(payload(draft), null, 2), 'application/json')}>Export blueprint JSON</Button>{draft.id && <Button variant="ghost" onClick={() => setDeleting(true)}>Delete saved blueprint</Button>}</div>
    </div></details></Panel>
    {editing && <ModuleForm initial={editing.module} categories={catalog.categories} onClose={() => setEditing(null)} onSave={(module) => { change({ ...draft, modules: editing.index < 0 ? [...draft.modules, module] : draft.modules.map((m, index) => index === editing.index ? module : m) }); setEditing(null); }} />}
    {deleting && <Modal title="Delete this saved blueprint?" onClose={() => setDeleting(false)}><p>This removes the blueprint from your design archive. Crew assignments and ships remain available.</p><Button disabled={busy} onClick={remove}>Delete blueprint permanently</Button></Modal>}
  </div>;
}
