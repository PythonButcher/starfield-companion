import React from 'react';
import { Link } from 'react-router-dom';
import StardateClock from './StarDate';
import SystemSearch from './SystemSearch';
import DriveBy from '../pages/DriveBy'; // <-- REQUIRED import

const Navbar = () => {
    return (
        <nav className="bg-space-black border-b border-hud-blue/30 p-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
            <div className="container mx-auto flex justify-between items-center">
                {/* Left Side: Logo + Navigation */}
                <div className="flex items-center gap-8">
                    {/* Logo Area */}
                    <Link
                        to="/"
                        className="text-hud-blue font-bold text-xl tracking-widest uppercase flex items-center group"
                    >
                        <span className="mr-2 text-2xl group-hover:rotate-90 transition-transform duration-500">
                            ❖
                        </span>
                        Starfield Companion
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex space-x-6 items-center relative">
                        <Link
                            to="/"
                            className="text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 border-transparent hover:border-hud-blue py-1"
                        >
                            Hub
                        </Link>
                        <Link
                            to="/journal"
                            className="text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 border-transparent hover:border-hud-blue py-1"
                        >
                            Journal
                        </Link>
                        <Link
                            to="/crew"
                            className="text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 border-transparent hover:border-hud-blue py-1"
                        >
                            Crew
                        </Link>
                        <Link
                            to="/ram"
                            className="text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 border-transparent hover:border-hud-blue py-1"
                        >
                            R.A.M.
                        </Link>
                        {/* DriveBy trigger + dropdown */}
                        <div className="relative driveby-wrapper">
                            <div
                                className="text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 border-transparent hover:border-hud-blue py-1 cursor-pointer"
                            >
                                Drive By
                            </div>
                            {/* Dropdown panel */}
                            <DriveBy />
                        </div>
                    </div>
                </div>
                {/* Right Side: Search & Clock */}
                <div className="flex items-center gap-6">
                    <SystemSearch />
                    <div className="h-8 w-px bg-gray-700 mx-2"></div>
                    <StardateClock />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
