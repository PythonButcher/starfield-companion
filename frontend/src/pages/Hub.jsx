import React from 'react';

const Hub = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
            <h1 className="text-4xl font-bold text-hud-blue mb-4 animate-pulse">EXPLORER'S HUB</h1>
            <div className="border border-hud-blue/50 p-8 rounded bg-space-black/80 backdrop-blur-sm">
                <p className="text-xl text-star-white tracking-widest">STAR MAP INITIALIZING...</p>
            </div>
        </div>
    );
};

export default Hub;
