import React, { useState } from "react";

const LogEntry = () => {
    const [formData, setFormData] = useState({
        title: "",
        planet: "",
        notes: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Data Submitted:", formData);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-star-white mb-6">NEW LOG ENTRY</h1>
            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2">TITLE</label>
                    <input type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 p-3 text-star-white focus:border-hud-blue outline-none" placeholder="Mission Report..." />
                </div>
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2">PLANET</label>
                    <input
                        type="text"
                        name="planet"
                        value={formData.planet}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 p-3 text-star-white focus:border-hud-blue outline-none" placeholder="Unknown System..." />
                </div>
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2">NOTES</label>
                    <textarea
                        className="w-full bg-gray-900 border border-gray-700 p-3 text-star-white h-40 focus:border-hud-blue outline-none"
                        placeholder="Record your observations..."
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}></textarea>
                </div>
                <button
                    type="submit"
                    className="bg-hud-blue text-space-black px-6 py-3 font-bold hover:bg-white transition-colors w-full"
                    onClick={(e) => handleSubmit(e)}
                >
                    SUBMIT LOG
                </button>
            </form>
        </div>
    );
};

export default LogEntry;
