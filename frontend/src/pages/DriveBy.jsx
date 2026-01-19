import React, { useState } from 'react';
import CosmoDropZone from '../components/CosmoDropZone';


export default function DriveBy({ context }) {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <div className="driveby-container" style={{ position: 'relative', display: 'inline-block' }}>
            <style>{`
                .driveby-panel {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 510px; 
                    padding: 14px;
                    background: rgba(6, 10, 24, 0.88);
                    border: 1px solid rgba(140,180,255,0.1);
                    border-radius: 12px;
                    box-shadow: 0 18px 40px rgba(0,0,0,0.6);
                    z-index: 100;

                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(-6px);
                    transition: opacity 0.15s ease, transform 0.15s ease;
                }

                .driveby-panel.is-active {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }
            `}</style>

            {/* 1. The Trigger: Specifically named 'DRIVE BY' to toggle the state */}
            <div 
                className="driveby-trigger" 
                onClick={togglePanel}
                style={{ cursor: 'pointer', fontFamily: 'monospace', color: '#00bfff', fontSize: '12px' }}
            >
                DRIVE BY
            </div>

            {/* 2. The Panel: Dynamically applies 'is-active' based on state */}
            <div className={`driveby-panel ${isOpen ? 'is-active' : ''}`}>
                {/* 3. Integrated DropZone (Removed redundant 'slot' text and borders) */}
                <div onClick={(e) => e.stopPropagation()}>
                    <CosmoDropZone context={context} />
                </div>
            </div>
        </div>
    );
}