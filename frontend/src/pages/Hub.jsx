import React from 'react';
import InteractiveMap from '../components/InteractiveMap';

const Hub = () => {
    return (
        <div className="hub-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ padding: '20px', margin: 0, borderBottom: '1px solid #333' }}>Star Map</h1>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <InteractiveMap />
            </div>
        </div>
    );
};

export default Hub;
