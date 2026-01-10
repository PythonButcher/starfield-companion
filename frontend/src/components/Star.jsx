import React, { memo } from 'react';
import { getStarAppearance } from '../utils/starStyles';

const Star = ({ system, selected, showLabel, onClick, onContextMenu, onHover, dimmed }) => {
    const { color, radius } = getStarAppearance(system.type, system.faction);
    const size = selected ? radius + 2 : radius;

    return (
        <g transform={`translate(${system.x}, ${system.y})`}>
            <g
                onClick={(e) => {
                    if (e.shiftKey) {
                        e.preventDefault();
                        console.log("STAR.JSX SHIFT CLICK fired for:", system?.name);
                        onContextMenu(e, system);
                        return;
                    }
                    onClick(e, system);
                    }}
                    onContextMenu={(e) => {
                    e.preventDefault();
                    console.log("STAR.JSX RIGHT CLICK fired for:", system?.name);
                    onContextMenu(e, system);
                    }}
                    onMouseEnter={() => onHover(system)}
                    onMouseLeave={() => onHover(null)}
                style={{ cursor: 'pointer', opacity: dimmed ? 0.35 : 1, transition: 'opacity 0.2s ease, transform 0.2s ease', transform: dimmed ? 'scale(0.9)' : 'scale(1)' }}
            >
                {selected && (
                    <g className="reticle">
                        <path d="M -15 -15 L -5 -15 M -15 -15 L -15 -5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                    <path d="M 15 -15 L 5 -15 M 15 -15 L 15 -5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                    <path d="M -15 15 L -5 15 M -15 15 L -15 5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                    <path d="M 15 15 L 5 15 M 15 15 L 15 5" stroke="#00d4ff" strokeWidth="2" fill="none" />
                </g>
            )}
            <circle
                r={size}
                fill={color}
                filter="url(#glow)"
                className="star-pulse"
                style={{ '--base-radius': size }}
            />
                {showLabel && (
                    <text y={20} textAnchor="middle" fill="white" fontSize="12" style={{ pointerEvents: 'none' }}>
                        {system.name}
                    </text>
                )}
            </g>
        </g>
    );
};

export default memo(Star);
