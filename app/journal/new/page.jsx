"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogEntryPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        planet_name: "",
        raw_notes: "",
    });
    const [status, setStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);
        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                throw new Error('Failed to submit log');
            }
            await response.json();
            setStatus('Log submitted successfully.');
            setFormData({ title: '', planet_name: '', raw_notes: '' });
            setTimeout(() => router.push('/journal'), 500);
        } catch (error) {
            setStatus(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-star-white mb-6">NEW LOG ENTRY</h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">TITLE</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
                        placeholder="Mission Report..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">PLANET</label>
                    <input
                        type="text"
                        name="planet_name"
                        value={formData.planet_name}
                        onChange={handleChange}
                        className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
                        placeholder="Unknown System..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">NOTES</label>
                    <textarea
                        className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white h-40 focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
                        placeholder="Record your observations..."
                        name="raw_notes"
                        value={formData.raw_notes}
                        onChange={handleChange}
                    ></textarea>
                </div>
                <button
                    type="submit"
                    className="bg-hud-blue text-space-black px-6 py-3 font-bold hover:bg-white transition-all duration-200 w-full uppercase tracking-widest active:scale-95 active:bg-hud-blue/80"
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit Log'}
                </button>
                {status && <p className="text-sm text-gray-300">{status}</p>}
            </form>
        </div>
    );
}
