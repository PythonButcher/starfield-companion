import React, { useEffect, useState } from 'react'

// StarDate component
const StardateClock = () => {
    const [time, setTime] = useState(new Date());

    // Update time every second
    // effet pour mettre a jour le temps chaque seconde
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        // nettoyage du setintervale au demontage du composant
        return clearInterval(interval)
    }, [])


    // Formatting for the sci-fi look
    const formattedTime = time.toLocaleTimeString([], { hour12: false });
    const formattedDate = time.toLocaleDateString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '.');


    return (
        <div className="border border-hud-blue/50 bg-gray-900/80 p-4 rounded text-center shadow-[0_0_10px_rgba(91,192,222,0.1)] min-w-[200px]">
            <h1 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 border-b border-gray-700 pb-1">
                System Time
            </h1>
            <p className="text-xl font-mono text-hud-blue tracking-widest font-bold">
                {formattedTime}
            </p>
            <p className="text-sm font-mono text-gray-400 tracking-wider">
                {formattedDate}
            </p>
        </div>
    );
};

export default StardateClock;