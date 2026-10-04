import { Link } from 'react-router-dom';
import { useResource } from '../hooks/useResource';
import { Panel, ResourceState, Tag } from './ui';

export function SystemLevel({ level }) {
  const band = level == null ? 'unknown' : level <= 15 ? 'safe' : level < 40 ? 'caution' : 'danger';
  return <Tag tone={'level-' + band}>● {level == null ? 'Level awaiting scan' : `Level ${level} / ${band}`}</Tag>;
}

export default function SystemInspector({ system }) {
  const resource = useResource('/api/systems/' + system.id);
  const data = resource.data;
  return <Panel className="system-inspector stack" aria-label={system.name + ' system inspector'}>
    <div><p className="eyebrow">System telemetry / selected sector</p><h2>{system.name}</h2></div>
    <div><Tag>{system.type}</Tag><SystemLevel level={system.level} /><Tag>{system.faction}</Tag></div>
    <ResourceState resource={resource}>{data && <>
      <h3>Orbiting worlds & moons <span className="muted">/ {data.planets.length}</span></h3>
      {data.planets.length ? <div className="orbit-list">{data.planets.map((planet) => <Link key={planet.id}
        to={'/galaxy?' + new URLSearchParams({ system: system.name, planet_id: planet.id })}>
        <span><strong>{planet.name}</strong><small>{planet._reference?.body_type || planet.type} · {planet._reference?.orbits || system.name}</small></span>
        <span className="mono">{planet.surveyed_percent}% ↗</span>
      </Link>)}</div> : <p className="small muted">No worlds catalogued in this sector yet. Record a world below to chart it.</p>}
      <h3>Local outposts</h3>
      {data.outposts.length ? data.outposts.map((outpost) => <Link key={outpost.id} to={'/logistics/outposts?id=' + outpost.id}>
        {outpost.name} · {outpost.analysis.net_power > 0 ? '+' : ''}{outpost.analysis.net_power} power
      </Link>) : <p className="small muted">No established outposts in this sector.</p>}
      <h3>Active missions</h3>
      {data.missions.length ? data.missions.map((mission) => <Link key={mission.id} to={'/journal/missions#mission-' + mission.id}>
        {mission.title} · {mission.checklist.filter((step) => step.done).length}/{mission.checklist.length}
      </Link>) : <p className="small muted">No active objectives in this sector.</p>}
    </>}</ResourceState>
  </Panel>;
}
