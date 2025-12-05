"use client";

import React, { useState, useRef, useEffect } from 'react';
import universeData from '../lib/data/starfield_universe.json';

const InteractiveMap = () => {
    const svgRef = useRef(null);
    const [viewBox, setViewBox] = useState({ x: -500, y: -500, width: 1000, height: 1000 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredSystem, setHoveredSystem] = useState(null);
    const [selectedSystem, setSelectedSystem] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const systems = universeData;

    const handleWheel = (e) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const direction = e.deltaY > 0 ? 1 : -1;
        const factor = direction === 1 ? scaleFactor : 1 / scaleFactor;

        setViewBox((prev) => ({
            x: prev.x + (prev.width - prev.width * factor) / 2,
            y: prev.y + (prev.height - prev.height * factor) / 2,
            width: prev.width * factor,
            height: prev.height * factor,
        }));
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

            setViewBox((prev) => ({
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

    const handleSystemClick = (e, system) => {
        e.stopPropagation();
        setSelectedSystem(system);
    };

    const handleContextMenu = (e, system) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            system: system,
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    useEffect(() => {
        window.addEventListener('click', closeContextMenu);
        return () => window.removeEventListener('click', closeContextMenu);
    }, []);

    return (
        <div className="star-map-container" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' }}>
            <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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

                {systems.map((system) => (
                    <g
                        key={system.id}
                        transform={`translate(${system.x}, ${system.y})`}
                        onClick={(e) => handleSystemClick(e, system)}
                        onContextMenu={(e) => handleContextMenu(e, system)}
                        onMouseEnter={() => setHoveredSystem(system)}
                        onMouseLeave={() => setHoveredSystem(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        {selectedSystem?.id === system.id && (
                            <g className="reticle">
                                <path d="M -15 -15 L -5 -15 M -15 -15 L -15 -5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                                <path d="M 15 -15 L 5 -15 M 15 -15 L 15 -5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                                <path d="M -15 15 L -5 15 M -15 15 L -15 5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                                <path d="M 15 15 L 5 15 M 15 15 L 15 5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                            </g>
                        )}

                        <circle
                            r={selectedSystem?.id === system.id ? 8 : 5}
                            fill="white"
                            filter="url(#glow)"
                        />

                        {(viewBox.width < 800 || hoveredSystem?.id === system.id || selectedSystem?.id === system.id) && (
                            <text y={20} textAnchor="middle" fill="white" fontSize="12" style={{ pointerEvents: 'none' }}>
                                {system.name}
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            {hoveredSystem && (
                <div
                    className="star-tooltip"
                    style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #333',
                        padding: '10px',
                        borderRadius: '4px',
                        color: 'white',
                        pointerEvents: 'none',
                    }}
                >
                    <h4 style={{ margin: '0 0 5px 0', color: '#00d4ff' }}>{hoveredSystem.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.9em' }}>{hoveredSystem.faction}</p>
                    <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>{hoveredSystem.type} Class</p>
                </div>
            )}

            {selectedSystem && (
                <div
                    className="selection-overlay"
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        backgroundColor: 'rgba(11, 12, 21, 0.9)',
                        border: '1px solid #00d4ff',
                        padding: '20px',
                        borderRadius: '8px',
                        color: 'white',
                        zIndex: 100,
                        minWidth: '200px',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
                    }}
                >
                    <h3 style={{ margin: '0 0 10px 0', color: '#00d4ff', fontSize: '1.2em', borderBottom: '1px solid rgba(0, 212, 255, 0.3)', paddingBottom: '5px' }}>TARGET LOCKED</h3>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '5px' }}>{selectedSystem.name}</div>
                    <div style={{ color: '#aaa', marginBottom: '10px' }}>{selectedSystem.faction}</div>
                    <div style={{ fontSize: '0.9em', lineHeight: '1.4' }}>{selectedSystem.description}</div>
                </div>
            )}

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
