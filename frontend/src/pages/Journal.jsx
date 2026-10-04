import { AttachmentDrop } from '../components/MediaArchive';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { logs } from '../api/logs';
import { query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { Panel, Input, SectionHeader, EmptyState, ResourceState, Tag, Pagination } from '../components/ui';
export default function Journal() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [tag, setTag] = useState(''); const [offset, setOffset] = useState(0);
  const resource = useResource(logs.path + query({ q: search, tag, limit: 12, offset }));
  return <><SectionHeader eyebrow="01 / Expedition archive" title="Captain’s Logs"><Link className="button button-primary" to="/journal/new">+ New log</Link></SectionHeader>
    <div className="toolbar"><Input label="Search archive" placeholder="Title, notes, planet or system" value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} /><Input label="Filter by tag" placeholder="e.g. exploration" value={tag} onChange={(e) => { setTag(e.target.value); setOffset(0); }} /></div>
    <ResourceState resource={resource}>{resource.data?.length ? <><div className="grid-cards">{resource.data.map((log) => <AttachmentDrop key={log.id} associations={{ log_id: log.id }}><Panel className="log-card"><div className="card-heading"><p className="eyebrow">{log.log_type}</p><span className="small muted mono">{log.stardate}</span></div><h2><Link to={'/journal/' + log.id}>{log.title}</Link></h2><p className="small muted">{log.planet_name || 'Location unrecorded'} {log.system_name && '/ ' + log.system_name}</p><p className="log-preview">{(log.ai_narrative || log.raw_notes || 'No notes recorded.').slice(0, 180)}</p><div>{log.tags.map((item) => <Tag key={item}>{item}</Tag>)}</div><Link to={'/journal/' + log.id}>Open entry ↗</Link></Panel></AttachmentDrop>)}</div><Pagination offset={offset} total={resource.total} onChange={setOffset} /></> : <EmptyState title="Your story is waiting">Record a landing, a discovery, or a moment between the stars.</EmptyState>}</ResourceState></>;
}
