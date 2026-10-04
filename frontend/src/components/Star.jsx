import { memo } from 'react';
import { getStarAppearance } from '../utils/starStyles';
const Star = ({ system, selected, showLabel, onClick, onContextMenu, onHover, dimmed }) => {
  const { color, radius } = getStarAppearance(system.type, system.faction);
  return <g transform={'translate(' + system.x + ',' + system.y + ')'} className={'map-star ' + (dimmed ? 'dimmed' : '')} role="button" tabIndex={0} aria-label={system.name} onClick={(e) => onClick(e, system)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e, system); } }} onContextMenu={(e) => onContextMenu(e, system)} onMouseEnter={() => onHover(system)} onMouseLeave={() => onHover(null)}>
    {selected && <circle r="18" fill="none" stroke="#e9a76a" strokeWidth="1" strokeDasharray="5 3" />}
    <circle r={radius + 4} fill={color} opacity=".18" filter="url(#glow)" /><circle r={selected ? radius + 2 : radius} fill={color} />
    {showLabel && <text y="24" textAnchor="middle" fill="#f0ede5" fontSize="13" pointerEvents="none">{system.name}</text>}
  </g>;
};
export default memo(Star);
