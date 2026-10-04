import { useState } from 'react';
import { Link } from 'react-router-dom';
import SessionRadar from '../components/SessionRadar';
import { useResource } from '../hooks/useResource';
import { Panel, SectionHeader, ResourceState, EmptyState, Button, Modal, Tag } from '../components/ui';

export default function Hub() {
  const resource = useResource('/api/radar/session_handover');
  const briefing = useResource('/api/briefing');
  const [reading, setReading] = useState(null); const data = resource.data;
  return <><SectionHeader eyebrow="Constellation / Navigation desk" title="Command Hub">
    <Link className="button button-primary" to="/journal/new">+ Record Log</Link>
    <Link className="button button-ghost" to="/logistics/outposts">+ Plan Outpost</Link>
    <Link className="button button-ghost" to="/journal/missions?new=1">+ New Mission</Link>
    <Button variant="ghost" onClick={() => { resource.reload(); briefing.reload(); }}>Refresh terminal</Button>
  </SectionHeader>
    <div className="stack">
      <ResourceState resource={resource}>{data && <div className="two-column">
        <SessionRadar data={data} />
        <div className="stack"><Panel className="stack"><p className="eyebrow">Shipboard telemetry / recorded operations</p><h2>Fleet & outpost status</h2>
          {data.home_ship && <div className="home-ship"><span className="muted small">HOME SHIP</span><h3>{data.home_ship.name}</h3><p className="small muted">Command uplink · {data.position.system || 'Position awaiting log'}</p></div>}
          <div className="stat-grid"><Link to="/crew"><strong>{data.stats.assigned_crew}</strong>Assigned crew</Link>
            <Link to="/logistics/outposts"><strong>{data.stats.outposts}</strong>Outposts</Link>
            <Link to="/logistics/portfolio"><strong>{data.stats.coverage_percent}%</strong>Resource coverage</Link>
            <Link to="/journal/media"><strong>{data.stats.media}</strong>Media records</Link></div>
          <div className="actions"><Link to="/logistics/crafting">Crafting Resolver</Link><Link to="/journal/missions">Mission Command</Link><Link to="/galaxy/surveys">Survey Ledger</Link></div>
        </Panel>
          <Panel className="stack"><h2>AI Ship Briefing</h2><ResourceState resource={briefing}>
            {briefing.data && <><Tag>{briefing.data.mode === 'mock' ? 'Local ship computer' : 'AI uplink'}</Tag><p className="prose-text">{briefing.data.briefing}</p></>}
          </ResourceState></Panel>
        </div>
      </div>}</ResourceState>
      <ResourceState resource={resource}>{data && <div className="two-column">
        <Panel className="stack"><h2>Recent Captain’s Logs</h2>
          {data.recent_logs.length ? data.recent_logs.map((log) => <div key={log.id} className="card-heading">
            <div><h3>{log.title}</h3><p className="small muted">{log.planet_name} / {log.stardate}</p></div><Button variant="ghost" onClick={() => setReading(log)}>Read {log.title}</Button>
          </div>) : <EmptyState title="No captain’s logs yet" />}
        </Panel>
        <Panel className="stack"><h2>Favorite Worlds & Survey Milestones</h2>
          {!data.favorites.length && !data.milestones.length && <EmptyState title="No saved milestones">Favorite a world in World Catalog or complete a survey.</EmptyState>}
          {data.favorites.map((p) => <Link key={'f' + p.id} to={'/galaxy?q=' + encodeURIComponent(p.name)}>★ {p.name} / {p.surveyed_percent}%</Link>)}
          {data.milestones.map((p) => <p key={'m' + p.id}><Tag>100% surveyed</Tag><Link to={'/galaxy?q=' + encodeURIComponent(p.name)}>{p.name}</Link></p>)}
        </Panel>
      </div>}</ResourceState>
    </div>
    {reading && <Modal title={reading.title} onClose={() => setReading(null)}><p className="prose-text">{reading.ai_narrative || reading.raw_notes || 'No notes recorded.'}</p><Link to={'/journal/' + reading.id}>Open full log and attachments</Link></Modal>}
  </>;
}
