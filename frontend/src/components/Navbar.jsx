import React from 'react';
import { NavLink } from 'react-router-dom';
import SystemSearch from './SystemSearch';
import StarDate from './StarDate';

const navLinkClass = ({ isActive }) =>
    `font-mono uppercase tracking-widest text-lg transition-colors duration-300 px-4 py-2
   ${isActive
        ? 'text-hud-blue'
        : 'text-star-white hover:text-hud-blue'
    }`;

const Navbar = ({ onSystemSelect }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-space-black/80 backdrop-blur-lg">
            <nav className="container mx-auto flex items-center justify-between h-20 px-6">

                {/* Left Section: App Title & Links */}
                <div className="flex items-center space-x-8">
                    <h1 className="text-2xl font-bold text-star-white tracking-tighter">
                        STARFIELD<span className="text-hud-blue">.</span>
                    </h1>
                    <div className="hidden md:flex items-center space-x-4">
                        <NavLink to="/hub" className={navLinkClass}>Hub</NavLink>
                        <NavLink to="/crew" className={navLinkClass}>Crew</NavLink>
                        <NavLink to="/journal" className={navLinkClass}>Journal</NavLink>
                    </div>
                </div>

                {/* Right Section: Search & Date */}
                <div className="flex items-center space-x-6 h-full">
                    <div className="w-64 h-full flex items-center">
                        <SystemSearch onSystemSelect={onSystemSelect} />
                    </div>
                    <StarDate />
                </div>

            </nav>
        </header>
    );
};

export default Navbar;
