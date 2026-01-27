import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const Journal = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/logs');
                if (!response.ok) {
                    throw new Error('Failed to fetch logs');
                }
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-star-white">QUANTUM JOURNAL</h1>
                <Link to="/journal/new" className="bg-hud-blue text-space-black px-4 py-2 rounded font-bold hover:bg-white transition-colors">
                    NEW ENTRY
                </Link>
            </div>
          
            {loading && <p className="text-hud-blue animate-pulse">Loading logs...</p>}
            {error && <p className="text-warning-red">Error: {error}</p>}

            {!loading && !error && logs.length === 0 && (
                <p className="text-gray-500 italic">No logs found. Start your journey.</p>
            )}
          
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="border border-gray-700 p-4 rounded hover:border-hud-blue transition-colors bg-gray-900/50">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-hud-blue">{log.title || 'Untitled Log'}</h2>
                            <span className="text-xs text-gray-400">{log.date}</span>
                        </div>
                        <p className="text-gray-300 mb-2">{log.content}</p>
                        {log.planet && <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Planet: {log.planet}</span>}
                    </div>
                    
                ))}
             {/* Drop zone dynamically positioned toward the bottom */}
        <div className="flex justify-center mt-200 mb-10">   
        </div>
            </div>
        </div>
    );
};

export default Journal;
