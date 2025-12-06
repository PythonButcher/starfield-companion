"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', planet: '', notes: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const narrativeRes = await fetch('/api/generate_narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes: formData.notes, planetName: formData.planet, title: formData.title }),
      });
      const narrativeData = await narrativeRes.json();

      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          planetName: formData.planet,
          rawNotes: formData.notes,
          aiNarrative: narrativeData.narrative || 'AI processing... [MOCK RESPONSE]',
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to save log');
      }

      setStatus('success');
      router.push('/journal');
    } catch (err) {
      setStatus('idle');
      setError(err.message);
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
            required
            className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
            placeholder="Mission Report..."
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">PLANET</label>
          <input
            type="text"
            name="planet"
            value={formData.planet}
            onChange={handleChange}
            required
            className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
            placeholder="Unknown System..."
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-hud-blue mb-2 tracking-wider">NOTES</label>
          <textarea
            className="w-full bg-gray-900/50 border border-gray-700 p-3 text-star-white h-40 focus:border-hud-blue focus:ring-1 focus:ring-hud-blue outline-none font-mono transition-all duration-300"
            placeholder="Record your observations..."
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required
          />
        </div>
        {error && <p className="text-warning-red">{error}</p>}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="bg-hud-blue text-space-black px-6 py-3 font-bold hover:bg-white transition-all duration-200 w-full uppercase tracking-widest active:scale-95 active:bg-hud-blue/80 disabled:opacity-70"
        >
          {status === 'submitting' ? 'Processing...' : 'Submit Log'}
        </button>
      </form>
    </div>
  );
}
