import React, { useState } from 'react';
import CosmoDropZone from '../components/CosmoDropZone';

export default function DriveBy({ context }) {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <>
            <style>{`
                /* Precise Styling for the Dropdown Panel */
                .driveby-panel {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 510px;
                    padding: 14px;
                    background: rgba(6, 10, 24, 0.95);
                    border: 1px solid rgba(0, 191, 255, 0.2);
                    border-radius: 8px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
                    z-index: 100;

                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(-10px);
                    transition: all 0.2s ease-out;
                    backdrop-filter: blur(4px);
                }

                /* Active state toggled by React state */
                .driveby-panel.is-active {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }
            `}</style>

            {/* 1. THE TRIGGER: Uses your exact Tailwind classes from the other links */}
            <div
                onClick={togglePanel}
                className={`text-star-white hover:text-hud-blue transition-colors uppercase text-xs tracking-[0.2em] font-bold border-b-2 py-1 cursor-pointer ${
                    isOpen ? 'border-hud-blue text-hud-blue' : 'border-transparent hover:border-hud-blue'
                }`}
            >
                Drive By
            </div>

            {/* 2. THE PANEL: Toggled by the is-active class */}
            <div 
                className={`driveby-panel ${isOpen ? 'is-active' : ''}`}
                onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the dropzone
            >
                {/* Integrated CosmoDropZone. 
                   Redundant slot text and dashed borders removed here 
                   to maintain the Starfield aesthetic.
                */}
                <CosmoDropZone context={context} />
            </div>
        </>
    );
}