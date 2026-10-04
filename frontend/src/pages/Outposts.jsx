import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { crud, request } from '../api/client';
import { useResource } from '../hooks/useResource';
import { downloadText } from '../utils/storage';
import { Panel, Button, Input, Select, TextArea, SectionHeader, ResourceState, EmptyState, Toast } from '../components/ui';

const api = crud('/api/outposts');
const blank = { name: '', planet_id: null, modules: [], notes: '', environment: { solar_factor: 1, wind_factor: 1, fuel_available: false }, stored_mass: 0 };

export default function Outposts() {
  const [params] = useSearchParams();
  const records = useResource('/api/outposts?limit=200');
  const modules = useResource('/api/outposts/modules?limit=200');
  const planets = useResource('/api/planets?limit=200');
  const [editing, setEditing] = useState(params.get('id') ? null : { ...blank, planet_id: Number(params.get('planet_id')) || null });
  const [version, setVersion] = useState(0);
  function select(item) {
    setEditing(item); setVersion((v) => v + 1);
  }
  return <><SectionHeader eyebrow="Industry / Power & logistics" title="Outpost Planner">
    <Link to="/logistics/portfolio">Resource portfolio ↗</Link>
    <Link to="/logistics/supply-network">Supply Chain Visualizer ↗</Link>
    <Button onClick={() => select(blank)}>New plan</Button>
  </SectionHeader>
    <ResourceState resource={modules}><ResourceState resource={planets}>
      {modules.data && planets.data && !records.loading && <Planner key={version} initial={editing || records.data?.find((r) => String(r.id) === params.get('id')) || blank} modules={modules.data} planets={planets.data}
        onSaved={(item) => { records.reload(); select(item); }} />}
    </ResourceState></ResourceState>
    <h2 className="mt-8 mb-4">Saved outposts</h2>
    <ResourceState resource={records}>
      {records.data?.length ? <div className="grid-cards">{records.data.map((item) =>
        <Panel key={item.id} className="stack"><h3>{item.name}</h3><p>{item.planet_name}</p>
          <p className={item.analysis.net_power < 0 ? 'text-warning-red' : 'text-success'}>Net power: {item.analysis.net_power}</p>
          <Button variant="ghost" onClick={() => select(item)}>Edit {item.name}</Button>
        </Panel>)}</div> : <EmptyState title="No outposts planned">Choose a world and assemble its supply manifest.</EmptyState>}
    </ResourceState>
  </>;
}

