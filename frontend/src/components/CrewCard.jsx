import React from 'react';

const CrewCard = ({ name, role, status, photo, email }) => {
    // Determine color based on status
    const statusColor = status === "Active" ? "text-green-400" : "text-warning-red";
    const borderColor = status === "Active" ? "border-hud-blue" : "border-warning-red";

    return (
        <div className={`flex items-center gap-4 bg-gray-900 border ${borderColor} p-4 rounded-lg shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(91,192,222,0.3)]`}>
            {/* Profile Photo (or placeholder) */}
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-600">
                <img src={photo || "https://placehold.co/150/0b0c15/e2e2e2?text=?"} alt={name} className="w-full h-full object-cover" />
            </div>

            {/* Info Block */}
            <div className="flex-1">
                <h3 className="text-xl font-bold text-star-white uppercase tracking-wider">{name}</h3>
                <p className="text-sm text-hud-blue font-mono">{role}</p>
            </div>

            {/* Status Block */}
            <div className="text-right">
                <span className={`text-xs font-bold uppercase border px-2 py-1 rounded ${statusColor} border-current`}>
                    {status}
                </span>
            </div>
        </div>
    );
};

export default CrewCard;