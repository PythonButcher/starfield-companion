import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedSystems } from '../context/systems';
import { Input } from './ui';
export default function SystemSearch() {
  const { systems, selectSystem, resource } = useSelectedSystems();
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const [index, setIndex] = useState(0);
  const input = useRef(null); const container = useRef(null); const navigate = useNavigate();
  const results = systems.filter((system) => system.name.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) {
        event.preventDefault(); input.current?.focus(); setOpen(true);
      }
    };
    const outside = (event) => { if (!container.current?.contains(event.target)) setOpen(false); };
    window.addEventListener('keydown', shortcut); document.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', shortcut); document.removeEventListener('pointerdown', outside); };
  }, []);
  function choose(system) { selectSystem(system); setQuery(system.name); setOpen(false); navigate('/'); }
  return <div className="search-box" ref={container}><Input ref={input} aria-label="System search" placeholder="Search systems / Ctrl K" role="combobox" aria-expanded={open} aria-controls="system-results" aria-activedescendant={open && results[index] ? 'system-' + results[index].id : undefined} value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setIndex(0); setOpen(true); }} onKeyDown={(event) => {
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'ArrowDown') { event.preventDefault(); setIndex(Math.min(index + 1, results.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(Math.max(index - 1, 0)); }
    if (event.key === 'Enter' && open && results[index]) { event.preventDefault(); choose(results[index]); }
  }} />{open && <div className="search-results" id="system-results" role="listbox">{resource.loading ? <p className="p-3">Scanning…</p> : resource.error ? <button onClick={resource.reload}>Connection failed. Retry</button> : results.length ? results.map((system, itemIndex) => <button key={system.id} id={'system-' + system.id} role="option" aria-selected={index === itemIndex} onClick={() => choose(system)}>{system.name}<span className="small muted"> / {system.faction}</span></button>) : <p className="p-3">No matching systems.</p>}</div>}</div>;
}
