import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import universeData from '../../../backend/data/starfield_universe.json';
import { useSelectedSystems } from '../context/SelectedSystemsContext';

const SystemSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const { selectSystem } = useSelectedSystems();

    // Filter systems based on query
    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const filtered = universeData.filter(system =>
            system.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setIsOpen(true);
        setSelectedIndex(-1);
    }, [query]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (system) => {
        console.log(`[NAVIGATIONAL COMPUTER] Plotting course to ${system.name}...`);
        setQuery(system.name);
        setIsOpen(false);
        selectSystem(system);
        // In a real implementation, this would update a Context or URL param
        navigate('/'); // Ensure we are on the Hub/Map view
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Hsape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative w-64 group z-50" ref={searchRef}>
            {/* Input Label / HUD decoration */}
            <div className="absolute -top-3 left-2 px-1 bg-space-black text-[10px] text-hud-blue/70 uppercase tracking-widest font-bold z-10">
                System Search
            </div>

            {/* Input Field */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder="ENTER DESIGNATION..."
                    className="w-full bg-space-black/80 text-star-white border border-gray-700 p-2 pl-4 text-sm font-mono focus:outline-none focus:border-hud-blue focus:shadow-[0_0_10px_rgba(91,192,222,0.3)] transition-all duration-300 placeholder-gray-600 uppercase tracking-wide"
                />

                {/* Decorative scanner line */}
                <div className={`absolute bottom-0 left-0 h-[1px] bg-hud-blue transition-all duration-500 ${isOpen ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                {/* Search Icon / Indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-hud-blue animate-pulse">
                    <span className="text-xs">⌖</span>
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-space-black/95 border border-hud-blue/30 backdrop-blur-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-hud-blue"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-hud-blue"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-hud-blue"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-hud-blue"></div>

                    {results.length > 0 ? (
                        <ul>
                            {results.map((system, index) => (
                                <li
                                    key={system.id}
                                    onClick={() => handleSelect(system)}
                                    className={`
                                        px-4 py-3 cursor-pointer border-b border-gray-800 text-xs uppercase tracking-wider flex justify-between items-center transition-colors
                                        ${index === selectedIndex ? 'bg-hud-blue/20 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-hud-blue'}
                                    `}
                                >
                                    <span>{system.name}</span>
                                    <span className="text-[10px] text-gray-600 font-mono border border-gray-700 px-1 rounded">
                                        {system.faction === "Neutral" ? "UNALIGNED" : system.faction.substring(0, 3).toUpperCase()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-xs text-warning-red uppercase tracking-widest border border-warning-red/20 m-2 bg-warning-red/5">
                            No Signal Found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SystemSearch;