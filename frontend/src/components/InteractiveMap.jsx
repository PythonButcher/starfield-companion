import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectedSystems } from '../context/systems';
import { ResourceState, EmptyState } from './ui';
import { useResource } from '../hooks/useResource';
import Star from './Star';
import { StarTooltip } from './StarInfoOverlays';
import SystemInspector from './SystemInspector';
import StarMapMinimap from './StarMapMinimap';
import ContextMenu from '../context/ContextMenu';
import usePanZoom from '../hooks/usePanZoom';
const INITIAL = { x: -1150, y: -950, width: 2300, height: 1900 };
const SECTORS = new Set(['Sol', 'Alpha Centauri', 'Cheyenne', 'Volii', 'Narion', 'Kryx', 'Porrima', 'Olympus', 'Bessel']);
export default function InteractiveMap() {
  const [params] = useSearchParams();
  const systemName = params.get('system');
  const activity = useResource('/api/hub/map_activity');
  const [activityFilter, setActivityFilter] = useState('all');
  const { systems, resource, selectedSystem, selectSystem, clearSystem } = useSelectedSystems();
  const svgRef = useRef(null); const drag = useRef(null);
  const [dragging, setDragging] = useState(false); const [hovered, setHovered] = useState(null);
  const [menu, setMenu] = useState(null); const [minimap, setMinimap] = useState(true);
  const [faction, setFaction] = useState('all'); const [type, setType] = useState('all');
  const [routing, setRouting] = useState(false); const [route, setRoute] = useState([]);
  const navigate = useNavigate();
  const { viewBox, setViewBox, resetView, screenToSvg, panByPixels, zoomByFactor } = usePanZoom(INITIAL, svgRef);
  useEffect(() => {
    const system = systems.find((s) => s.name.toLowerCase() === systemName?.toLowerCase());
    if (system) selectSystem(system);
  }, [systems, systemName, selectSystem]);
  const bounds = useMemo(() => {
    const xs = systems.map((s) => s.x); const ys = systems.map((s) => s.y);
    const minX = Math.min(-450, ...xs) - 100; const maxX = Math.max(450, ...xs) + 100;
    const minY = Math.min(-400, ...ys) - 100; const maxY = Math.max(400, ...ys) + 100;
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [systems]);
  useEffect(() => {
    if (!selectedSystem) return;
    const frame = requestAnimationFrame(() => setViewBox({ x: selectedSystem.x - 200, y: selectedSystem.y - 200, width: 400, height: 400 }));
    return () => cancelAnimationFrame(frame);
  }, [selectedSystem, setViewBox]);
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event) => { event.preventDefault(); zoomByFactor(event.deltaY > 0 ? 1.1 : 1 / 1.1, screenToSvg(event.clientX, event.clientY)); };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [resource.loading, resource.error, screenToSvg, zoomByFactor]);
  function keydown(event) {
    if (event.target.closest('button,select,a')) return;
    if (['+', '=', '-', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') zoomByFactor(.8);
    if (event.key === '-') zoomByFactor(1.25);
    if (event.key === 'Escape') { resetView(); clearSystem(); setMenu(null); }
    if (event.key.startsWith('Arrow')) setViewBox((old) => ({ ...old, x: old.x + (event.key === 'ArrowLeft' ? -40 : event.key === 'ArrowRight' ? 40 : 0), y: old.y + (event.key === 'ArrowUp' ? -40 : event.key === 'ArrowDown' ? 40 : 0) }));
  }
  function clickStar(event, system) {
    event.stopPropagation();
    if (drag.current?.moved) return;
    if (routing && event.shiftKey) setRoute((old) => [...old, system]);
    else selectSystem(system);
  }
  function action(command, context) {
    setMenu(null);
    if (command === 'plot_course') selectSystem(context.system);
    else if (command === 'navigate_to_journal') navigate('/journal/new?system=' + encodeURIComponent(context.system.name));
    else navigate('/galaxy?system=' + encodeURIComponent(context.system.name));
  }
  const distance = route.slice(1).reduce((total, system, index) => total + Math.hypot(system.x - route[index].x, system.y - route[index].y), 0);
  return <ResourceState resource={resource}>{!systems.length ? <EmptyState title="No systems catalogued" /> : <div className="galaxy-map-layout"><div className="star-map-container" onKeyDown={keydown}>
    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[70%]">
      <label className="toolbar-label">Activity<select aria-label="Map activity" className="hud-select block" disabled={activity.loading || !!activity.error} value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}><option value="all">All systems</option><option value="outposts">My outposts</option><option value="missions">Active missions</option></select></label>
      {activity.error && <button className="hud-button" onClick={activity.reload}>Retry activity filters</button>}
      <label className="toolbar-label">Faction<select aria-label="Map faction" className="hud-select block" value={faction} onChange={(e) => setFaction(e.target.value)}>{['all', ...new Set(systems.map((s) => s.faction))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="toolbar-label">Spectral type<select aria-label="Map spectral type" className="hud-select block" value={type} onChange={(e) => setType(e.target.value)}>{['all', ...new Set(systems.map((s) => s.type))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="hud-button" onClick={() => setMinimap(!minimap)}>{minimap ? 'Hide' : 'Show'} mini-map</button>
    </div>
    <div className="absolute right-4 top-4 z-20 flex flex-col gap-2"><button className="hud-button" aria-label="Zoom in" onClick={() => zoomByFactor(.8)}>+</button><button className="hud-button" aria-label="Zoom out" onClick={() => zoomByFactor(1.25)}>−</button><button className="hud-button" onClick={() => { resetView(); clearSystem(); }}>Reset</button><button className="hud-button" aria-pressed={routing} onClick={() => setRouting(!routing)}>Route {routing ? 'on' : 'off'}</button></div>
    <svg aria-label="Interactive star map. Drag to pan, scroll to zoom, or focus and use arrow keys." tabIndex={0} ref={svgRef} viewBox={Object.values(viewBox).join(' ')} className={'star-map-svg ' + (dragging ? 'dragging' : '')}
      onPointerDown={(e) => { if (e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, total: 0, moved: false }; setDragging(true); }}
      onPointerMove={(e) => { if (!dragging || !drag.current) return; const dx = e.clientX - drag.current.x; const dy = e.clientY - drag.current.y; drag.current.total += Math.hypot(dx, dy); drag.current.moved = drag.current.total > 4; panByPixels(dx, dy); drag.current.x = e.clientX; drag.current.y = e.clientY; }}
      onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)}
      onDoubleClick={() => { resetView(); clearSystem(); }}>
      <defs><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="#aab5c0" strokeOpacity=".07" /></pattern><filter id="glow"><feGaussianBlur stdDeviation="1.8" /></filter></defs>
      <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />
      {route.length > 1 && <polyline points={route.map((s) => s.x + ',' + s.y).join(' ')} fill="none" stroke="#e9a76a" strokeWidth="2" strokeDasharray="6 6" />}
      {systems.map((system) => <Star key={system.id} system={system} selected={selectedSystem?.id === system.id}
        showLabel={viewBox.width < 1100 || SECTORS.has(system.name) || selectedSystem?.id === system.id}
        dimmed={(activityFilter !== 'all' && !activity.data?.[activityFilter]?.includes(system.name)) || (faction !== 'all' && system.faction !== faction) || (type !== 'all' && system.type !== type)} onClick={clickStar} onHover={setHovered} onContextMenu={(e, value) => { e.preventDefault(); setMenu({ x: Math.min(e.clientX, window.innerWidth - 300), y: Math.min(e.clientY, window.innerHeight - 320), system: value }); }} />)}
    </svg>
    {minimap && <StarMapMinimap systems={systems} viewBox={viewBox} bounds={bounds} onNavigate={(point) => setViewBox((old) => ({ ...old, x: point.x - old.width / 2, y: point.y - old.height / 2 }))} />}
    <StarTooltip system={hovered} />
    <div className="absolute bottom-4 right-4 text-xs bg-space-black/90 p-2 max-w-[210px] text-muted"><p>Map positions are approximate.</p>{routing ? <><p>Shift-click stars to plan. {distance.toFixed(0)} map units.</p><button className="hud-button mt-2" onClick={() => setRoute([])}>Clear route</button></> : <p>Scroll to zoom • Drag to pan</p>}</div>
    <ContextMenu context={menu} onAction={action} />
  </div>{selectedSystem ? <SystemInspector key={selectedSystem.id} system={selectedSystem} /> :
    <aside className="system-inspector stack"><p className="eyebrow">Settled Systems / Navigation</p><h2>Select a star</h2><p className="muted">Inspect orbiting worlds, survey readings and local operations.</p><p className="small muted">Sector positions are schematic. Zoom in for labels, or use system search above.</p><div className="stack">{['Sol', 'Alpha Centauri', 'Narion', 'Cheyenne', 'Volii'].map((name) => <button className="hud-button" key={name} onClick={() => selectSystem(systems.find((s) => s.name === name))}>{name} ↗</button>)}</div></aside>}
  </div>}</ResourceState>;
}
