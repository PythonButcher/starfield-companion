import React, { useMemo, useRef, useState } from 'react';
import Star from './Star';

const MINIMAP_SIZE = 200;

const StarMapMinimap = ({ systems, viewBox, bounds, onNavigate }) => {
    const miniRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const scale = useMemo(() => ({
        x: MINIMAP_SIZE / bounds.width,
        y: MINIMAP_SIZE / bounds.height,
    }), [bounds.height, bounds.width]);

    const viewRect = useMemo(() => ({
        x: (viewBox.x - bounds.minX) * scale.x,
        y: (viewBox.y - bounds.minY) * scale.y,
        width: viewBox.width * scale.x,
        height: viewBox.height * scale.y,
    }), [bounds.minX, bounds.minY, scale.x, scale.y, viewBox.height, viewBox.width, viewBox.x, viewBox.y]);

    const positionToSvg = (clientX, clientY) => {
        const svg = miniRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * bounds.width + bounds.minX;
        const y = ((clientY - rect.top) / rect.height) * bounds.height + bounds.minY;
        return { x, y };
    };

    const handleNavigate = (clientX, clientY) => {
        const pos = positionToSvg(clientX, clientY);
        if (!pos) return;
        onNavigate(pos);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleNavigate(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        handleNavigate(e.clientX, e.clientY);
    };

    const stopDragging = () => setIsDragging(false);

    return (
        <div className="minimap-panel shadow-lg" style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(11,12,21,0.9)', border: '1px solid rgba(91, 192, 222, 0.4)', borderRadius: 8, padding: 12 }}>
            <div className="text-xs text-star-white mb-2 opacity-80">Mini-map Overview</div>
            <svg
                ref={miniRef}
                width={MINIMAP_SIZE}
                height={MINIMAP_SIZE}
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', background: 'rgba(255,255,255,0.02)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                onClick={(e) => handleNavigate(e.clientX, e.clientY)}
            >
                {systems.map((system) => (
                    <Star
                        key={system.id}
                        system={system}
                        selected={false}
                        showLabel={false}
                        onClick={() => {}}
                        onContextMenu={(evt) => evt.preventDefault()}
                        onHover={() => {}}
                        dimmed={false}
                    />
                ))}
                <rect
                    x={viewRect.x}
                    y={viewRect.y}
                    width={viewRect.width}
                    height={viewRect.height}
                    fill="none"
                    stroke="var(--color-hud-blue)"
                    strokeWidth={2}
                    pointerEvents="none"
                />
            </svg>
        </div>
    );
};

export default StarMapMinimap;
