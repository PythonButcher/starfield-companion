import { Link } from 'react-router-dom';
export function StarTooltip({ system }) {
  return system ? <div className="star-tooltip"><h3>{system.name}</h3><p className="small muted">{system.faction} / {system.type}</p></div> : null;
}
export function SelectionOverlay({ system }) {
  return system ? <div className="selection-overlay stack"><p className="eyebrow">Target selected</p><h2>{system.name}</h2><p className="small muted">{system.description}</p><Link to={'/planet-pulse?system=' + encodeURIComponent(system.name)}>Explore planets ↗</Link></div> : null;
}
