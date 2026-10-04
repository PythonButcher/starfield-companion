import { useRef, useState } from 'react';
import { dispatch } from '../cosmodrag/cosmoDragDispatcher';
import { Button, Toast } from './ui';
export default function CosmoDropZone({ context = {}, onComplete }) {
  const input = useRef(null); const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function accept(files, text = '') {
    setBusy(true); setError(''); setMessage('');
    try {
      const payload = files?.length ? { type: 'files', files: Array.from(files) } : { type: 'text', text };
      const result = await dispatch(payload, context);
      setMessage(result.message || 'Import complete.'); onComplete?.(result);
      window.dispatchEvent(new Event('archive-changed'));
    } catch (err) { setError(err.message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  return <div className={'dropzone ' + (hover ? 'hovering' : '')} onDragOver={(e) => { e.preventDefault(); setHover(true); }} onDragLeave={() => setHover(false)} onDrop={(e) => { e.preventDefault(); setHover(false); if (!busy) accept(e.dataTransfer.files, e.dataTransfer.getData('text/plain')); }}><p>Drop text notes here</p><p className="small muted mb-3">Text imports become a journal entry.</p><input ref={input} type="file" accept=".txt,.md" multiple hidden onChange={(e) => accept(e.target.files)} /><Button variant="ghost" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Importing…' : 'Choose files'}</Button><Toast message={message} /><Toast message={error} error /></div>;
}
