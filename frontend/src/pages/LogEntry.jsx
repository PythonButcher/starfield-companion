import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { logs } from '../api/logs';
import { ai } from '../api/ai';
import { useResource } from '../hooks/useResource';
import { readStorage, writeStorage } from '../utils/storage';
import { Panel, Button, Input, TextArea, Select, SectionHeader, ResourceState, Toast, Tag } from '../components/ui';
const empty = { title: '', planet_name: '', system_name: '', location: '', mood: '', log_type: 'Exploration', raw_notes: '', ai_narrative: '', tags: [], planet_id: null };
const fields = Object.keys(empty);
export default function LogEntry() {
  const { id } = useParams(); const [params] = useSearchParams();
  if (id) return <ExistingEditor key={id} id={id} />;
  return <Editor key={params.toString()} draftContext={params.toString()} missionId={params.get("mission_id")} initial={{ ...empty, title: params.get("title") || "", planet_name: params.get('planet') || '', system_name: params.get('system') || '', planet_id: params.get('planet_id') ? Number(params.get('planet_id')) : null }} />;
}
function ExistingEditor({ id }) {
  const resource = useResource(logs.path + '/' + id);
  return <ResourceState resource={resource}>{resource.data && <Editor key={id} initial={resource.data} id={id} />}</ResourceState>;
}
function Editor({ initial, id, missionId, draftContext }) {
  const navigate = useNavigate(); const saved = useRef(false);
  const draftKey = 'starfield:log-draft:' + (id || (missionId ? 'mission-' + missionId : draftContext ? 'new:' + draftContext : 'new'));
  const [draft, setDraft] = useState(() => readStorage(draftKey, null) || Object.fromEntries(fields.map((key) => [key, initial[key] ?? empty[key]])));
  const [tagsText, setTagsText] = useState(() => draft.tags.join(', '));
  const [candidate, setCandidate] = useState(''); const [aiInfo, setAiInfo] = useState(null);
  const [tone, setTone] = useState('stoic'); const [length, setLength] = useState('medium');
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [draftSaved, setDraftSaved] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { if (!saved.current) setDraftSaved(writeStorage(draftKey, draft)); }, 400);
    return () => clearTimeout(timer);
  }, [draft, draftKey]);
  const update = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  async function generate() {
    setBusy('generate'); setError('');
    try {
      const result = await ai.narrative({ title: draft.title, planet_name: draft.planet_name, raw_notes: draft.raw_notes, tone, length });
      setCandidate(result.narrative); setAiInfo(result);
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  }
  async function save(event) {
    event.preventDefault(); setBusy('save'); setError('');
    try {
      const body = { ...draft, tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean) };
      const result = id ? await logs.update(id, body) : await logs.create({ ...body, ...(missionId ? { mission_id: Number(missionId) } : {}) });
      saved.current = true;
      try { localStorage.removeItem(draftKey); } catch { /* Server save still succeeded. */ }
      navigate('/journal/' + result.id);
    } catch (err) { setError(err.message); setBusy(''); }
  }
  return <><SectionHeader eyebrow="Captain’s Logs / Recording station" title={id ? 'Revise expedition log' : 'Begin a new entry'}><Link className="button button-ghost" to="/journal">Back to archive</Link></SectionHeader><Toast message={error} error /><form onSubmit={save} className="stack"><Panel className="stack"><div className="form-grid"><Input label="Title" required maxLength={100} value={draft.title} onChange={(e) => update('title', e.target.value)} /><Select label="Log type" value={draft.log_type} onChange={(e) => update('log_type', e.target.value)}>{['Exploration', 'Combat', 'Trade', 'Faction', 'Personal'].map((item) => <option key={item}>{item}</option>)}</Select><Input label="Planet" maxLength={100} value={draft.planet_name} onChange={(e) => update('planet_name', e.target.value)} /><Input label="System" maxLength={100} value={draft.system_name} onChange={(e) => update('system_name', e.target.value)} /><Input label="Location" maxLength={200} value={draft.location} onChange={(e) => update('location', e.target.value)} /><Input label="Mood" maxLength={100} value={draft.mood} onChange={(e) => update('mood', e.target.value)} /></div><Input label="Tags (comma separated)" value={tagsText} onChange={(e) => { setTagsText(e.target.value); update('tags', e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean)); }} /></Panel>
    <div className="two-column"><Panel className="stack"><p className="eyebrow">01 / Field observations</p><TextArea label="Raw notes" rows={12} maxLength={30000} placeholder="What happened out there, Captain?" value={draft.raw_notes} onChange={(e) => update('raw_notes', e.target.value)} /><div className="form-grid"><Select label="Narrative tone" value={tone} onChange={(e) => setTone(e.target.value)}>{['stoic', 'dramatic', 'noir', 'scientific'].map((item) => <option key={item}>{item}</option>)}</Select><Select label="Length" value={length} onChange={(e) => setLength(e.target.value)}>{['short', 'medium', 'long'].map((item) => <option key={item}>{item}</option>)}</Select></div><Button variant="ghost" disabled={!!busy || !draft.raw_notes.trim()} onClick={generate}>{busy === 'generate' ? 'Composing…' : candidate ? 'Regenerate Captain’s Log' : 'Generate Captain’s Log'}</Button><p className="small muted">AI accepts up to 10,000 characters per request. Review generated text before accepting.</p></Panel>
    <Panel className="stack"><p className="eyebrow">02 / Captain’s narrative</p>{candidate ? <><Tag>{aiInfo?.mode} / {aiInfo?.model}</Tag><TextArea label="Generated draft — review and edit" rows={12} value={candidate} onChange={(e) => setCandidate(e.target.value)} /><div className="actions"><Button onClick={() => { update('ai_narrative', candidate); setCandidate(''); }}>Accept narrative</Button><Button variant="ghost" onClick={() => setCandidate('')}>Discard draft</Button></div></> : <TextArea label="Accepted narrative" rows={16} maxLength={30000} placeholder="Generate a draft, or write in your own voice." value={draft.ai_narrative} onChange={(e) => update('ai_narrative', e.target.value)} />}</Panel></div>
    <div className="actions"><Button type="submit" disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save log'}</Button><span className="small muted">{draftSaved ? 'Draft stored on this device.' : 'Device storage unavailable. Save to preserve your work.'}{candidate && ' Unaccepted generated text will not be saved.'}</span></div></form></>;
}
