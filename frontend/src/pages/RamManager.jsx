import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { readStorage, writeStorage } from '../utils/storage';
import { Panel, Button, Input, Tag, SectionHeader, EmptyState, ResourceState, Toast } from '../components/ui';
export default function RamManager() {
  const resource = useResource('/api/research?limit=200');
  const [pinned, setPinned] = useState(() => readStorage('starfield:research', []));
  const [query, setQuery] = useState(''); const [saved, setSaved] = useState(true);
  function savePins(next) { setPinned(next); setSaved(writeStorage('starfield:research', next)); }
  const projects = resource.data || [];
  const totals = {};
  projects.filter((item) => pinned.includes(item['research Project'])).forEach((item) => {
    for (const material of item.required_materials_normalized || []) totals[material.name] = (totals[material.name] || 0) + material.qty;
  });
  const filtered = projects.filter((item) => item['research Project']?.toLowerCase().includes(query.toLowerCase()));
  function toggle(name) { savePins(pinned.includes(name) ? pinned.filter((item) => item !== name) : [...pinned, name]); }
  return <><SectionHeader eyebrow="06 / Resource allocation manager" title="Research & procurement"><Tag>{pinned.length} active projects</Tag></SectionHeader><Toast error message={saved ? '' : 'Device storage unavailable; research selections will not survive reload.'} /><ResourceState resource={resource}><div className="ram-layout"><div className="stack"><Input label="Search research" value={query} onChange={(e) => setQuery(e.target.value)} /><p className="small muted">Reference catalog is inherited from the original app; verify quantities in-game. Totals include selected projects only.</p>{!filtered.length && <EmptyState title="No matching research" />}<div className="grid-cards">{filtered.map((project) => { const name = project['research Project']; return <Panel className="stack" key={name}><div className="card-heading"><h2>{name}</h2><Button variant="ghost" aria-pressed={pinned.includes(name)} onClick={() => toggle(name)}>{pinned.includes(name) ? 'Unpin' : 'Pin'}</Button></div><p className="small muted">Skills: {project['required Skills']}<br />Prior research: {project['required Research']}</p><div>{project.required_materials_normalized?.map((mat) => <Tag key={mat.name}>{mat.name} × {mat.qty}</Tag>)}</div><p className="small">{project['crafting Unlocked']}</p></Panel>; })}</div></div><Panel className="stack self-start"><p className="eyebrow">Supply manifest</p><h2>Procurement list</h2>{Object.keys(totals).length ? <>{Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, count]) => <div className="card-heading" key={name}><span>{name}</span><b className="mono text-hud-blue">{count}</b></div>)}<Button variant="ghost" onClick={() => savePins([])}>Clear targets</Button></> : <EmptyState title="Systems standby">Pin a project to assemble its material requirements.</EmptyState>}</Panel></div></ResourceState></>;
}
