import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { logs } from '../api/logs';
import { useResource } from '../hooks/useResource';
import { downloadText } from '../utils/storage';
import { Panel, Button, Tag, Modal, Toast, SectionHeader, ResourceState } from '../components/ui';
export default function LogDetail() {
  const { id } = useParams(); const navigate = useNavigate();
  const resource = useResource(logs.path + '/' + id);
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const log = resource.data;
  async function remove() {
    setBusy(true);
    try { await logs.remove(id); navigate('/journal'); } catch (err) { setError(err.message); setBusy(false); }
  }
  function exportLog() {
    downloadText('captains-log-' + id + '.md', '# ' + log.title + '\n\nStardate: ' + log.stardate + '\nPlanet: ' + log.planet_name + '\nTags: ' + log.tags.join(', ') + '\n\n## Captain’s log\n\n' + log.ai_narrative + '\n\n## Raw notes\n\n' + log.raw_notes + '\n');
  }
  return <ResourceState resource={resource}>{log && <><SectionHeader eyebrow={'Journal / Stardate ' + log.stardate} title={log.title}><Link className="button button-ghost" to="/journal">Archive</Link><Link className="button button-primary" to={'/journal/' + id + '/edit'}>Edit log</Link><Button variant="ghost" onClick={exportLog}>Export Markdown</Button><Button variant="danger" onClick={() => setConfirm(true)}>Delete</Button></SectionHeader><Toast message={error} error /><div className="stack"><Panel><p>{log.planet_name || 'Location unrecorded'} / {log.system_name || 'System unrecorded'} / {log.log_type}</p><p className="small muted">{log.location} {log.mood}</p>{log.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Panel><div className="two-column"><Panel className="stack"><h2>Captain’s log</h2><p className="prose-text">{log.ai_narrative || 'No narrative recorded.'}</p></Panel><Panel className="stack"><h2>Field observations</h2><p className="prose-text muted">{log.raw_notes || 'No raw notes recorded.'}</p></Panel></div></div>{confirm && <Modal title="Delete this log?" onClose={() => setConfirm(false)}><p>The journal entry will be removed. Attached media will remain in your gallery.</p><div className="actions mt-6"><Button variant="danger" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete log'}</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div></Modal>}</>}</ResourceState>;
}
