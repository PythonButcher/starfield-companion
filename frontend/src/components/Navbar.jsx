import React from 'react';
import { Link } from 'react-router-dom';
import StardateClock from './StarDate';

const Navbar = () => {
    return (
        <nav className="bg-space-black border-b border-hud-blue/30 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-hud-blue font-bold text-xl tracking-widest uppercase">
                    Starfield Companion
                </Link>
                <div className="flex space-x-6">
                    <Link to="/" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
                        Hub
                    </Link>
                    <Link to="/journal" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
                        Journal
                    </Link>
                    <Link to="/planet-pulse" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
                        PlanetPulse
                    </Link>
                    <Link to="/crew" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
                        Crew
                    </Link>

                </div>
                <StardateClock />
            </div>
        </nav>
    );
};

export default Navbar;