function Planner({ initial, modules, planets, onSaved }) {
  const [draft, setDraft] = useState(() => ({ ...blank, ...initial }));
  const [selected, setSelected] = useState(modules[0]?.id || '');
  const [analysis, setAnalysis] = useState(null); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [calculationError, setCalculationError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const references = Object.fromEntries(modules.map((m) => [m.id, m]));
  function change(key, value) { setDraft((old) => ({ ...old, [key]: value })); }
  function row(index, key, value) { change('modules', draft.modules.map((m, i) => i === index ? { ...m, [key]: value } : m)); }
  const payload = JSON.stringify(Object.fromEntries(Object.keys(blank).map((key) => [key, draft[key]])));
  useEffect(() => {
    // A new, unnamed draft is not ready for the server's required-name validation.
    if (!JSON.parse(payload).name.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      request('/api/outposts/plan', { method: 'POST', body: JSON.parse(payload), signal: controller.signal })
        .then((data) => { setAnalysis({ key: payload, data }); setCalculationError(''); })
        .catch((err) => { if (err.name !== 'AbortError') setCalculationError(err.message); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [payload]);
  const result = analysis?.key === payload ? analysis.data : null;
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setShowValidation(true);
    try { onSaved(draft.id ? await api.update(draft.id, JSON.parse(payload)) : await api.create(JSON.parse(payload))); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api.remove(draft.id); onSaved(blank); } catch (err) { setError(err.message); setBusy(false); }
  }
  return <form className="stack" onSubmit={save} onBlurCapture={() => setShowValidation(true)} onChange={() => setShowValidation(false)}>
    <Toast error message={error || (showValidation && draft.name.trim() ? calculationError : '')} />
    <div className="form-grid">
      <Input label="Outpost name" value={draft.name} maxLength={100} required onChange={(e) => change('name', e.target.value)} />
      <Select label="Outpost planet" value={draft.planet_id || ''} onChange={(e) => change('planet_id', Number(e.target.value) || null)}>
        <option value="">Unlinked world</option>{planets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
    </div>
    <Panel className="stack"><h2>Atmospheric & Orbital Calibration</h2><p className="small muted">Calibrate output against your surface readings. Divide in-game power by reference power; 1 uses the catalog baseline. Storage and extraction rates await field measurements.</p>
      <div className="form-grid">{['solar_factor', 'wind_factor'].map((key) =>
        <Input key={key} label={key.replace('_', ' ')} type="number" min="0" max="10" step="any" value={draft.environment[key] ?? 1}
          onChange={(e) => change('environment', { ...draft.environment, [key]: Number(e.target.value) })} />)}
        <Input label="Stored cargo mass" type="number" min="0" value={draft.stored_mass} onChange={(e) => change('stored_mass', Number(e.target.value))} />
      </div><label><input type="checkbox" checked={draft.environment.fuel_available || false}
        onChange={(e) => change('environment', { ...draft.environment, fuel_available: e.target.checked })} /> He-3 supply connected</label>
    </Panel>
    <div className="toolbar"><Select label="Module catalog" value={selected} onChange={(e) => setSelected(e.target.value)}>
      {['Extractors', 'Power', 'Storage', 'Builders'].map((category) => <optgroup key={category} label={category}>
        {modules.filter((m) => m.category === category).map((m) => <option key={m.id} value={m.id}>{m.name} ({m.power} power)</option>)}
      </optgroup>)}
    </Select><Button variant="ghost" onClick={() => change('modules', [...draft.modules, { module_id: selected, count: 1, resource: '', rate_per_minute: null, capacity: null }])}>Add module</Button></div>
    {draft.modules.map((m, i) => {
      const ref = references[m.module_id]; const planet = planets.find((p) => p.id === draft.planet_id);
      return <Panel key={i} className="stack"><div className="card-heading"><h3>{ref?.name || 'Unavailable module'}</h3><Button variant="ghost" onClick={() => change('modules', draft.modules.filter((_, j) => j !== i))}>Remove module {i + 1}</Button></div>
        <div className="form-grid"><Input label={'Module ' + (i + 1) + ' quantity'} type="number" min="1" max="1000" value={m.count} onChange={(e) => row(i, 'count', Number(e.target.value))} />
          {ref?.category === 'Extractors' && <><Select label={'Module ' + (i + 1) + ' resource'} value={m.resource} onChange={(e) => row(i, 'resource', e.target.value)}>
            <option value="">Choose deposit</option>{planet?.resources.map((r) => <option key={r.id}>{r.name}</option>)}
          </Select><Input label={'Module ' + (i + 1) + ' measured units/min'} type="number" min="0" step=".01" value={m.rate_per_minute ?? ''} onChange={(e) => row(i, 'rate_per_minute', e.target.value === '' ? null : Number(e.target.value))} /></>}
          {ref?.category === 'Storage' && <Input label={'Module ' + (i + 1) + ' measured capacity'} type="number" min="0" value={m.capacity ?? ''} onChange={(e) => row(i, 'capacity', e.target.value === '' ? null : Number(e.target.value))} />}
        </div>
      </Panel>;
    })}
    <Panel className="stack" aria-live="polite"><h2>Power balance</h2>
      {!result ? <p>{draft.name.trim() ? 'Calculating plan…' : 'Name your outpost to begin power calibration.'}</p> : <>
        <p className={result.net_power < 0 ? 'notice error' : 'notice'}>{result.generation} generated − {result.consumption} required = <strong>{result.net_power} net power</strong></p>
        <progress aria-label="Power supplied" max={Math.max(result.consumption, result.generation, 1)} value={result.generation} />
        <p>Storage: {result.storage_capacity ?? 'Unknown'} / stored {draft.stored_mass}{result.storage_overflow && ' — OVER CAPACITY'}</p>
        {Object.entries(result.rates_per_minute).map(([name, value]) => <p key={name}>{name}: {value ?? 'Unknown'} units/min</p>)}
        {result.warnings.map((warning) => <p className="small muted" key={warning}>{warning}</p>)}
        <details><summary>Shopping list</summary>{Object.entries(result.shopping_list).map(([name, qty]) => <p key={name}>{name}: {qty}</p>)}</details>
        <Button variant="ghost" onClick={() => downloadText('outpost-shopping-list.txt', Object.entries(result.shopping_list).map(([name, qty]) => name + ': ' + qty).join('\n'))}>Export Shopping List</Button>
      </>}
    </Panel>
    <TextArea label="Outpost notes" value={draft.notes} onChange={(e) => change('notes', e.target.value)} />
    <div className="actions"><Button type="submit" disabled={busy}>Save Plan</Button>
      {draft.id && <Button variant="danger" disabled={busy} onClick={() => setConfirm(true)}>Delete plan</Button>}</div>
    {confirm && <div className="notice error"><p>Delete this saved plan?</p><Button variant="danger" disabled={busy} onClick={remove}>Confirm delete plan</Button></div>}
  </form>;
}
