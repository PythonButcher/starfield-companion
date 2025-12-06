"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLogEntry() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    planetName: '',
    rawNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Optionally get AI narrative from mock endpoint
      const narrativeResponse = await fetch('/api/generate_narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes: formData.rawNotes, planetName: formData.planetName }),
      });
      const narrativeData = await narrativeResponse.json();

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          planetName: formData.planetName,
          rawNotes: formData.rawNotes,
          aiNarrative: narrativeData?.narrative || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create log');
      }

      router.push('/journal');
    } catch (err) {
      setError(err.message);
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
            name="planetName"
            value={formData.planetName}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
            placeholder="Unknown System..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">NOTES</label>
          <textarea
            className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white h-40 focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
            placeholder="Record your observations..."
            name="rawNotes"
            value={formData.rawNotes}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        {error && <p className="text-warning-red">{error}</p>}
        <button
          type="submit"
          className="bg-hud-blue text-space-black px-6 py-3 font-bold hover:bg-white transition-all duration-200 w-full uppercase tracking-widest active:scale-95 active:bg-hud-blue/80 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Log'}
        </button>
      </form>
    </div>
  );
}
