import { Button, EmptyState, Panel, ResourceState, Tag } from './ui';

function Timestamp({ value }) {
  return <time dateTime={value}>{new Date(value).toLocaleString()}</time>;
}

function playtimeLabel(value) {
  // Some saves include both compact and verbose text. Unknown formats stay intact.
  const parts = /^(\d+)d\.(\d+)h\.(\d+)m(?:\.|$)/.exec(value);
  return parts ? parts.slice(1).map((count, index) => `${count} ${['day', 'hour', 'minute'][index]}${Number(count) === 1 ? '' : 's'}`).join(' ') : value;
}

export default function PlaythroughPanel({ resource }) {
  const connection = resource.data;
  const snapshot = connection?.snapshot;
  const groups = snapshot?.plugins && Object.entries(snapshot.plugins);
  return <Panel className="stack playthrough-panel" aria-labelledby="playthrough-title">
    <div className="card-heading playthrough-heading">
      <div><p className="eyebrow">Your game / Copied save</p><h2 id="playthrough-title">Current playthrough</h2></div>
      <Button variant="ghost" onClick={resource.reload} disabled={resource.loading}>
        {resource.loading ? 'Reading save…' : 'Refresh save'}
      </Button>
    </div>
    <ResourceState resource={resource}>
      {connection?.status === 'not_configured' && <EmptyState title="Save folder not connected">
        No copied-save folder is configured for this app.
      </EmptyState>}
      {connection?.status === 'unavailable' && <div className="notice error" role="alert">
        <p>No copied save could be read. {connection.error.message}</p><p>Check your copy folder, then choose Refresh save.</p>
      </div>}
      {snapshot && <>
        <div className="actions"><Tag tone={connection.status === 'stale' ? 'warning' : ''}>
          {connection.status === 'stale' ? 'Last successful reading' : 'Read from your copied save'}
        </Tag><span className="small muted">Saved <Timestamp value={snapshot.save.saved_at} /></span></div>
        {connection.status === 'stale' && <p className="notice error" role="alert">
          Refresh failed: {connection.error.message} Showing the last successful reading; it may be out of date.
        </p>}
        <dl className="playthrough-stats">
          <div><dt>Character</dt><dd>{snapshot.player.name}</dd></div>
          <div><dt>Level</dt><dd>{snapshot.player.level}</dd></div>
          <div><dt>Saved location</dt><dd>{snapshot.player.location || 'Not recorded'}</dd></div>
          <div><dt>Playtime</dt><dd className="playthrough-detail">{playtimeLabel(snapshot.player.playtime)}</dd></div>
          <div><dt>Experience / next level</dt><dd className="playthrough-detail">{snapshot.player.experience.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {snapshot.player.experience_required.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd></div>
          <div><dt>Game version</dt><dd className="playthrough-detail">{snapshot.save.current_game_version}</dd></div>
        </dl>
        <p className="small muted">A snapshot from when you saved, refreshed when you open this page or choose Refresh save. App notes and plans are kept separately.</p>
        <details><summary>Save details and plugins</summary><div className="stack small">
          <p className="playthrough-filename">File: {snapshot.source.filename}</p>
          <p>Last read: <Timestamp value={snapshot.extracted_at} /> · Last checked: <Timestamp value={connection.checked_at} /></p>
          <p>Created with game version {snapshot.save.created_game_version} · Save format {snapshot.save.format_version}</p>
          {groups ? groups.map(([group, plugins]) => <div key={group}><h3>{group[0].toUpperCase() + group.slice(1)} plugins ({plugins.length})</h3>
            {plugins.length ? <ul className="playthrough-plugins">{plugins.map((plugin, index) => <li key={plugin.name + index}>{plugin.name}{plugin.creation_name ? ` — ${plugin.creation_name}` : ''}</li>)}</ul> : <p className="muted">None</p>}
          </div>) : <p>Plugin details could not be decoded.</p>}
        </div></details>
        <p className="small muted">Inventory, ship builds, outposts, missions and surveys are not available from this reading yet.</p>
      </>}
    </ResourceState>
  </Panel>;
}
