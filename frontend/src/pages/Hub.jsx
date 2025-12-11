import React, { useState } from 'react';
import Layout from '../components/Layout';
import InteractiveMap from '../components/InteractiveMap';
import RamManager from './RamManager';

const Hub = () => {
    const [selectedSystem, setSelectedSystem] = useState(null);

    // This function will be passed down to the search bar
    const handleSystemSelect = (system) => {
        console.log("System selected in Hub:", system);
        setSelectedSystem(system);
    };

    return (
        <Layout onSystemSelect={handleSystemSelect}>
            <div className="container mx-auto p-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Main Content: Interactive Map */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-mono tracking-widest uppercase text-hud-blue mb-4">
                            Stellar Cartography
                        </h2>
                        <div className="h-[600px] bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                            <InteractiveMap selectedSystem={selectedSystem} />
                        </div>
                    </div>

                    {/* Sidebar: RAM Manager & other widgets */}
                    <div>
                        <h2 className="text-xl font-mono tracking-widest uppercase text-hud-blue mb-4">
                            System Resources
                        </h2>
                        <RamManager />
                        {/* Other widgets can be added here */}
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default Hub;
