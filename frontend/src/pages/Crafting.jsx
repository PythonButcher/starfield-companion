import { useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api/client';
import { useResource } from '../hooks/useResource';
import { Panel, Input, Select, Button, SectionHeader, ResourceState, Toast, EmptyState } from '../components/ui';

function Tree({ node }) {
  return <li><details open><summary>{node.name} × {node.quantity}{node.inventory_used > 0 && ' (' + node.inventory_used + ' from inventory)'}</summary>
    {!!node.children.length && <ul>{node.children.map((child, i) => <Tree key={i} node={child} />)}</ul>}
  </details></li>;
}
export default function Crafting() {
  const recipes = useResource('/api/crafting/recipes?limit=200');
  const [search, setSearch] = useState(''); const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState(1); const [stock, setStock] = useState([]);
  const [result, setResult] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function resolve(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try {
      const names = stock.map((r) => r.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) throw new Error('Use one inventory row per material.');
      setResult(await request('/api/crafting/resolve', { method: 'POST', body: { target, quantity,
        inventory: Object.fromEntries(stock.filter((r) => r.name.trim()).map((r) => [r.name.trim(), r.qty])) } }));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  function inventory(index, key, value) { setStock((old) => old.map((r, i) => i === index ? { ...r, [key]: value } : r)); }
  return <><SectionHeader eyebrow="R.A.M. / Dependency resolver" title="Crafting Resolver"><Link to="/logistics/crafting/research">Research board ↗</Link></SectionHeader>
    <ResourceState resource={recipes}><form onSubmit={resolve} className="stack">
      <Input label="Search recipes" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="form-grid"><Select label="Target recipe" value={target} required onChange={(e) => setTarget(e.target.value)}>
        <option value="">Choose recipe or research</option>{recipes.data?.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.name === target)
          .map((r) => <option key={r.name} value={r.name}>{r.name} / {r.kind}</option>)}
      </Select><Input label="Target quantity" type="number" required min="1" max="10000" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
      <Panel className="stack"><h2>Current inventory</h2><p className="small muted">Include finished components as well as raw resources. Counts are consumed once across the tree.</p>
        {stock.map((r, i) => <div className="toolbar" key={i}>
          <Input label={'Inventory material ' + (i + 1)} value={r.name} required onChange={(e) => inventory(i, 'name', e.target.value)} />
          <Input label={'Inventory count ' + (i + 1)} type="number" min="0" value={r.qty} onChange={(e) => inventory(i, 'qty', Number(e.target.value))} />
          <Button variant="ghost" onClick={() => setStock(stock.filter((_, j) => i !== j))}>Remove inventory row {i + 1}</Button>
        </div>)}
        <Button variant="ghost" onClick={() => setStock([...stock, { name: '', qty: 0 }])}>Add inventory material</Button>
      </Panel><Button type="submit" disabled={busy}>{busy ? 'Resolving…' : 'Resolve materials'}</Button>
    </form></ResourceState><Toast error message={error} />
    {result && <div className="stack mt-6"><p className="small muted">{result.method}</p>
      {result.prerequisites && <p>Prerequisites: {result.prerequisites}</p>}
      <div className="two-column"><Panel><h2>Dependency tree</h2><ul className="recipe-tree"><Tree node={result.tree} /></ul></Panel>
        <Panel className="stack"><h2>Raw Materials Shopping List</h2>
          {!Object.keys(result.deficits).length && <EmptyState title="No raw material deficit" />}
          {Object.entries(result.deficits).map(([name, count]) => <div key={name}>
            <div className="card-heading"><strong>{name} × {count}</strong><Link to={'/galaxy?resource=' + encodeURIComponent(name)}>Find on Planets</Link></div>
            <p className="small muted">Full recipe: {result.raw_totals[name] || 0}. Suppliers: {result.suppliers[name]?.map((p) => p.name).join(', ') || 'No recorded supplier in this catalog'}</p>
          </div>)}
          {!!Object.keys(result.purchased_components).length && <><h3>Purchase / unresolved recipes</h3>
            {Object.entries(result.purchased_components).map(([name, count]) => <p key={name}>{name} × {count}</p>)}</>}
        </Panel></div>
    </div>}
  </>;
}
