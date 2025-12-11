import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * SystemSearch --- A navigation-integrated search console for finding star systems.
 *
 * This component provides a sleek, in-navbar search experience that adheres to the app's
 * NASA-punk aesthetic. It is designed to feel like an organic part of the ship's HUD.
 *
 * --- Functionality ---
 * 1. Data Fetching: On mount, it fetches all star system data from the backend API.
 *    This data is cached client-side to enable fast, local filtering without repeated API calls.
 * 2. Local Filtering: As the user types, the search query is used to filter the cached
 *    system list in real-time. This provides an instant, responsive user experience.
 * 3. Focus Handling: The component tracks its focus state to control the visibility of the
 *    search results panel. Clicking outside the component closes the results, preventing
 *    UI clutter.
 * 4. UI Polish & Aesthetics:
 *    - The input field is styled to blend into the navbar, with a subtle blue underline
 *      that glows on focus, indicating an active state.
 *    - The results dropdown appears with a smooth transition and features a dark, blurred
 *      background with a glowing border, mimicking a futuristic display panel.
 *    - List items highlight on hover, providing clear visual feedback.
 *    - The entire component uses monospaced typography and a muted color palette to match
 *      the established sci-fi theme.
 *
 * @param {function} onSystemSelect - Callback to notify a parent component (like a map)
 *                                  when a system is selected.
 */
const SystemSearch = ({ onSystemSelect }) => {
    const [query, setQuery] = useState('');
    const [systems, setSystems] = useState([]);
    const [filteredSystems, setFilteredSystems] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef(null);

    // Fetch all systems once on component mount for efficient local filtering.
    useEffect(() => {
        const loadSystems = async () => {
            try {
                const response = await axios.get('/api/systems');
                setSystems(response.data);
            } catch (err) {
                console.error('Error fetching systems:', err);
            }
        };
        loadSystems();
    }, []);

    // Filter systems based on the user's query.
    useEffect(() => {
        if (query.trim() === '') {
            setFilteredSystems([]);
            return;
        }
        const lowerCaseQuery = query.toLowerCase();
        const results = systems.filter(system =>
            system.name.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredSystems(results);
    }, [query, systems]);

    // Handle clicks outside the search component to close the results dropdown.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectSystem = (system) => {
        setQuery(system.name); // Set input text to the selected system
        setIsFocused(false);
        if (onSystemSelect) {
            onSystemSelect(system);
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-xs h-full">
            {/* Search Input */}
            <input
                type="text"
                placeholder="JUMP TO SYSTEM..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className={`
                    w-full h-full bg-transparent 
                    text-star-white placeholder-gray-500/80 font-mono uppercase tracking-widest
                    border-b-2 transition-all duration-300 ease-in-out
                    outline-none
                    ${isFocused ? 'border-hud-blue shadow-[0_1px_12px_-4px_rgba(0,212,255,0.7)]' : 'border-hud-blue/20'}
                `}
            />

            {/* Results Panel - Appears on focus and when there is a query */}
            {isFocused && query && (
                <ul className="
                    absolute top-full mt-2 w-full max-h-80 overflow-y-auto 
                    bg-space-black/80 backdrop-blur-sm
                    border border-hud-blue/30 rounded-md
                    shadow-[0_0_20px_rgba(0,212,255,0.15)]
                    z-50 transition-all duration-300 ease-in-out
                ">
                    {filteredSystems.length > 0 ? (
                        filteredSystems.map((system) => (
                            <li
                                key={system.id}
                                onClick={() => handleSelectSystem(system)}
                                className="
                                    p-3 text-sm text-star-white font-mono tracking-wider
                                    hover:bg-hud-blue/10 hover:text-hud-blue
                                    cursor-pointer transition-colors duration-150
                                ">
                                {system.name}
                            </li>
                        ))
                    ) : (
                        <li className="p-3 text-xs text-gray-500 font-mono tracking-widest uppercase">
                            NO SYSTEMS MATCH QUERY
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SystemSearch;
