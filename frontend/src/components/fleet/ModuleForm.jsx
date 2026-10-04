import { useState } from 'react';
import { Button, Input, Modal, Select } from '../ui';

const FIELDS = {
  mass: 'Mass', hull: 'Hull health', power: 'Power generated / required', crew_capacity: 'Crew rating',
  crew_stations: 'Crew stations', shield: 'Shield health', maneuvering_thrust: 'Maneuvering thrust',
  grav_thrust: 'Grav jump thrust', top_speed: 'Full-power top speed (m/s)', cargo: 'Cargo capacity', fuel: 'Fuel capacity',
};
const RELEVANT = { Reactor: ['power', 'crew_capacity'], Engine: ['power', 'crew_capacity', 'maneuvering_thrust', 'top_speed'],
  'Grav drive': ['power', 'grav_thrust'], Shield: ['power', 'shield', 'crew_capacity'], Hab: ['crew_stations'],
  Cockpit: ['crew_stations', 'cargo'], Cargo: ['cargo'], 'Fuel tank': ['fuel'], Weapon: ['power', 'crew_capacity'] };

export default function ModuleForm({ initial, categories, onSave, onClose }) {
  const [row, setRow] = useState(initial);
  const fields = ['mass', 'hull', ...(RELEVANT[row.category] || [])];
  return <Modal title="Module workbench" onClose={onClose}><form className="stack" onSubmit={(event) => { event.preventDefault(); onSave(row); }}>
    <Input label="Module name" required maxLength="120" value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value, catalog_id: '' })} />
    <div className="two-column"><Select label="Module category" value={row.category} onChange={(e) => setRow({ ...row, category: e.target.value, catalog_id: '', stats: Object.fromEntries(Object.keys(FIELDS).map((key) => [key, ['mass', 'hull'].includes(key) ? row.stats[key] : 0])) })}>
      {categories.map((category) => <option key={category}>{category}</option>)}</Select>
      <Select label="Module class" value={row.ship_class} onChange={(e) => setRow({ ...row, ship_class: e.target.value, catalog_id: '' })}><option value="">Unclassified</option>{['A', 'B', 'C'].map((c) => <option key={c}>{c}</option>)}</Select></div>
    <div className="module-fields">{fields.map((key) => <Input key={key} label={FIELDS[key]} type="number" min="0" max="1000000" step="any" placeholder="Unknown" value={row.stats[key] ?? ''}
      onChange={(e) => setRow({ ...row, catalog_id: '', stats: { ...row.stats, [key]: e.target.value === '' ? null : Number(e.target.value) } })} />)}</div>
    <Input label="Module quantity" type="number" min="1" max="100" step="1" required value={row.count} onChange={(e) => setRow({ ...row, count: e.target.value === '' ? '' : Number(e.target.value) })} />
    <p className="small muted">Enter base module stats from the game. Blank measurements remain unknown; use zero for a stat the module does not provide. Weapon damage is not hull health.</p>
    <Button type="submit">Apply module</Button>
  </form></Modal>;
}
