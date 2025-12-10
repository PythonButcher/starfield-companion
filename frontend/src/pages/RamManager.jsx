import React, { useState, useEffect, useMemo } from 'react';

const RamManager = () => {
    const [projects, setProjects] = useState([]);
    const [pinnedProjects, setPinnedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/research');
                if (!response.ok) {
                    throw new Error('Failed to fetch research data');
                }
                const data = await response.json();
                // Filter out empty entries if any
                const validProjects = data.filter(p => p["research Project"] && p["research Project"].trim() !== "");
                setProjects(validProjects);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const togglePin = (projectName) => {
        setPinnedProjects(prev => {
            if (prev.includes(projectName)) {
                return prev.filter(p => p !== projectName);
            } else {
                return [...prev, projectName];
            }
        });
    };

    const shoppingList = useMemo(() => {
        const totals = {};

        // Find pinned project objects
        const pinned = projects.filter(p => pinnedProjects.includes(p["research Project"]));

        pinned.forEach(project => {
            if (project.required_materials_normalized) {
                project.required_materials_normalized.forEach(mat => {
                    const { name, qty } = mat;
                    if (totals[name]) {
                        totals[name] += qty;
                    } else {
                        totals[name] = qty;
                    }
                });
            }
        });

        return totals;
    }, [projects, pinnedProjects]);

    if (loading) return <div className="flex items-center justify-center h-screen bg-space-black text-star-white animate-pulse">Loading R.A.M. Data...</div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-space-black text-red-500">Error: {error}</div>;

    return (
        <div className="flex h-screen bg-space-black text-star-white overflow-hidden font-sans">
            {/* Left Column: Project Browser */}
            <div className="w-2/3 h-full overflow-y-auto p-6 border-r border-gray-700 custom-scrollbar">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-hud-blue tracking-wider mb-2">RESOURCE ALLOCATION MANAGER</h1>
                    <p className="text-gray-400">Select research projects to calculate total material requirements.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project, index) => {
                        const projectName = project["research Project"];
                        const isPinned = pinnedProjects.includes(projectName);
                        const materials = project.required_materials_normalized || [];
                        const materialCount = materials.length;

                        return (
                            <div
                                key={projectName || index} // Fallback to index if name is somehow missing, though we filter
                                className={`group relative p-4 rounded-lg bg-gray-900 border transition-all duration-300 ${isPinned ? 'border-hud-blue shadow-[0_0_15px_rgba(0,195,255,0.2)]' : 'border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={`font-semibold text-lg truncate pr-2 transition-colors ${isPinned ? 'text-hud-blue' : 'text-gray-200'}`} title={projectName}>
                                        {projectName}
                                    </h3>
                                    <button
                                        onClick={() => togglePin(projectName)}
                                        className={`px-3 py-1 text-xs uppercase tracking-widest font-bold border transition-all duration-200 ${isPinned
                                                ? 'bg-hud-blue text-black border-hud-blue hover:bg-white hover:border-white'
                                                : 'bg-transparent text-gray-500 border-gray-600 hover:text-white hover:border-white'
                                            }`}
                                    >
                                        {isPinned ? 'PINNED' : 'PIN'}
                                    </button>
                                </div>

                                <div className="text-sm text-gray-400">
                                    {materialCount > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                {materials.slice(0, 6).map((m, i) => (
                                                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-800 text-xs border border-gray-700 text-gray-300">
                                                        <span className="mr-1 text-gray-500">{m.name}</span>
                                                        <span className="font-mono text-white">{m.qty}</span>
                                                    </span>
                                                ))}
                                                {materialCount > 6 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-900 text-xs text-gray-500 italic">
                                                        +{materialCount - 6} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs italic text-gray-600 flex items-center">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500/20 mr-2"></span>
                                            No materials required
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Column: Shopping List */}
            <div className="w-1/3 h-full bg-gray-900/30 backdrop-blur-md p-0 overflow-hidden flex flex-col border-l border-gray-800">
                <div className="p-6 pb-4 bg-gray-900/90 border-b border-gray-700 z-10 shadow-lg">
                    <h2 className="text-xl font-bold text-hud-blue uppercase tracking-widest flex items-center mb-1">
                        <span className="mr-3 text-2xl">📋</span> Procurement List
                    </h2>
                    <p className="text-xs text-gray-400 font-mono">
                        TARGETS: <span className="text-white">{pinnedProjects.length}</span> PROJECT(S)
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {Object.keys(shoppingList).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-600 opacity-50">
                            <span className="text-4xl mb-2">⚡</span>
                            <p className="text-sm uppercase tracking-wide">Systems Standby</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {Object.entries(shoppingList)
                                .sort((a, b) => b[1] - a[1]) // Sort by quantity descending
                                .map(([name, qty]) => (
                                    <li key={name} className="flex justify-between items-center p-3 sm:p-4 bg-black/40 rounded border border-gray-800 hover:border-gray-600 hover:bg-black/60 transition-all group">
                                        <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{name}</span>
                                        <div className="flex items-center">
                                            <span className="font-mono text-xl font-bold text-hud-blue tabular-nums">{qty}</span>
                                            <span className="ml-2 text-[10px] text-gray-600 uppercase tracking-tighter">units</span>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>

                {pinnedProjects.length > 0 && (
                    <div className="p-4 bg-gray-900 border-t border-gray-800 text-center">
                        <button
                            onClick={() => setPinnedProjects([])}
                            className="px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                        >
                            Reset Targets
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RamManager;
