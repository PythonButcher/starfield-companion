import { Link } from 'react-router-dom';
import { Panel, EmptyState } from './ui';
export default function SessionRadar({ data }) {
  const position = data.position;
  return <Panel className="stack"><p className="eyebrow">CHRONO LOG: RESUMING COMMAND</p><h2>Session Resume Radar</h2>
    <p>Last known position: <strong>{position.planet || 'Unrecorded'} / {position.system || 'Unrecorded'}</strong></p>
    <p className="small muted">{position.source}{position.at ? ' · ' + new Date(position.at).toLocaleString() : ''}</p>
    {!!data.missions.length && <div><h3>High-priority missions</h3>{data.missions.map((m) =>
      <p key={m.id}><Link to={'/missions#mission-' + m.id}>{m.title}</Link> · {m.checklist.filter((s) => s.done).length}/{m.checklist.length} steps</p>)}</div>}
    {!!data.outpost_alerts.length && <div><h3>Outpost alerts</h3>{data.outpost_alerts.map((o) =>
      <p key={o.id} className="text-warning-red"><Link to={'/outposts?id=' + o.id}>Fix {o.name}</Link> · {o.net_power < 0 ? o.net_power + ' power' : ''}{o.storage_overflow ? ' storage over capacity' : ''}</p>)}</div>}
    {!!data.survey_targets.length && <div><h3>Same-system survey targets</h3>{data.survey_targets.map((s) =>
      <p key={s.planet.id}><Link to={'/surveys?system=' + encodeURIComponent(s.planet.system_name)}>{s.planet.name} · {s.planet.surveyed_percent}%</Link></p>)}</div>}
    {!data.missions.length && !data.outpost_alerts.length && !data.survey_targets.length && <EmptyState title="No urgent resume actions">Create an objective or record survey progress to assemble your handover.</EmptyState>}
    {data.narrative && <blockquote className="prose-text">{data.narrative}</blockquote>}
    <Link className="button button-primary" to={'/journal/new?' + new URLSearchParams({ planet: position.planet, system: position.system })}>Log Current Activity</Link>
    <p className="small muted">{data.limitations}</p>
  </Panel>;
}
