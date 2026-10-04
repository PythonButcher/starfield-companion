import { useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../components/InteractiveMap';
import SessionRadar from '../components/SessionRadar';
import { useResource } from '../hooks/useResource';
import { Panel, SectionHeader, ResourceState, EmptyState, Button, Modal, Tag } from '../components/ui';

export default function Hub() {
  const resource = useResource('/api/radar/session_handover');
  const briefing = useResource('/api/briefing');
  const [reading, setReading] = useState(null); const data = resource.data;
  return <><SectionHeader eyebrow="Constellation / Navigation desk" title="The stars are waiting.">
    <Link className="button button-primary" to="/journal/new">+ Record an expedition</Link>
    <Button variant="ghost" onClick={() => { resource.reload(); briefing.reload(); }}>Refresh terminal</Button>
  </SectionHeader>
    <div className="stack">
      <ResourceState resource={resource}>{data && <div className="two-column">
        <SessionRadar data={data} />
        <div className="stack"><Panel className="stack"><h2>Fleet & outpost status</h2>
          <div className="stat-grid"><Link to="/crew"><strong>{data.stats.assigned_crew}</strong>Assigned crew</Link>
            <Link to="/outposts"><strong>{data.stats.outposts}</strong>Outposts</Link>
            <Link to="/portfolio"><strong>{data.stats.coverage_percent}%</strong>Resource coverage</Link>
            <Link to="/media"><strong>{data.stats.media}</strong>Media records</Link></div>
          <div className="actions"><Link to="/crafting">Crafting Resolver</Link><Link to="/missions">Mission Command</Link><Link to="/surveys">Survey Ledger</Link></div>
        </Panel>
          <Panel className="stack"><h2>AI Ship Briefing</h2><ResourceState resource={briefing}>
            {briefing.data && <><Tag>{briefing.data.mode} / {briefing.data.model}</Tag><p className="prose-text">{briefing.data.briefing}</p></>}
          </ResourceState></Panel>
        </div>
      </div>}</ResourceState>
      <Panel className="map-panel"><InteractiveMap /></Panel>
      <ResourceState resource={resource}>{data && <div className="two-column">
        <Panel className="stack"><h2>Recent Captain’s Logs</h2>
          {data.recent_logs.length ? data.recent_logs.map((log) => <div key={log.id} className="card-heading">
            <div><h3>{log.title}</h3><p className="small muted">{log.planet_name} / {log.stardate}</p></div><Button variant="ghost" onClick={() => setReading(log)}>Read {log.title}</Button>
          </div>) : <EmptyState title="No captain’s logs yet" />}
        </Panel>
        <Panel className="stack"><h2>Favorite Worlds & Survey Milestones</h2>
          {!data.favorites.length && !data.milestones.length && <EmptyState title="No saved milestones">Favorite a world in PlanetPulse or complete a survey.</EmptyState>}
          {data.favorites.map((p) => <Link key={'f' + p.id} to={'/planet-pulse?q=' + encodeURIComponent(p.name)}>★ {p.name} / {p.surveyed_percent}%</Link>)}
          {data.milestones.map((p) => <p key={'m' + p.id}><Tag>100% surveyed</Tag><Link to={'/planet-pulse?q=' + encodeURIComponent(p.name)}>{p.name}</Link></p>)}
        </Panel>
      </div>}</ResourceState>
    </div>
    {reading && <Modal title={reading.title} onClose={() => setReading(null)}><p className="prose-text">{reading.ai_narrative || reading.raw_notes || 'No notes recorded.'}</p><Link to={'/journal/' + reading.id}>Open full log and attachments</Link></Modal>}
  </>;
}
