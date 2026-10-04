import { Link } from 'react-router-dom';
import { useResource } from '../hooks/useResource';
import { ResourceState } from './ui';

export default function PlanetSurvey({ planet }) {
  const resource = useResource('/api/surveys/' + planet.id);
  return <section className="stack"><h3>Survey gap breakdown</h3><ResourceState resource={resource}>
    {resource.data && <div className="survey-counters">{Object.entries(resource.data.counters).map(([name, count]) =>
      <div key={name}><span className="small muted">{name}</span><strong>{count.scanned ?? '?'} / {count.total ?? '?'}</strong>
        <small>{count.remaining == null ? 'Awaiting readings' : count.remaining + ' remaining'}</small></div>)}</div>}
  </ResourceState><Link to={'/galaxy/surveys?' + new URLSearchParams({ system: planet.system_name, planet_id: planet.id })}>Update survey readings ↗</Link></section>;
}
