import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { crud, query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { readStorage, writeStorage } from '../utils/storage';
import { Panel, Input, Select, TextArea, Button, Modal, SectionHeader, ResourceState, Toast, EmptyState, Tag } from '../components/ui';

const api = crud('/api/missions');
const factions = ['Independent', 'Constellation', 'UC Vanguard', 'Freestar', 'Ryujin', 'Crimson Fleet'];
const blank = { title: '', faction: 'Independent', category: 'Personal', status: 'Active', priority: 'Medium', target_planet_id: null, target_system: '', notes: '', checklist: [], linked_log_ids: [] };

export default function Missions() {
  const [params] = useSearchParams();
  const [faction, setFaction] = useState(''); const [status, setStatus] = useState('');
  const [spoilers, setSpoilers] = useState(() => readStorage('starfield:spoiler-safe', true));
  const [editor, setEditor] = useState(null); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const resource = useResource('/api/missions' + query({ faction, status, planet_id: params.get('planet_id'), limit: 200 }));
  async function check(item, id, done) {
    setBusy(true); setError('');
    try { await api.update(item.id, { checklist: item.checklist.map((s) => s.id === id ? { ...s, done } : s) }); resource.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <><SectionHeader eyebrow="Command / Player objectives" title="Mission Command"><Button onClick={() => setEditor(blank)}>New mission</Button></SectionHeader>
    <div className="toolbar"><Select label="Mission faction filter" value={faction} onChange={(e) => setFaction(e.target.value)}>
      <option value="">All factions</option>{factions.map((f) => <option key={f}>{f}</option>)}
    </Select><Select label="Mission status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
      <option value="">All statuses</option>{['Active', 'Paused', 'Completed'].map((s) => <option key={s}>{s}</option>)}
    </Select><label><input type="checkbox" checked={spoilers} onChange={(e) => { setSpoilers(e.target.checked); writeStorage('starfield:spoiler-safe', e.target.checked); }} /> Spoiler-safe: hide mission notes</label></div>
    <Toast error message={error} /><ResourceState resource={resource}>
      {resource.data?.length ? <div className="grid-cards">{resource.data.map((item) =>
        <Panel key={item.id} className="stack" id={'mission-' + item.id}><h2>{item.title}</h2><div><Tag>{item.faction}</Tag><Tag>{item.status}</Tag><Tag>{item.priority}</Tag></div>
          <p className="small muted">{item.target_system || 'No target system'}</p>
          {!spoilers && <p className="prose-text">{item.notes}</p>}
          {item.checklist.map((step) => <label key={step.id} className="mission-step"><input type="checkbox" disabled={busy} checked={step.done} onChange={(e) => check(item, step.id, e.target.checked)} /> {step.text}</label>)}
          <p className="small muted">{item.checklist.filter((s) => s.done).length}/{item.checklist.length} steps complete</p>
          <div className="actions"><Button variant="ghost" onClick={() => setEditor(item)}>Edit mission</Button>
            <Link to={'/journal/new?' + new URLSearchParams({ title: item.title, planet: item.target_planet_name || "", system: item.target_system, mission_id: item.id, ...(item.target_planet_id ? { planet_id: item.target_planet_id } : {}) })}>Log Entry for Mission</Link>
          </div>{item.linked_log_ids.map((id) => <Link key={id} to={'/journal/' + id}>Linked log #{id}</Link>)}
        </Panel>)}</div> : <EmptyState title="No missions on this channel">Record a personal goal without importing story spoilers.</EmptyState>}
    </ResourceState>
    {editor && <MissionEditor key={editor.id || 'new'} initial={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.reload(); }} />}
  </>;
}

function MissionEditor({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const planets = useResource('/api/planets?limit=200');
  const logs = useResource('/api/logs?limit=200');
  function change(key, value) { setDraft((old) => ({ ...old, [key]: value })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = Object.fromEntries(Object.keys(blank).map((key) => [key, draft[key]]));
      if (draft.id) await api.update(draft.id, data); else await api.create(data);
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await api.remove(draft.id); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return <Modal title={draft.id ? 'Edit mission' : 'New mission'} onClose={onClose}><form className="stack" onSubmit={save}>
    <Toast error message={error} /><Input label="Mission title" required maxLength={100} value={draft.title} onChange={(e) => change('title', e.target.value)} />
    <div className="form-grid">{Object.entries({ faction: factions, category: ['Personal', 'Main', 'Faction', 'Survey', 'Outpost'], status: ['Active', 'Paused', 'Completed'], priority: ['High', 'Medium', 'Low'] }).map(([key, choices]) =>
      <Select key={key} label={'Mission ' + key} value={draft[key]} onChange={(e) => change(key, e.target.value)}>{choices.map((s) => <option key={s}>{s}</option>)}</Select>)}
      <ResourceState resource={planets}><Select label="Mission target planet" value={draft.target_planet_id || ''} onChange={(e) => {
        const id = Number(e.target.value) || null; const planet = planets.data?.find((p) => p.id === id);
        setDraft((old) => ({ ...old, target_planet_id: id, target_system: planet?.system_name || old.target_system }));
      }}><option value="">No planet</option>{planets.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></ResourceState>
      <Input label="Mission target system" value={draft.target_system} onChange={(e) => change('target_system', e.target.value)} />
    </div>
    <TextArea label="Mission notes (hidden in spoiler-safe mode)" value={draft.notes} onChange={(e) => change('notes', e.target.value)} />
    <h3>Checklist</h3>{draft.checklist.map((step, i) => <div className="toolbar" key={step.id}>
      <Input label={'Step ' + (i + 1)} value={step.text} required maxLength={500} onChange={(e) => change('checklist', draft.checklist.map((s) => s.id === step.id ? { ...s, text: e.target.value } : s))} />
      <Button variant="ghost" onClick={() => change('checklist', draft.checklist.filter((s) => s.id !== step.id))}>Remove step {i + 1}</Button>
    </div>)}<Button variant="ghost" onClick={() => change('checklist', [...draft.checklist, { id: crypto.randomUUID(), text: '', done: false }])}>Add checklist step</Button>
    <ResourceState resource={logs}><details><summary>Link journal entries</summary>{logs.data?.map((log) =>
      <label className="mission-step" key={log.id}><input type="checkbox" checked={draft.linked_log_ids.includes(log.id)} onChange={(e) => change('linked_log_ids', e.target.checked ? [...draft.linked_log_ids, log.id] : draft.linked_log_ids.filter((id) => id !== log.id))} /> {log.title}</label>)}</details></ResourceState>
    <div className="actions"><Button type="submit" disabled={busy}>Save mission</Button>{draft.id && <Button variant="danger" onClick={() => setConfirm(true)}>Delete mission</Button>}</div>
    {confirm && <div className="notice error"><p>Delete this objective?</p><Button disabled={busy} variant="danger" onClick={remove}>Confirm delete mission</Button></div>}
  </form></Modal>;
}
