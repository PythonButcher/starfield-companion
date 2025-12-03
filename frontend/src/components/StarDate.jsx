import React, { useEffect, useState } from 'react'

// StarDate component
const StardateClock = () => {
    const [stardate, setStardate] = useState("");

    useEffect(() => {
        const updateStardate = () => {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const diff = now - startOfYear;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);

            // Calculate year percentage
            const yearPercent = (dayOfYear / 365).toFixed(2).split('.')[1]; // get the decimal part

            // Sci-fi format: Year.Percent (e.g., 2330.45)
            // We'll offset the year to make it look futuristic (e.g., +300 years)
            const sciFiYear = now.getFullYear() + 300;

            setStardate(`${sciFiYear}.${yearPercent}`);
        };

        updateStardate();
        const interval = setInterval(updateStardate, 60000); // Update every minute is enough for this format

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 border-l-2 border-hud-blue/30 pl-4 ml-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                STARDATE
            </span>
            <span className="text-lg font-mono text-hud-blue tracking-widest font-bold">
                {stardate}
            </span>
        </div>
    );
};

export default StardateClock;