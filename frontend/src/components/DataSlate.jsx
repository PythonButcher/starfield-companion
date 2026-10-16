import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Modal, ResourceState, Tag } from './ui';

const channels = ['Resume', 'Briefing', 'Logs', 'Worlds'];

export default function DataSlate({ resource, briefing }) {
  const [channel, setChannel] = useState('Resume');
  const [reading, setReading] = useState(null);
  const data = resource.data;
  const favoriteIds = new Set(data?.favorites.map((planet) => planet.id));
  // A favorite can also be a milestone; show one entry with both attributes.
  const worlds = [...new Map([...(data?.favorites || []), ...(data?.milestones || [])].map((planet) => [planet.id, planet])).values()];
  return <section className="data-slate" aria-labelledby="slate-title">
    <header className="slate-header"><div><p className="eyebrow">Personal archive / DS–01</p><h2 id="slate-title">Data Slate</h2></div><span className="slate-mark" aria-hidden="true">▤</span></header>
    <fieldset className="slate-channels"><legend className="sr-only">Data Slate channel</legend>
      {channels.map((name) => <label key={name}><input type="radio" name="slate-channel" value={name} checked={channel === name} onChange={() => setChannel(name)} /><span>{name}</span></label>)}
    </fieldset>
    <div className="slate-screen" key={channel} role="region" aria-label={`${channel} slate`} tabIndex={0}>
      {channel === 'Briefing' ? <ResourceState resource={briefing}>{briefing.data && <article className="slate-article">
        <p className="eyebrow">Shipboard intelligence</p><h3>AI Ship Briefing</h3>
        <Tag>{briefing.data.mode === 'mock' ? 'Local ship computer' : 'AI uplink'}</Tag>
        <p className="prose-text">{briefing.data.briefing}</p>
      </article>}</ResourceState> : <ResourceState resource={resource}>{data && <>
        {channel === 'Resume' && <>
          <div className="slate-section-title"><h3>Resume your expedition</h3><span className="small muted">App notes & plans</span></div>
          {!!data.missions.length && <div className="slate-group"><p className="eyebrow">Active missions</p>{data.missions.map((mission) => <Link className="slate-row" key={mission.id} to={'/journal/missions#mission-' + mission.id}>
            <span>{mission.title}</span><small>{mission.checklist.filter((step) => step.done).length}/{mission.checklist.length} steps <span aria-hidden="true">↗</span></small>
          </Link>)}</div>}
          {!!data.outpost_alerts.length && <div className="slate-group"><p className="eyebrow">Attention required</p>{data.outpost_alerts.map((outpost) => <Link className="slate-row slate-warning" key={outpost.id} to={'/logistics/outposts?id=' + outpost.id}>
            <span>Fix {outpost.name}</span><small>{outpost.net_power < 0 ? `${outpost.net_power} power` : ''}{outpost.storage_overflow ? ' Storage over capacity' : ''}</small>
          </Link>)}</div>}
          {!!data.survey_targets.length && <div className="slate-group"><p className="eyebrow">Nearby survey targets</p>{data.survey_targets.map(({ planet }) => <Link className="slate-row" key={planet.id} to={'/galaxy/surveys?system=' + encodeURIComponent(planet.system_name)}>
            <span>{planet.name}</span><small>{planet.surveyed_percent}% surveyed <span aria-hidden="true">↗</span></small>
          </Link>)}</div>}
          {!data.missions.length && !data.outpost_alerts.length && !data.survey_targets.length && <EmptyState title="Clear for your next expedition">Create a mission or record a survey to build your handover.</EmptyState>}
          <Link className="slate-continue" to={'/journal/new?' + new URLSearchParams({ planet: data.position.planet || '', system: data.position.system || '' })}>Log Current Activity <span aria-hidden="true">↗</span></Link>
          <details className="small muted"><summary>Handover notes</summary><p className="prose-text">{data.narrative}</p><p>{data.limitations}</p>{data.position.at && <p>Last logged: {new Date(data.position.at).toLocaleString()}</p>}</details>
        </>}
        {channel === 'Logs' && <><div className="slate-section-title"><h3>Recent Captain’s Logs</h3><Link to="/journal">All entries ↗</Link></div>
          {data.recent_logs.length ? data.recent_logs.map((log) => <button type="button" className="slate-row slate-log" key={log.id} onClick={() => setReading(log)} aria-label={'Read ' + log.title}>
            <span>{log.title}</span><small>{log.planet_name || 'Location unrecorded'} / {log.stardate}</small><span className="slate-excerpt">{(log.ai_narrative || log.raw_notes || 'No notes recorded.').slice(0, 130)}</span>
          </button>) : <EmptyState title="No captain’s logs yet" />}
        </>}
        {channel === 'Worlds' && <><div className="slate-section-title"><h3>Saved worlds</h3><Link to="/galaxy/surveys">Survey Ledger ↗</Link></div>
          {!data.favorites.length && !data.milestones.length && <EmptyState title="No saved milestones">Favorite a world or complete a survey to keep it here.</EmptyState>}
          {worlds.map((planet) => <Link className="slate-row" key={planet.id} to={'/galaxy?q=' + encodeURIComponent(planet.name)}><span>{favoriteIds.has(planet.id) && '☆ '}{planet.name}</span><small>{planet.surveyed_percent}% surveyed</small></Link>)}
        </>}
      </>}</ResourceState>}
    </div>
    <footer className="slate-footer"><span>CONSTELLATION</span><span>{String(channels.indexOf(channel) + 1).padStart(2, '0')} / 04 <i aria-hidden="true" /></span></footer>
    {reading && <Modal title={reading.title} onClose={() => setReading(null)}><p className="prose-text">{reading.ai_narrative || reading.raw_notes || 'No notes recorded.'}</p><Link to={'/journal/' + reading.id}>Open full log and attachments</Link><Button variant="ghost" onClick={() => setReading(null)}>Return to slate</Button></Modal>}
  </section>;
}
