import { useState } from 'react';
import { useResource } from '../hooks/useResource';
import { request } from '../api/client';
import { Button, Input, Modal, Toast } from './ui';

export default function StarterControls() {
  const resource = useResource('/api/starter');
  const [open, setOpen] = useState(false); const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function clear(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await request('/api/starter/clear', { method: 'POST', body: { confirm: confirmation } });
      window.location.reload();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  if (resource.error) return <button onClick={resource.reload}>Retry starter settings</button>;
  if (resource.loading || resource.data?.status !== 'active') return null;
  return <><button className="starter-settings" onClick={() => setOpen(true)}>Constellation starter settings</button>
    {open && <Modal title="Constellation starter state" onClose={() => { if (!busy) setOpen(false); }}>
      <form className="stack" onSubmit={clear}>
        <p>This terminal includes an illustrative playthrough: the Frontier, crew assignments, a Vectera log, missions, surveys and a Luna extraction plan.</p>
        <p>Clear removes unchanged starter records and restores unchanged starter assignments and survey values. Edited records, linked logs, uploaded media and your own additions are kept. Starter records will not return on restart.</p>
        <Input label="Type CLEAR STARTER to confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
        <Toast error message={error} /><Button type="submit" variant="danger" disabled={busy || confirmation !== 'CLEAR STARTER'}>Clear starter records</Button>
      </form>
    </Modal>}
  </>;
}
