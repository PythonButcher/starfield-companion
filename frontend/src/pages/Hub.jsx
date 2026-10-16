import { Link } from 'react-router-dom';
import PlaythroughPanel from '../components/PlaythroughPanel';
import DataSlateDrawer from '../components/DataSlateDrawer';
import { useResource } from '../hooks/useResource';
import { SectionHeader, ResourceState, Button } from '../components/ui';

// An original navigation schematic, separate from the Galaxy map's system data.
function NavigationGlyph() {
  return <svg className="navigation-glyph" viewBox="0 0 220 180" aria-hidden="true">
    <g fill="none" stroke="currentColor"><circle cx="110" cy="90" r="67" /><circle cx="110" cy="90" r="42" />
      <ellipse cx="110" cy="90" rx="94" ry="26" transform="rotate(-30 110 90)" />
      <path d="M110 10v25m0 110v25M30 90H5m185 0h25M103 90h14m-7-7v14" /></g>
    <circle cx="167" cy="55" r="5" fill="currentColor" /><circle cx="70" cy="104" r="3" fill="currentColor" />
  </svg>;
}

export default function Hub() {
  const resource = useResource('/api/radar/session_handover');
  const briefing = useResource('/api/briefing');
  const playthrough = useResource('/api/playthrough');
  const data = resource.data;
  return <div className="command-hub">
    <SectionHeader eyebrow="Constellation / Personal terminal" title="Command Hub">
      <Link className="button button-primary" to="/journal/new">+ Record Log</Link>
      <Button variant="ghost" onClick={() => { resource.reload(); briefing.reload(); playthrough.reload(); }}>Refresh terminal</Button>
      <DataSlateDrawer resource={resource} briefing={briefing} />
    </SectionHeader>
    <div className="command-workspace">
      <div className="command-overview">
        <PlaythroughPanel resource={playthrough} />
        <section className="command-operations" aria-label="Recorded operations">
          <ResourceState resource={resource}>{data && <>
            <div className="command-position">
              <div><p className="eyebrow">App records / Last logged position</p>
                <h2>{data.position.planet || 'Position unrecorded'}</h2>
                <p className="position-system">{data.position.planet || 'Unrecorded'} / {data.position.system || 'Unrecorded'}</p>
                <p className="small muted">{data.position.source}</p>
                <Link to={'/galaxy?' + new URLSearchParams({ system: data.position.system || '' })}>Open star map <span aria-hidden="true">↗</span></Link>
              </div><NavigationGlyph />
            </div>
            <div className="command-telemetry">
              <Link to="/crew" className="command-vessel"><span className="eyebrow">Recorded home ship</span><h3>{data.home_ship?.name || 'No ship recorded'}</h3></Link>
              {[
                ['/crew', data.stats.assigned_crew, 'Assigned crew'],
                ['/logistics/outposts', data.stats.outposts, 'Outposts'],
                ['/logistics/portfolio', `${data.stats.coverage_percent}%`, 'Coverage'],
                ['/journal/media', data.stats.media, 'Media'],
              ].map(([to, value, label]) => <Link key={label} to={to}><strong>{value}</strong><span>{label}</span></Link>)}
            </div>
          </>}</ResourceState>
        </section>
      </div>
    </div>
    <nav className="command-dock" aria-label="Command shortcuts">
      <Link to="/logistics/supply-network"><span>01 / Industry</span><strong>Supply corridor ↗</strong></Link>
      <Link to="/crew/blueprints"><span>02 / Ship Forge</span><strong>Design a vessel ↗</strong></Link>
      <Link to="/logistics/outposts" aria-label="+ Plan Outpost"><span>03 / Surface</span><strong>+ Plan Outpost</strong></Link>
      <Link to="/journal/missions?new=1" aria-label="+ New Mission"><span>04 / Objectives</span><strong>+ New Mission</strong></Link>
    </nav>
  </div>;
}
