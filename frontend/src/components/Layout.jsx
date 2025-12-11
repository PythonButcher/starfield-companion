import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, onSystemSelect }) => {
    return (
        <div className="min-h-screen bg-space-black text-star-white">
            <Navbar onSystemSelect={onSystemSelect} />
            <main className="pt-20"> {/* Adjusted padding for new navbar height */}
                {children}
            </main>
        </div>
    );
};

export default Layout;
