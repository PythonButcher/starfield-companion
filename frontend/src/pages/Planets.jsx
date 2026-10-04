import MediaArchive, { AttachmentDrop } from '../components/MediaArchive';
import { useEffect, useState } from 'react';
import PlanetSurvey from '../components/PlanetSurvey';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { planets } from '../api/planets';
import { ai } from '../api/ai';
import { query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { useSelectedSystems } from '../context/systems';
import { Panel, Button, Input, TextArea, Modal, Tag, StatBar, Toast, ResourceState, EmptyState, Pagination } from '../components/ui';

const split = (text) => text.split(',').map((item) => item.trim()).filter(Boolean);
const blank = { name: '', system_name: '', type: 'Rock', gravity: null, temperature: 'Unknown', atmosphere: 'Unknown', magnetosphere: 'Unknown', water: 'Unknown', biomes: [], planetary_traits: [], resources: [], flora: null, fauna: null, hazards: [], user_notes: '', surveyed_percent: 0, favorite: false, outpost_candidate: false, approximate: true };

export default function Planets() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const { systems, selectSystem } = useSelectedSystems();
  const [filters, setFilters] = useState({ q: params.get('q') || '', system: params.get('system') || '', resource: params.get('resource') || '', hazard: '', min_gravity: '', max_gravity: '' });
  const [offset, setOffset] = useState(0); const [detail, setDetail] = useState(null); const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const resource = useResource(planets.path + query({ ...filters, limit: 12, offset }));
  const selectedPlanetId = params.get('planet_id');
  useEffect(() => {
    if (!selectedPlanetId) return;
    let active = true;
    planets.get(selectedPlanetId).then((planet) => { if (active) setDetail(planet); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [selectedPlanetId]);
  function filter(key, value) { setFilters((old) => ({ ...old, [key]: value })); setOffset(0); }
  function closeDetail() {
    setDetail(null);
    if (selectedPlanetId) {
      const next = new URLSearchParams(params);
      next.delete('planet_id');
      navigate({ search: next.toString() }, { replace: true });
    }
  }
  async function remove() {
    setBusy(true);
    try { await planets.remove(detail.id); setConfirm(false); closeDetail(); resource.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  function mapPlanet(planet) {
    const system = systems.find((item) => item.name === planet.system_name);
    if (system) selectSystem(system);
    setDetail(null); navigate('/galaxy?system=' + encodeURIComponent(planet.system_name));
  }
  return <><header className="section-header"><div><p className="eyebrow">Surface reconnaissance</p><h2>World Catalog</h2></div><div className="actions"><Button onClick={() => setEditor(blank)}>+ New planet</Button></div></header><Toast message={error} error />
    <div className="toolbar"><Input label="Search planets" placeholder="Name, system or notes" value={filters.q} onChange={(e) => filter('q', e.target.value)} /><Input label="Resource filter" placeholder="Name or symbol, e.g. Fe" value={filters.resource} onChange={(e) => filter('resource', e.target.value)} /><Input label="System filter" value={filters.system} onChange={(e) => filter('system', e.target.value)} /></div>
    <details className="mb-6"><summary className="small muted cursor-pointer">Environment filters</summary><div className="toolbar mt-4"><Input label="Hazard filter" value={filters.hazard} onChange={(e) => filter('hazard', e.target.value)} /><Input label="Minimum gravity" type="number" min="0" max="100" step=".01" value={filters.min_gravity} onChange={(e) => filter('min_gravity', e.target.value)} /><Input label="Maximum gravity" type="number" min="0" max="100" step=".01" value={filters.max_gravity} onChange={(e) => filter('max_gravity', e.target.value)} /></div></details>
    <ResourceState resource={resource}>{resource.data?.length ? <><div className="grid-cards">{resource.data.map((planet) => <AttachmentDrop key={planet.id} associations={{ planet_id: planet.id }}><Panel className="stack"><div className="card-heading"><p className="eyebrow">{planet.system_name || 'Uncharted system'}</p>{planet.favorite && <Tag>Favorite</Tag>}</div><h2>{planet.name}</h2><p className="small muted">{planet.type} / {planet.gravity ?? '?'} G / {planet.temperature}</p><div>{planet.resources.map((item) => <Tag key={item.id}>{item.symbol || item.name}</Tag>)}</div><div>{planet.hazards.map((item) => <Tag key={item} tone="warning">{item}</Tag>)}</div><StatBar label="Survey" value={planet.surveyed_percent} /><Button variant="ghost" onClick={() => { setDetail(planet); setError(''); }}>Open {planet.name}</Button></Panel></AttachmentDrop>)}</div><Pagination offset={offset} total={resource.total} onChange={setOffset} /></> : <EmptyState title="No planets match this scan">Adjust filters or record a new world.</EmptyState>}</ResourceState>
    <ResourceHunt onSelect={setDetail} initial={params.get('resource') || ''} />
    {detail && !editor && !confirm && <Modal title={detail.name} onClose={closeDetail}><div className="stack"><p className="eyebrow">{detail.system_name} / {detail.type}</p><div className="form-grid">{['gravity', 'temperature', 'atmosphere', 'magnetosphere', 'water', 'flora', 'fauna'].map((key) => <div key={key}><p className="small muted uppercase">{key}</p><p>{detail[key] ?? 'Unknown'}</p></div>)}</div><div>{detail.resources.map((item) => <Tag key={item.id}>{item.name} ({item.symbol || '?'})</Tag>)}</div><div>{detail.hazards.map((item) => <Tag key={item} tone="warning">{item}</Tag>)}</div><p className="small muted">Biomes: {detail.biomes.join(', ') || 'Unrecorded'}<br />Traits: {detail.planetary_traits.join(', ') || (detail._reference ? 'None catalogued' : 'Unrecorded')}</p><StatBar value={detail.surveyed_percent} label="Survey progress" /><PlanetSurvey key={JSON.stringify(detail)} planet={detail} /><p className="prose-text">{detail.user_notes || 'No field notes yet.'}</p>{detail.approximate && <p className="small muted">Environmental cautions are inferred from catalog readings. Confirm local conditions before landing.</p>}<div className="actions"><Button onClick={() => setEditor(detail)}>Edit planet</Button><Button variant="ghost" onClick={() => mapPlanet(detail)}>Show system on map</Button><Link to={'/journal?q=' + encodeURIComponent(detail.name)}>Related logs</Link><Link to={'/journal/new?planet=' + encodeURIComponent(detail.name) + '&system=' + encodeURIComponent(detail.system_name) + '&planet_id=' + detail.id}>Launch Expedition Log</Link><Button variant="danger" onClick={() => setConfirm(true)}>Delete planet</Button></div>{detail._reference?.landable !== false ? <Link className="button button-primary" to={"/logistics/outposts?planet_id=" + detail.id}>Build Outpost Here</Link> : <p className="small muted">Orbital survey only — no surface outpost site.</p>}<PlanetStrategy planet={detail} /><MediaArchive compact associations={{ planet_id: detail.id }} /><div className="small">{detail._sources?.map((url) => <p key={url}><a href={url} target="_blank" rel="noreferrer">Reference: {new URL(url).hostname}</a></p>)}</div></div></Modal>}
    {editor && <PlanetEditor initial={editor} onClose={() => setEditor(null)} onSaved={(planet) => { setEditor(null); setDetail(planet); resource.reload(); }} />}
    {confirm && <Modal title={'Delete ' + detail.name + '?'} onClose={() => setConfirm(false)}><p>Logs and media remain in your archive; their planet links will be detached.</p><Toast message={error} error /><div className="actions mt-4"><Button variant="danger" disabled={busy} onClick={remove}>Confirm delete planet</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div></Modal>}
  </>;
}

function PlanetEditor({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(Object.keys(blank).map((key) => [key, initial[key] ?? blank[key]])));
  const [lists, setLists] = useState(() => Object.fromEntries(['resources', 'hazards', 'biomes', 'planetary_traits'].map((key) => [key, initial[key]?.map((item) => item.name || item).join(', ') || ''])));
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  function change(key, value) { setDraft((old) => ({ ...old, [key]: value })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = { ...draft, ...Object.fromEntries(Object.entries(lists).map(([key, value]) => [key, split(value)])) };
      onSaved(initial.id ? await planets.update(initial.id, data) : await planets.create(data));
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return <Modal title={initial.id ? 'Edit planet' : 'New planet'} onClose={onClose}><form onSubmit={save} className="stack"><Toast message={error} error /><div className="form-grid">{['name', 'system_name', 'type', 'temperature', 'atmosphere', 'magnetosphere', 'water'].map((key) => <Input key={key} label={key.replaceAll('_', ' ')} value={draft[key]} required={key === 'name'} maxLength={key === 'type' ? 50 : 100} onChange={(e) => change(key, e.target.value)} />)}{['gravity', 'flora', 'fauna', 'surveyed_percent'].map((key) => <Input key={key} label={key.replaceAll('_', ' ')} type="number" min="0" max={key === 'flora' || key === 'fauna' ? 10000 : 100} step={key === 'gravity' ? '.01' : '1'} value={draft[key] ?? ''} required={key === 'surveyed_percent'} onChange={(e) => change(key, e.target.value === '' ? null : Number(e.target.value))} />)}</div>{Object.keys(lists).map((key) => <Input key={key} label={key.replaceAll('_', ' ') + ' (comma separated)'} value={lists[key]} onChange={(e) => setLists((old) => ({ ...old, [key]: e.target.value }))} />)}<TextArea label="User notes" value={draft.user_notes} maxLength={30000} onChange={(e) => change('user_notes', e.target.value)} /><div className="actions">{['favorite', 'outpost_candidate', 'approximate'].map((key) => <label key={key} className="small"><input type="checkbox" checked={draft[key]} onChange={(e) => change(key, e.target.checked)} /> {key.replaceAll('_', ' ')}</label>)}</div><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save planet'}</Button></form></Modal>;
}

function ResourceHunt({ onSelect, initial }) {
  const [targets, setTargets] = useState(initial); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function search(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await ai.resourceHunt({ resources: split(targets) })); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <Panel className="stack mt-8"><p className="eyebrow">Logistics / Local catalog search</p><h2>Resource Hunt</h2><form onSubmit={search} className="toolbar"><Input label="Target resources (comma separated)" placeholder="Iron, Copper" required value={targets} onChange={(e) => setTargets(e.target.value)} /><Button type="submit" disabled={busy}>{busy ? 'Scanning…' : 'Find resources'}</Button></form><Toast message={error} error />{result && <><p className="small muted">{result.method}</p>{result.results.length ? result.results.map((row) => <div className="card-heading" key={row.planet.id}><button className="text-hud-blue text-left" onClick={() => onSelect(row.planet)}>{row.planet.name} / {row.planet.system_name}</button><span className="small muted">{row.match_count} matches • {row.hazard_count} recorded hazards</span></div>) : <EmptyState title="No matching deposits in this catalog" />}</>}</Panel>;
}
function PlanetStrategy({ planet }) {
  const [loadout, setLoadout] = useState(''); const [skills, setSkills] = useState(''); const [crew, setCrew] = useState('');
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function strategize() {
    setBusy(true); setError('');
    try { setResult(await ai.strategize({ hazards: planet.hazards, environment: [planet.temperature, planet.atmosphere, planet.water].join('; '), loadout: split(loadout), skills: split(skills), crew: split(crew) })); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="stack border-t border-hairline pt-5"><h2>Surface preparation</h2><Input label="Loadout (comma separated)" value={loadout} onChange={(e) => setLoadout(e.target.value)} /><Input label="Player skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} /><Input label="Available crew (comma separated)" value={crew} onChange={(e) => setCrew(e.target.value)} /><Button variant="ghost" disabled={busy} onClick={strategize}>{busy ? 'Analyzing…' : 'Strategize'}</Button><Toast message={error} error />{result && <div className="stack"><Tag>{result.mode} / {result.risk_level} risk</Tag>{['gear', 'skills', 'crew_picks'].map((key) => <div key={key}><h3>{key.replaceAll('_', ' ')}</h3>{result[key].map((item, index) => <p key={index} className="small">{item}</p>)}</div>)}<p className="small muted">{result.explanation}</p></div>}</div>;
}
