import React from 'react';
import axios from 'axios';

const SystemSearch = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filteredSystems, setFilteredSystems] = React.useState([]);


    const handleSearchChange = (query) => {
        setSearchQuery(query);

        // Simple filtering logic
        try {
            const response = axios.get('/api/systems');
            const data = response.data;
            const filtered = data.filter(system =>
                system.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredSystems(filtered);
        } catch (error) {
            console.error('Error fetching systems:', error);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Search systems..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
            />

            {/* Display filtered results */}
            <ul>
                {filteredSystems.map(system => (
                    <li key={system.id}>{system.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default SystemSearch;