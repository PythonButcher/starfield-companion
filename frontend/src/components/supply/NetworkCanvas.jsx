import { useId, useRef } from 'react';
import usePanZoom from '../../hooks/usePanZoom';
import { Button } from '../ui';

const VIEW = { x: 0, y: 0, width: 1000, height: 570 };
const COLORS = { ready: 'var(--color-success)', shortage: 'var(--color-accent-orange)', broken: 'var(--color-warning-red)', unverified: 'var(--color-muted)', paused: 'var(--color-muted)', pending: 'var(--color-hud-blue)' };

export default function NetworkCanvas({ nodes, links, analysis, selection, onSelect, onMove, connectFrom, onConnect }) {
  const svg = useRef(null); const drag = useRef(null); const moved = useRef(false); const uid = useId().replaceAll(':', '');
  const { viewBox, setViewBox, resetView, screenToSvg, panByPixels, zoomByFactor } = usePanZoom(VIEW, svg);
  const lookup = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const liveNodes = Object.fromEntries((analysis?.nodes || []).map((node) => [node.id, node]));
  const liveLinks = Object.fromEntries((analysis?.links || []).map((link) => [link.id, link]));
  function activate(node) {
    if (connectFrom && connectFrom !== node.id) onConnect(connectFrom, node.id);
    else onSelect({ kind: 'node', id: node.id });
  }
  function fit() {
    if (!nodes.length) return resetView();
    const xs = nodes.map((n) => n.x); const ys = nodes.map((n) => n.y);
    const width = Math.max(700, Math.max(...xs) - Math.min(...xs) + 300);
    const height = Math.max(400, Math.max(...ys) - Math.min(...ys) + 240);
    setViewBox({ x: Math.min(...xs) - 150, y: Math.min(...ys) - 100, width, height });
  }
  return <div className="network-stage">
    <div className="canvas-toolbar"><span className="eyebrow">CARGO TELEMETRY / SCHEMATIC</span><div className="actions">
      <Button variant="ghost" aria-label="Zoom network in" onClick={() => zoomByFactor(0.8)}>+</Button>
      <Button variant="ghost" aria-label="Zoom network out" onClick={() => zoomByFactor(1.25)}>−</Button>
      <Button variant="ghost" onClick={fit}>Fit network</Button>
    </div></div>
    <svg ref={svg} className="network-canvas" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} aria-label="Interactive cargo network" role="group"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.target.closest('[data-route]')) return;
        moved.current = false;
        const nodeId = event.target.closest('[data-node]')?.getAttribute('data-node');
        const point = screenToSvg(event.clientX, event.clientY);
        drag.current = { nodeId, clientX: event.clientX, clientY: event.clientY, point,
          x: nodeId ? lookup[nodeId].x : 0, y: nodeId ? lookup[nodeId].y : 0 };
        svg.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current) return;
        if (Math.abs(event.clientX - current.clientX) + Math.abs(event.clientY - current.clientY) < 4 && !moved.current) return;
        moved.current = true;
        if (current.nodeId && current.point) {
          const point = screenToSvg(event.clientX, event.clientY);
          if (point) onMove(current.nodeId, Math.round(Math.max(-10000, Math.min(10000, current.x + point.x - current.point.x))),
            Math.round(Math.max(-10000, Math.min(10000, current.y + point.y - current.point.y))));
        } else {
          panByPixels(event.clientX - current.clientX, event.clientY - current.clientY);
          drag.current = { ...current, clientX: event.clientX, clientY: event.clientY };
        }
      }}
      onPointerUp={(event) => {
        const current = drag.current;
        if (current?.nodeId && !moved.current) activate(lookup[current.nodeId]);
        drag.current = null;
        if (svg.current.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
      }} onPointerCancel={() => { drag.current = null; }}>
      <defs><pattern id={`grid-${uid}`} width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="var(--color-hairline)" /></pattern>
        {Object.entries(COLORS).map(([status, color]) => <marker key={status} id={`arrow-${uid}-${status}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>)}
      </defs>
      <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill={`url(#grid-${uid})`} />
      {links.map((link) => {
        const from = lookup[link.source]; const to = lookup[link.target]; if (!from || !to) return null;
        const status = liveLinks[link.id]?.status || 'pending';
        const leftToRight = from.x <= to.x; const offset = leftToRight ? 112 : -112;
        const d = `M ${from.x + offset} ${from.y} C ${from.x + offset * 1.8} ${from.y}, ${to.x - offset * 1.8} ${to.y}, ${to.x - offset} ${to.y}`;
        return <g key={link.id} data-route={link.id} className={`cargo-path ${selection?.id === link.id ? 'selected' : ''}`} role="button" tabIndex="0" aria-label={`Inspect route ${from.name} to ${to.name}: ${status}`}
          onClick={() => onSelect({ kind: 'link', id: link.id })} onKeyDown={(event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect({ kind: 'link', id: link.id }); } }}>
          <path d={d} fill="none" stroke="transparent" strokeWidth="22" />
          <path className={status === 'ready' ? 'flowing' : ''} d={d} fill="none" stroke={COLORS[status]} strokeWidth="2" strokeDasharray={status === 'ready' ? '7 6' : '4 5'} markerEnd={`url(#arrow-${uid}-${status})`} />
          <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 12} textAnchor="middle">{link.resources.map((r) => r.resource).join(' + ') || 'Awaiting manifest'}</text>
        </g>;
      })}
      {nodes.map((node) => {
        const live = liveNodes[node.id] || node; const selected = selection?.id === node.id;
        return <g key={node.id} data-node={node.id} transform={`translate(${node.x} ${node.y})`} className={`cargo-node ${selected ? 'selected' : ''} ${connectFrom === node.id ? 'connecting' : ''}`}
          role="button" tabIndex="0" aria-label={`Outpost node ${live.name}`} aria-pressed={selected}
          onKeyDown={(event) => {
            if (['Enter', ' '].includes(event.key)) { event.preventDefault(); activate(node); }
            const directions = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, -15], ArrowDown: [0, 15] };
            if (directions[event.key]) { event.preventDefault(); onMove(node.id, Math.max(-10000, Math.min(10000, node.x + directions[event.key][0])), Math.max(-10000, Math.min(10000, node.y + directions[event.key][1]))); }
          }}>
          <rect x="-110" y="-46" width="220" height="92" rx="4" />
          <circle cx="-91" cy="-25" r="4" fill={live.issues?.length ? COLORS.broken : COLORS.ready} />
          <text x="-80" y="-21" className="node-system">{(live.system || 'UNCHARTED').toUpperCase()}</text>
          <text x="-92" y="3" className="node-name">{live.name.length > 24 ? live.name.slice(0, 22) + '…' : live.name}</text>
          <text x="-92" y="27" className="node-resources">{live.production.map((r) => r.resource).join(' · ').slice(0, 29) || 'Receiving / staging depot'}</text>
          <circle cx="110" cy="0" r="5" className="node-port" /><circle cx="-110" cy="0" r="5" className="node-port" />
        </g>;
      })}
    </svg>
    <div className="canvas-caption"><span>{connectFrom ? 'CONNECT MODE · choose the destination outpost' : 'Drag sites to place · drag space to pan · arrow keys move a focused site'}</span><span>{nodes.length} SITES / {links.length} ROUTES</span></div>
  </div>;
}
