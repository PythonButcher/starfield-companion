import { useState } from 'react';
import { crew } from '../api/crew';
import { query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { dispatch } from '../cosmodrag/cosmoDragDispatcher';
import CrewCard from '../components/CrewCard';
import { Panel, Button, Input, TextArea, Select, Modal, Tag, Toast, SectionHeader, EmptyState, ResourceState, Pagination } from '../components/ui';
const blank = { name: '', role: 'Crew', faction: 'Independent', is_companion: false, skills: [], traits: [], assigned_ship: '', assigned_outpost: '', affinity: 'Unknown', notes: '', portrait_url: '' };

export default function Crew() {
  const [filters, setFilters] = useState({ q: '', skill: '', assignment: '' }); const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState(null); const [ship, setShip] = useState('The Frontier'); const [outpost, setOutpost] = useState('Luna Extraction Post');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const resource = useResource(crew.path + query({ ...filters, limit: 12, offset }));
  const fleet = useResource('/api/ships' + query({ roster: resource.key }));
  function filter(key, value) { setFilters((old) => ({ ...old, [key]: value })); setOffset(0); }
  async function assign(id, target) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const member = await dispatch({ type: 'crew', id }, { target, name: target === 'ship' ? ship : outpost });
      setMessage(member.name + (target === 'unassigned' ? ' is now unassigned.' : ' assigned to ' + (target === 'ship' ? ship : outpost) + '.'));
      resource.reload();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <><SectionHeader eyebrow="03 / Personnel & assignments" title="Fleet & Crew"><Button onClick={() => setEditor(blank)}>+ Add crew</Button></SectionHeader><Toast message={message} /><Toast message={error} error />
    <ResourceState resource={fleet}>{fleet.data?.length > 0 && <div className="grid-cards mb-6">{fleet.data.map((vessel) => <Panel key={vessel.id} className="home-ship stack"><p className="eyebrow">{vessel.home_ship ? "Home ship / Constellation" : "Fleet registry"}</p><h2>{vessel.name}</h2><p>{vessel.crew.map((member) => member.name).join(" · ") || "Awaiting crew assignment"}</p><p className="small muted">{vessel.notes}</p></Panel>)}</div>}</ResourceState>
    <div className="two-column mb-6">{[['ship', ship, setShip], ['outpost', outpost, setOutpost]].map(([target, name, setter]) => <Panel key={target} className="stack assignment-zone" onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-starfield-crew')) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); assign(Number(e.dataTransfer.getData('application/x-starfield-crew')), target); }}><p className="eyebrow">{target} assignment</p><Input label={target === 'ship' ? 'Target ship' : 'Target outpost'} maxLength={100} value={name} onChange={(e) => setter(e.target.value)} /><p className="small muted">Drop a crew card here, or use its {target} button.</p><div>{resource.data?.filter((member) => member['assigned_' + target] === name).map((member) => <Tag key={member.id}>{member.name}</Tag>)}</div><p className="small muted">Assigned names shown from the displayed roster.</p></Panel>)}</div>
    <div className="toolbar"><Input label="Search crew" value={filters.q} onChange={(e) => filter('q', e.target.value)} /><Input label="Skill filter" value={filters.skill} onChange={(e) => filter('skill', e.target.value)} /><Select label="Assignment filter" value={filters.assignment} onChange={(e) => filter('assignment', e.target.value)}><option value="">All assignments</option><option value="ship">Ship</option><option value="outpost">Outpost</option><option value="unassigned">Unassigned</option></Select></div>
    <ResourceState resource={resource}>{resource.data?.length ? <><div className="grid-cards">{resource.data.map((member) => <CrewCard key={member.id} member={member} onEdit={setEditor} onAssign={assign} busy={busy} />)}</div><Pagination offset={offset} total={resource.total} onChange={setOffset} /></> : <EmptyState title="No crew match this roster">Change filters or add a recruit.</EmptyState>}</ResourceState>
    <Optimizer />
    {editor && <CrewEditor initial={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} />}
  </>;
}
function CrewEditor({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(Object.keys(blank).map((key) => [key, initial[key] ?? blank[key]])));
  const [traits, setTraits] = useState(initial.traits.join(', '));
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  function change(key, value) { setDraft((old) => ({ ...old, [key]: value })); }
  function skill(index, key, value) { change('skills', draft.skills.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = { ...draft, traits: traits.split(',').map((item) => item.trim()).filter(Boolean) };
      if (initial.id) await crew.update(initial.id, data); else await crew.create(data);
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await crew.remove(initial.id); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return <Modal title={initial.id ? 'Edit crew member' : 'Add crew member'} onClose={onClose}><form className="stack" onSubmit={save}><Toast message={error} error /><div className="form-grid">{['name', 'role', 'faction', 'affinity'].map((key) => <Input key={key} label={key} required={key === 'name'} maxLength={100} value={draft[key]} onChange={(e) => change(key, e.target.value)} />)}</div><label><input type="checkbox" checked={draft.is_companion} onChange={(e) => change('is_companion', e.target.checked)} /> Field companion</label><div className="stack"><h3>Skills & ranks</h3>{draft.skills.map((item, index) => <div className="actions items-end" key={index}><Input label={'Skill ' + (index + 1)} required maxLength={100} value={item.name} onChange={(e) => skill(index, 'name', e.target.value)} /><Select label={'Rank ' + (index + 1)} value={item.rank} onChange={(e) => skill(index, 'rank', Number(e.target.value))}>{[1, 2, 3, 4].map((rank) => <option key={rank}>{rank}</option>)}</Select><Button variant="ghost" onClick={() => change('skills', draft.skills.filter((_, i) => i !== index))} aria-label={'Remove skill ' + (index + 1)}>×</Button></div>)}<Button variant="ghost" disabled={draft.skills.length >= 30} onClick={() => change('skills', [...draft.skills, { name: '', rank: 1 }])}>Add skill</Button></div><Input label="Traits (comma separated)" value={traits} onChange={(e) => setTraits(e.target.value)} /><TextArea label="Crew notes" maxLength={30000} value={draft.notes} onChange={(e) => change('notes', e.target.value)} /><p className="small muted">Assignments are managed on the roster board. Portraits use initials.</p><div className="actions"><Button type="submit" disabled={busy}>Save crew</Button>{initial.id && <Button variant="danger" onClick={() => setConfirm(true)}>Delete crew</Button>}</div>{confirm && <div className="notice error"><p>Remove {initial.name} from your roster?</p><Button variant="danger" disabled={busy} onClick={remove}>Confirm delete crew</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Keep crew</Button></div>}{initial._sources?.map((url) => <a className="small" key={url} href={url} target="_blank" rel="noreferrer">Skill reference ↗</a>)}</form></Modal>;
}
function Optimizer() {
  const [goal, setGoal] = useState('ship'); const [slots, setSlots] = useState(3); const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function optimize(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await crew.optimize({ goal, slots })); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <Panel className="stack mt-8"><p className="eyebrow">Mission planning</p><h2>Crew optimizer</h2><form onSubmit={optimize} className="toolbar"><Select label="Optimization goal" value={goal} onChange={(e) => setGoal(e.target.value)}>{['ship', 'outpost', 'combat'].map((value) => <option key={value}>{value}</option>)}</Select><Input label="Available slots" type="number" min="1" max="20" required value={slots} onChange={(e) => setSlots(e.target.value)} /><Button disabled={busy} type="submit">{busy ? 'Calculating…' : 'Optimize crew'}</Button></form><Toast message={error} error />{result && <div className="stack"><p>{result.method}</p>{result.selected.length ? result.selected.map((row) => <div key={row.member.id}><div className="card-heading"><h3>{row.member.name}</h3><Tag>{row.score} points</Tag></div><p className="small muted">{row.reasons.map((reason) => reason.skill + ' ' + reason.rank + ' × ' + reason.weight).join(' + ')}</p></div>) : <EmptyState title="No relevant skills in this roster" />}<p className="small muted">{result.limitations}</p></div>}</Panel>;
}
