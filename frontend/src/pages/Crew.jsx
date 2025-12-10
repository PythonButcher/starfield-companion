import React, { useState, useEffect } from 'react';
import crewData from '../../../backend/data/crew_data.json';
import CrewCard from '../components/CrewCard';



const Crew = () => {
    // Renamed state to 'roster' (the list) to avoid confusion
    const [roster, setRoster] = useState([]);

    useEffect(() => {
        // In the future, this is where we would fetch from Flask
        setRoster(crewData);
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-hud-blue tracking-widest uppercase">
                    Constellation Roster
                </h1>
                <p className="text-gray-400 text-sm mt-1">PERSONNEL MANIFEST // ACTIVE</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Fix: We map over 'roster' (the list).
                   We call each item 'member' (the person).
                */}
                {roster.map((member) => (
                    <CrewCard
                        key={member.id}
                        name={member.name}
                        role={member.role}
                        status={member.status}
                        photo={member.photo}
                        email={member.email}
                    />
                ))}
            </div>
        </div>
    );
};

export default Crew;