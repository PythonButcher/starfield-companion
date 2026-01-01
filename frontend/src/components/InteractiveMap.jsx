import React, { useEffect, useMemo, useRef, useState } from 'react';
import universeData from '../../../backend/data/starfield_universe.json';
import { useSelectedSystems } from '../context/SelectedSystemsContext';
import Star from './Star';
import { SelectionOverlay, StarTooltip } from './StarInfoOverlays';
import StarMapMinimap from './StarMapMinimap';
import usePanZoom from '../hooks/usePanZoom';
import { getLegendEntries } from '../utils/starStyles';

const INITIAL_VIEW_STATE = { x: -500, y: -500, width: 1000, height: 1000 };
const ZOOM_FACTOR = 1.1;
const KEYBOARD_ZOOM = 1.25;
const NUDGE_AMOUNT = 40;
const ROUTE_PLANNING_ENABLED = true;

const InteractiveMap = () => {
    const svgRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredSystem, setHoveredSystem] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showMinimap, setShowMinimap] = useState(true);
    const [factionFilter, setFactionFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [routeEnabled, setRouteEnabled] = useState(false);
    const [routeSystems, setRouteSystems] = useState([]);
    const { selectedSystem, selectSystem, clearSystem } = useSelectedSystems();

    const systems = universeData;

    const { viewBox, setViewBox, resetView, panByPixels, zoomByFactor, screenToSvg } = usePanZoom(INITIAL_VIEW_STATE, svgRef);

    const systemBounds = useMemo(() => {
        const xs = systems.map((s) => s.x);
        const ys = systems.map((s) => s.y);
        const minX = Math.min(...xs) - 200;
        const maxX = Math.max(...xs) + 200;
        const minY = Math.min(...ys) - 200;
        const maxY = Math.max(...ys) + 200;
        return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    }, [systems]);

    const uniqueFactions = useMemo(() => ['all', ...new Set(systems.map((s) => s.faction).filter(Boolean))], [systems]);
    const uniqueTypes = useMemo(() => ['all', ...new Set(systems.map((s) => s.type).filter(Boolean))], [systems]);

    const filteredSystems = useMemo(() => systems.map((system) => {
        const factionMatch = factionFilter === 'all' || system.faction === factionFilter;
        const typeMatch = typeFilter === 'all' || system.type === typeFilter;
        return { ...system, visible: factionMatch && typeMatch };
    }), [factionFilter, systems, typeFilter]);

    const handleWheel = (e) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? 1 : -1;
        const factor = direction === 1 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        const centerPoint = screenToSvg(e.clientX, e.clientY);
        zoomByFactor(factor, centerPoint);
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            panByPixels(dx, dy);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleBackgroundClick = (e) => {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
            resetView();
            clearSystem();
        }
    };

    const handleSystemClick = (e, system) => {
        e.stopPropagation();
        if (ROUTE_PLANNING_ENABLED && routeEnabled && e.shiftKey) {
            setRouteSystems((prev) => [...prev, system]);
            return;
        }
        selectSystem(system);
    };

    const handleContextMenu = (e, system) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            system,
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    useEffect(() => {
        window.addEventListener('click', closeContextMenu);
        return () => window.removeEventListener('click', closeContextMenu);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                resetView();
                clearSystem();
            }
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomByFactor(1 / KEYBOARD_ZOOM);
            }
            if (e.key === '-') {
                e.preventDefault();
                zoomByFactor(KEYBOARD_ZOOM);
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                setViewBox((prev) => ({
                    ...prev,
                    x: e.key === 'ArrowLeft' ? prev.x - NUDGE_AMOUNT : e.key === 'ArrowRight' ? prev.x + NUDGE_AMOUNT : prev.x,
                    y: e.key === 'ArrowUp' ? prev.y - NUDGE_AMOUNT : e.key === 'ArrowDown' ? prev.y + NUDGE_AMOUNT : prev.y,
                }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [clearSystem, resetView, setViewBox, zoomByFactor]);

    useEffect(() => {
        if (selectedSystem) {
            const targetWidth = 400;
            const targetHeight = 400;
            setViewBox({
                x: selectedSystem.x - targetWidth / 2,
                y: selectedSystem.y - targetHeight / 2,
                width: targetWidth,
                height: targetHeight,
            });
        }
    }, [selectedSystem, setViewBox]);

    const legendEntries = useMemo(() => getLegendEntries(), []);

    const totalRouteDistance = useMemo(() => {
        if (routeSystems.length < 2) return 0;
        let distance = 0;
        for (let i = 1; i < routeSystems.length; i += 1) {
            const prev = routeSystems[i - 1];
            const curr = routeSystems[i];
            distance += Math.hypot(curr.x - prev.x, curr.y - prev.y);
        }
        return distance;
    }, [routeSystems]);

    const handleNavigateFromMinimap = (point) => {
        setViewBox((prev) => ({
            ...prev,
            x: point.x - prev.width / 2,
            y: point.y - prev.height / 2,
        }));
    };

    const controls = (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button className="hud-button" onClick={() => zoomByFactor(1 / ZOOM_FACTOR)}>＋</button>
            <button className="hud-button" onClick={() => zoomByFactor(ZOOM_FACTOR)}>−</button>
            <button className="hud-button" onClick={resetView}>Reset</button>
            {ROUTE_PLANNING_ENABLED && (
                <button
                    className={`hud-button ${routeEnabled ? 'bg-hud-blue/20 border-hud-blue' : ''}`}
                    onClick={() => setRouteEnabled((prev) => !prev)}
                >
                    Route
                </button>
            )}
        </div>
    );

    const filterControls = (
        <div className="absolute top-4 left-4 flex gap-3 bg-[rgba(11,12,21,0.8)] border border-[rgba(91,192,222,0.3)] rounded-lg p-3 backdrop-blur z-20">
            <div className="flex flex-col text-xs text-star-white gap-1">
                <label className="opacity-70">Faction</label>
                <select
                    value={factionFilter}
                    onChange={(e) => setFactionFilter(e.target.value)}
                    className="bg-transparent border border-[rgba(91,192,222,0.4)] rounded px-2 py-1 text-star-white"
                >
                    {uniqueFactions.map((faction) => (
                        <option key={faction} value={faction} className="bg-space-black">{faction}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col text-xs text-star-white gap-1">
                <label className="opacity-70">Spectral Type</label>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent border border-[rgba(91,192,222,0.4)] rounded px-2 py-1 text-star-white"
                >
                    {uniqueTypes.map((type) => (
                        <option key={type} value={type} className="bg-space-black">{type}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col justify-between text-xs text-star-white gap-1">
                <button
                    className="hud-button"
                    onClick={() => setShowMinimap((prev) => !prev)}
                >
                    {showMinimap ? 'Hide Mini-map' : 'Show Mini-map'}
                </button>
                <div className="text-[10px] opacity-70">Zoom: mouse wheel, +/- keys. Pan: drag or arrows.</div>
            </div>
        </div>
    );

    const legend = (
        <div className="absolute bottom-4 right-4 bg-[rgba(11,12,21,0.85)] border border-[rgba(91,192,222,0.3)] rounded-lg p-3 text-star-white text-xs backdrop-blur z-20">
            <div className="font-semibold mb-2 text-[11px] tracking-wide">Legend</div>
            <div className="flex flex-col gap-2">
                {legendEntries.map((entry) => (
                    <div key={entry.label} className="flex items-center gap-2">
                        <span
                            className="inline-block rounded-full"
                            style={{ width: entry.radius * 2, height: entry.radius * 2, backgroundColor: entry.color, boxShadow: '0 0 8px rgba(91,192,222,0.4)' }}
                        />
                        <span>{entry.label}</span>
                    </div>
                ))}
                {ROUTE_PLANNING_ENABLED && routeEnabled && (
                    <div className="pt-2 border-t border-[rgba(91,192,222,0.2)]">Route Distance: {totalRouteDistance.toFixed(1)} ly</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="star-map-container" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' }}>
            {filterControls}
            {controls}
            {legend}
            {showMinimap && (
                <StarMapMinimap
                    systems={systems}
                    viewBox={viewBox}
                    bounds={systemBounds}
                    onNavigate={handleNavigateFromMinimap}
                />
            )}
            <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleBackgroundClick}
            >
                <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                    </pattern>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <rect x={viewBox.x - 5000} y={viewBox.y - 5000} width="10000" height="10000" fill="url(#grid)" />

                {ROUTE_PLANNING_ENABLED && routeEnabled && routeSystems.length > 1 && (
                    <polyline
                        points={routeSystems.map((s) => `${s.x},${s.y}`).join(' ')}
                        fill="none"
                        stroke="var(--color-hud-blue)"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                    />
                )}

                {filteredSystems.map((system) => (
                    <Star
                        key={system.id}
                        system={system}
                        selected={selectedSystem?.id === system.id}
                        showLabel={viewBox.width < 800 || hoveredSystem?.id === system.id || selectedSystem?.id === system.id}
                        onClick={handleSystemClick}
                        onContextMenu={handleContextMenu}
                        onHover={setHoveredSystem}
                        dimmed={!system.visible}
                    />
                ))}
            </svg>

            <StarTooltip system={hoveredSystem} />
            <SelectionOverlay system={selectedSystem} />

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{
                        position: 'absolute',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        zIndex: 1000,
                        minWidth: '150px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', color: '#888', fontSize: '0.8em' }}>
                        {contextMenu.system.name} Actions
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li className="menu-item" onClick={() => console.log('Plot Course to', contextMenu.system.name)}>Plot Course</li>
                        <li className="menu-item" onClick={() => console.log('Add Log for', contextMenu.system.name)}>Add Log</li>
                        <li className="menu-item" onClick={() => console.log('View Profile of', contextMenu.system.name)}>View Planet Profile</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InteractiveMap;
