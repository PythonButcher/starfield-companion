import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, circOut, motion } from 'framer-motion';
import universeData from '../../../backend/data/starfield_universe.json';
import { useSelectedSystems } from '../context/SelectedSystemsContext';

const factionPalette = {
    'United Colonies': '#65d8ff',
    'Freestar Collective': '#f4c06b',
    'Ryujin Industries': '#ff5d8f',
    'Crimson Fleet': '#ff7b5f',
};

const spectralPalette = {
    A: '#c5c6ff',
    B: '#9be7ff',
    F: '#fff3c7',
    G: '#9df0c4',
    K: '#ffdf9f',
    M: '#ffb6a1',
};

const getFactionColor = (faction) => factionPalette[faction] || '#9c7bff';

const getTypeColor = (type) => {
    if (!type) return '#e2e2e2';
    const key = type[0].toUpperCase();
    return spectralPalette[key] || '#7cf7d4';
};

const mulberry32 = (a) => {
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const generateOrbits = (systemId) => {
    const rand = mulberry32(systemId * 9973);
    const orbitCount = 2 + Math.floor(rand() * 3);
    const orbits = [];

    for (let i = 0; i < orbitCount; i += 1) {
        const radius = 18 + rand() * 60 + i * 8;
        const angle = rand() * Math.PI * 2;
        const planetSize = 3 + rand() * 2.5;
        orbits.push({ radius, angle, planetSize });
    }

    return orbits;
};

const clampView = (box) => ({
    ...box,
    width: Math.max(60, box.width),
    height: Math.max(60, box.height),
});

const InteractiveMap = () => {
    const svgRef = useRef(null);
    const INITIAL_VIEW_STATE = { x: -500, y: -500, width: 1000, height: 1000 };
    const [viewBox, setViewBox] = useState(INITIAL_VIEW_STATE);
    const [viewBoxTarget, setViewBoxTarget] = useState(INITIAL_VIEW_STATE);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredSystem, setHoveredSystem] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [pulses, setPulses] = useState([]);
    const { selectedSystem, selectSystem, clearSystem } = useSelectedSystems();

    const systems = universeData;

    useEffect(() => {
        const controls = animate(viewBox, viewBoxTarget, {
            duration: 0.45,
            ease: circOut,
            onUpdate: (latest) => setViewBox(latest),
        });

        return () => controls.stop();
    }, [viewBoxTarget]);

    const handleWheel = (e) => {
        e.preventDefault();
        const scaleFactor = 1.08;
        const direction = e.deltaY > 0 ? 1 : -1;
        const factor = direction === 1 ? scaleFactor : 1 / scaleFactor;

        setViewBoxTarget((prev) => {
            const width = prev.width * factor;
            const height = prev.height * factor;

            return clampView({
                x: prev.x + (prev.width - width) / 2,
                y: prev.y + (prev.height - height) / 2,
                width,
                height,
            });
        });
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
            const svg = svgRef.current;
            const scaleX = viewBox.width / svg.clientWidth;
            const scaleY = viewBox.height / svg.clientHeight;

            setViewBoxTarget((prev) => ({
                ...prev,
                x: prev.x - dx * scaleX,
                y: prev.y - dy * scaleY,
            }));

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
        }
    };

    const resetView = () => {
        clearSystem();
        setViewBoxTarget(INITIAL_VIEW_STATE);
    };

    const handleSystemClick = (e, system) => {
        e.stopPropagation();
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

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    useEffect(() => {
        window.addEventListener('click', closeContextMenu);
        return () => window.removeEventListener('click', closeContextMenu);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                resetView();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (selectedSystem) {
            const targetWidth = 400;
            const targetHeight = 400;

            setViewBoxTarget({
                x: selectedSystem.x - targetWidth / 2,
                y: selectedSystem.y - targetHeight / 2,
                width: targetWidth,
                height: targetHeight,
            });
        }
    }, [selectedSystem]);

    const isDeepScan = selectedSystem && viewBox.width < 300;
    const ghostOrbits = useMemo(
        () => (selectedSystem ? generateOrbits(selectedSystem.id) : []),
        [selectedSystem]
    );

    const zoomReveal = Math.min(1, 1000 / viewBox.width);
    const gravityStroke = 0.45 + zoomReveal * 3;
    const gravityOpacity = 0.08 + zoomReveal * 0.35;
    const warpScale = 6 + zoomReveal * 10;

    const triggerPulse = useCallback(() => {
        if (!selectedSystem) return;
        const pulseId = Date.now();
        const hue = getFactionColor(selectedSystem.faction);

        setPulses((prev) => [
            ...prev,
            {
                id: pulseId,
                x: selectedSystem.x,
                y: selectedSystem.y,
                color: hue,
            },
        ]);

        setTimeout(() => {
            setPulses((prev) => prev.filter((pulse) => pulse.id !== pulseId));
        }, 1600);
    }, [selectedSystem]);

    const tacticalDistance = selectedSystem
        ? Math.hypot(selectedSystem.x, selectedSystem.y).toFixed(1)
        : null;

    return (
        <div
            className="star-map-container"
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: 'transparent',
            }}
        >
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
                    <pattern id="warpGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                        <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
                    </pattern>
                    <filter id="grid-warp" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.003 0.09"
                            numOctaves="2"
                            seed="3"
                            result="noise"
                        />
                        <feGaussianBlur in="noise" stdDeviation="0.6" result="blurred" />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="blurred"
                            scale={warpScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="scanlines" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
                        <feTurbulence type="fractalNoise" baseFrequency="0 0.8" numOctaves="1" result="scan" />
                        <feComposite
                            in="SourceGraphic"
                            in2="scan"
                            operator="arithmetic"
                            k1="1"
                            k2="-0.15"
                            k3="0.15"
                            k4="0"
                        />
                    </filter>
                </defs>

                <g filter="url(#scanlines)">
                    <rect
                        x={viewBox.x - 6000}
                        y={viewBox.y - 6000}
                        width="12000"
                        height="12000"
                        fill="url(#warpGrid)"
                        filter="url(#grid-warp)"
                        opacity="0.8"
                    />

                    {pulses.map((pulse) => (
                        <motion.circle
                            key={pulse.id}
                            cx={pulse.x}
                            cy={pulse.y}
                            r={12}
                            stroke={pulse.color}
                            strokeWidth={2}
                            fill="none"
                            initial={{ r: 8, opacity: 0.35 }}
                            animate={{ r: 900, opacity: 0 }}
                            transition={{ duration: 1.4, ease: 'easeOut' }}
                        />
                    ))}

                    {selectedSystem && (
                        <g>
                            <line
                                x1={0}
                                y1={0}
                                x2={selectedSystem.x}
                                y2={selectedSystem.y}
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth={1.5}
                                strokeDasharray="8 10"
                            >
                                <animate attributeName="stroke-dashoffset" from="0" to="24" dur="2.5s" repeatCount="indefinite" />
                            </line>
                            {tacticalDistance && (
                                <g transform={`translate(${selectedSystem.x / 2}, ${selectedSystem.y / 2})`}>
                                    <rect
                                        x={-45}
                                        y={-18}
                                        width={90}
                                        height={28}
                                        rx={6}
                                        fill="rgba(11,12,21,0.8)"
                                        stroke="rgba(255,255,255,0.25)"
                                        strokeWidth={1}
                                    />
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill="#d8f2ff"
                                        fontSize="11"
                                        letterSpacing="1"
                                    >
                                        {tacticalDistance} LY
                                    </text>
                                </g>
                            )}
                        </g>
                    )}

                    {systems.map((system) => {
                        const spectralColor = getTypeColor(system.type);
                        const factionColor = getFactionColor(system.faction);
                        const isSelected = selectedSystem?.id === system.id;
                        const labelVisible = viewBox.width < 850 || hoveredSystem?.id === system.id || isSelected;
                        const gravityRadius = 28 + (system.id % 5) * 6;

                        return (
                            <g
                                key={system.id}
                                transform={`translate(${system.x}, ${system.y})`}
                                onClick={(e) => handleSystemClick(e, system)}
                                onContextMenu={(e) => handleContextMenu(e, system)}
                                onMouseEnter={() => setHoveredSystem(system)}
                                onMouseLeave={() => setHoveredSystem(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle
                                    r={gravityRadius}
                                    fill="none"
                                    stroke={factionColor}
                                    strokeDasharray="10 8"
                                    strokeWidth={gravityStroke}
                                    opacity={gravityOpacity}
                                />
                                <circle
                                    r={gravityRadius * 1.4}
                                    fill="none"
                                    stroke={spectralColor}
                                    strokeDasharray="2 10"
                                    strokeWidth={gravityStroke * 0.6}
                                    opacity={gravityOpacity * 0.7}
                                />

                                {isDeepScan && isSelected && (
                                    <g>
                                        {ghostOrbits.map((orbit, index) => {
                                            const planetX = Math.cos(orbit.angle) * orbit.radius;
                                            const planetY = Math.sin(orbit.angle) * orbit.radius;

                                            return (
                                                <g key={`${orbit.radius}-${index}`}>
                                                    <circle
                                                        r={orbit.radius}
                                                        fill="none"
                                                        stroke={spectralColor}
                                                        opacity={0.35}
                                                        strokeDasharray="6 6"
                                                    />
                                                    <circle
                                                        cx={planetX}
                                                        cy={planetY}
                                                        r={orbit.planetSize}
                                                        fill={factionColor}
                                                        opacity={0.85}
                                                        filter="url(#glow)"
                                                    />
                                                </g>
                                            );
                                        })}
                                    </g>
                                )}

                                {isSelected && (
                                    <g className="reticle">
                                        <path
                                            d="M -16 -16 L -6 -16 M -16 -16 L -16 -6"
                                            stroke={factionColor}
                                            strokeWidth={2.2}
                                            fill="none"
                                        />
                                        <path
                                            d="M 16 -16 L 6 -16 M 16 -16 L 16 -6"
                                            stroke={factionColor}
                                            strokeWidth={2.2}
                                            fill="none"
                                        />
                                        <path
                                            d="M -16 16 L -6 16 M -16 16 L -16 6"
                                            stroke={factionColor}
                                            strokeWidth={2.2}
                                            fill="none"
                                        />
                                        <path
                                            d="M 16 16 L 6 16 M 16 16 L 16 6"
                                            stroke={factionColor}
                                            strokeWidth={2.2}
                                            fill="none"
                                        />
                                    </g>
                                )}

                                <circle
                                    r={isSelected ? 9 : 6}
                                    fill={spectralColor}
                                    stroke={factionColor}
                                    strokeWidth={isSelected ? 1.8 : 1}
                                    filter="url(#glow)"
                                />

                                {labelVisible && (
                                    <text
                                        y={22}
                                        textAnchor="middle"
                                        fill="#e6f7ff"
                                        fontSize="12"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {system.name}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>

                <rect
                    x={viewBox.x - 6000}
                    y={viewBox.y - 6000}
                    width="12000"
                    height="12000"
                    fill="none"
                    pointerEvents="none"
                    filter="url(#scanlines)"
                    opacity="0.35"
                />
            </svg>

            {hoveredSystem && (
                <div
                    className="star-tooltip"
                    style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        backgroundColor: 'rgba(8, 10, 18, 0.92)',
                        border: '1px solid #1d2638',
                        padding: '10px',
                        borderRadius: '6px',
                        color: 'white',
                        pointerEvents: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                >
                    <h4
                        style={{
                            margin: '0 0 5px 0',
                            color: getFactionColor(hoveredSystem.faction),
                            letterSpacing: '1px',
                        }}
                    >
                        {hoveredSystem.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9em' }}>{hoveredSystem.faction}</p>
                    <p style={{ margin: 0, fontSize: '0.8em', color: '#9db3c6' }}>{hoveredSystem.type} Class</p>
                </div>
            )}

            {selectedSystem && (
                <div
                    className="selection-overlay"
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: 'linear-gradient(145deg, rgba(11,12,21,0.92) 0%, rgba(18,24,38,0.96) 100%)',
                        border: `1px solid ${getFactionColor(selectedSystem.faction)}`,
                        padding: '20px',
                        borderRadius: '10px',
                        color: 'white',
                        zIndex: 100,
                        minWidth: '240px',
                        boxShadow: '0 0 25px rgba(0, 212, 255, 0.25)',
                        backdropFilter: 'blur(6px)',
                        fontFamily: '"IBM Plex Mono", monospace',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', letterSpacing: '0.2rem', color: '#9db3c6' }}>TACTICAL READOUT</div>
                        <span
                            style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#8ef2ff',
                                fontSize: '0.75rem',
                            }}
                        >
                            LOCKED
                        </span>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '1.35rem', fontWeight: 700 }}>
                        {selectedSystem.name}
                    </div>
                    <div style={{ color: '#9db3c6', marginTop: '4px', fontSize: '0.95rem' }}>
                        {selectedSystem.faction} • {selectedSystem.type} Class
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {selectedSystem.description}
                    </div>
                    {tacticalDistance && (
                        <div style={{ marginTop: '10px', color: '#8ef2ff', fontSize: '0.9rem' }}>
                            Distance from Origin: {tacticalDistance} light years
                        </div>
                    )}
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={triggerPulse}
                            style={{
                                flex: 1,
                                background: 'linear-gradient(90deg, rgba(101,216,255,0.2), rgba(101,216,255,0.05))',
                                color: '#c4f3ff',
                                border: `1px solid ${getFactionColor(selectedSystem.faction)}`,
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 600,
                            }}
                        >
                            Scan for Resources
                        </button>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{
                        position: 'absolute',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: '#0b0e18',
                        border: '1px solid #2b3245',
                        borderRadius: '6px',
                        zIndex: 1000,
                        minWidth: '150px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #1f2638', color: '#8ef2ff', fontSize: '0.8em' }}>
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
