import React from 'react';

export const StarTooltip = ({ system }) => {
    if (!system) return null;
    return (
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
            <h4 style={{ margin: '0 0 5px 0', color: '#00d4ff' }}>{system.name}</h4>
            <p style={{ margin: 0, fontSize: '0.9em' }}>{system.faction}</p>
            <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>{system.type} Class</p>
        </div>
    );
};

export const SelectionOverlay = ({ system }) => {
    if (!system) return null;
    return (
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
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '5px' }}>{system.name}</div>
            <div style={{ color: '#aaa', marginBottom: '10px' }}>{system.faction}</div>
            <div style={{ fontSize: '0.9em', lineHeight: '1.4' }}>{system.description}</div>
        </div>
    );
};
