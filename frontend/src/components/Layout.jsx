import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-space-black text-star-white font-mono flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto p-6">
                {children}
            </main>
            <footer className="p-4 text-center text-xs text-gray-500 border-t border-gray-800">
                <p>STARFIELD COMPANION // SYSTEM ONLINE</p>
            </footer>
        </div>
    );
};

export default Layout;
