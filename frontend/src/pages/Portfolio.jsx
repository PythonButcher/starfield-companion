import { Link } from 'react-router-dom';
import { useResource } from '../hooks/useResource';
import { Panel, SectionHeader, ResourceState, EmptyState, Tag } from '../components/ui';
export default function Portfolio() {
  const resource = useResource('/api/portfolio/coverage'); const data = resource.data;
  return <><SectionHeader eyebrow="Industry / Supply network" title="Resource Coverage Portfolio"><Link to="/outposts">Outpost Planner ↗</Link></SectionHeader>
    <ResourceState resource={resource}>{data && <div className="stack">
      <Panel className="stack"><h2>{data.coverage_percent}% inorganic coverage</h2><p>{data.covered_count} / {data.catalog_count} resources in powered plans. {data.inactive_plans} underpowered plans excluded.</p>
        <p className="small muted">{data.method}</p><div className="resource-matrix">{data.resources.map((r) =>
          <Link key={r.name} className={'resource-cell ' + (r.covered ? 'covered' : '')} to={'/planet-pulse?resource=' + encodeURIComponent(r.name)}>
            <strong>{r.symbol || r.name.slice(0, 3)}</strong><span>{r.name}</span><span>{r.rarity} / {r.covered ? 'Covered' : 'Missing'}</span>
          </Link>)}</div></Panel>
      <h2>Next Best Outpost Recommendations</h2>{data.recommendations.length ? <div className="grid-cards">
        {data.recommendations.map((item) => <Panel className="stack" key={item.planet.id}><p className="eyebrow">Choice {item.rank} / +{item.gain} resources</p>
          <h3>{item.planet.name}</h3><p>{item.planet.system_name}</p><div>{item.new_resources.map((r) => <Tag key={r}>{r}</Tag>)}</div>
          <Link className="button button-primary" to={'/outposts?planet_id=' + item.planet.id}>Plan Outpost</Link>
        </Panel>)}</div> : <EmptyState title="No further coverage in this catalog">Expand surveyed worlds or adjust existing extraction plans.</EmptyState>}
    </div>}</ResourceState>
  </>;
}
