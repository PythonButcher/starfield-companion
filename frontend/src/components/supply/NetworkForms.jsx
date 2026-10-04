import { useState } from 'react';
import { Button, Input, Select, Modal, Toast } from '../ui';

function Rates({ rows, onChange, label }) {
  return <fieldset className="stack"><legend>{label}</legend>{rows.map((row, index) => <div className="rate-row" key={index}>
    <Input label={`Resource ${index + 1}`} required maxLength="100" value={row.resource} onChange={(e) => onChange(rows.map((r, i) => i === index ? { ...r, resource: e.target.value } : r))} />
    <Input label={`Units/min ${index + 1}`} type="number" min="0" max="1000000" step="any" placeholder="Unknown" value={row.rate ?? ''} onChange={(e) => onChange(rows.map((r, i) => i === index ? { ...r, rate: e.target.value === '' ? null : Number(e.target.value) } : r))} />
    <Button variant="ghost" aria-label={`Remove resource ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>×</Button>
  </div>)}<Button variant="ghost" disabled={rows.length >= 30} onClick={() => onChange([...rows, { resource: '', rate: null }])}>Add resource</Button></fieldset>;
}

export function NodeForm({ initial, outposts, onClose, onSave }) {
  const [node, setNode] = useState(initial);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (key, value) => setNode((old) => ({ ...old, [key]: value }));
  return <Modal title={initial.name ? 'Edit network site' : 'Place an outpost'} onClose={onClose}><form className="stack" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await onSave(node); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }}>
    <Select label="Site source" value={node.outpost_id ?? ''} onChange={(e) => {
      const outpost = outposts.find((o) => o.id === Number(e.target.value));
      setNode((old) => ({ ...old, outpost_id: outpost?.id || null, name: outpost?.name || old.name }));
    }}><option value="">Planned site / measured supply</option>{outposts.map((outpost) => <option key={outpost.id} value={outpost.id}>{outpost.name}</option>)}
      {node.outpost_id && !outposts.some((o) => o.id === node.outpost_id) && <option value={node.outpost_id}>Deleted outpost — relink this site</option>}
    </Select>
    <Input label="Site name" value={node.name} required maxLength="100" onChange={(e) => set('name', e.target.value)} />
    {node.outpost_id ? <p className="muted small">System, production and power come from the saved Outpost Planner. Measured extraction rates there update this network automatically.</p> : <>
      <Input label="Star system" value={node.system} required maxLength="100" placeholder="Sol" onChange={(e) => set('system', e.target.value)} />
      <Rates rows={node.production} onChange={(value) => set('production', value)} label="Measured local supply" />
      <p className="muted small">Use the same units per minute for supply, cargo and fuel. Leave an unmeasured rate blank.</p>
    </>}
    <Toast error message={error} /><Button type="submit" disabled={busy}>Place site</Button>
  </form></Modal>;
}

export function RouteForm({ initial, nodes, onClose, onSave }) {
  const [route, setRoute] = useState(initial);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (key, value) => setRoute((old) => ({ ...old, [key]: value }));
  return <Modal title="Configure cargo route" onClose={onClose}><form className="stack" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await onSave(route); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }}>
    <div className="two-column"><Select label="Origin site" value={route.source} required onChange={(e) => setRoute({ ...route, source: e.target.value, target: e.target.value === route.target ? '' : route.target, fuel_node_id: e.target.value })}><option value="">Choose origin</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</Select>
      <Select label="Destination site" value={route.target} required onChange={(e) => setRoute({ ...route, target: e.target.value, fuel_node_id: route.fuel_node_id === route.target ? e.target.value : route.fuel_node_id })}><option value="">Choose destination</option>{nodes.filter((n) => n.id !== route.source).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</Select></div>
    <Select label="Cargo link type" value={route.kind} onChange={(e) => set('kind', e.target.value)}><option value="local">Local — same system</option><option value="inter-system">Inter-system — requires Helium-3</option></Select>
    <Rates rows={route.resources} onChange={(value) => set('resources', value)} label="Cargo manifest" />
    {route.kind === 'inter-system' && <div className="two-column"><Select label="Helium-3 fuel endpoint" value={route.fuel_node_id} required onChange={(e) => set('fuel_node_id', e.target.value)}><option value="">Choose fuel site</option>{nodes.filter((n) => [route.source, route.target].includes(n.id)).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</Select>
      <Input label="Measured fuel use / min" type="number" min="0" max="1000000" step="any" placeholder="Unknown" value={route.fuel_rate ?? ''} onChange={(e) => set('fuel_rate', e.target.value === '' ? null : Number(e.target.value))} /></div>}
    <label className="check"><input type="checkbox" checked={route.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Route enabled</label>
    <p className="muted small">Each route needs a cargo-link depot at both sites. Fuel is budgeted at one endpoint; measured rates are planning assumptions.</p>
    <Toast error message={error} /><Button type="submit" disabled={busy}>Apply route</Button>
  </form></Modal>;
}
