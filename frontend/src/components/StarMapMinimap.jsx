import { useRef, useState } from 'react';
import Star from './Star';
export default function StarMapMinimap({ systems, viewBox, bounds, onNavigate }) {
  const ref = useRef(null); const [dragging, setDragging] = useState(false);
  function navigate(event) {
    const matrix = ref.current?.getScreenCTM();
    if (matrix) onNavigate(new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()));
  }
  return <div className="minimap-panel"><p className="small muted mb-2">Sector overview</p><svg aria-label="Map overview" ref={ref} width="170" height="150" viewBox={[bounds.minX, bounds.minY, bounds.width, bounds.height].join(' ')} onPointerDown={(e) => { setDragging(true); navigate(e); }} onPointerMove={(e) => { if (dragging) navigate(e); }} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)}>
    {systems.map((system) => <Star key={system.id} system={system} showLabel={false} onClick={() => {}} onContextMenu={(e) => e.preventDefault()} onHover={() => {}} />)}
    <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="#9ac8e70b" stroke="#9ac8e7" strokeWidth="6" pointerEvents="none" />
  </svg></div>;
}
