import { useEffect, useState } from 'react';
import { media, uploadMedia } from '../api/media';
import { mediaUrl, query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { dispatch } from '../cosmodrag/cosmoDragDispatcher';
import { Button, Panel, Input, Select, TextArea, Modal, Toast, ResourceState, EmptyState, Pagination } from './ui';

export function AttachmentDrop({ associations, onAttached, children, className = '' }) {
  const [error, setError] = useState('');
  async function drop(event) {
    event.preventDefault(); event.stopPropagation(); setError('');
    try {
      const mediaId = event.dataTransfer.getData('application/x-starfield-media');
      const files = [...event.dataTransfer.files];
      if (mediaId) await dispatch({ mediaId }, { media: true, associations });
      else if (files.length) {
        for (const file of files) await dispatch({ file }, { media: true, associations });
      } else return;
      onAttached?.();
    } catch (err) { setError(err.message); }
  }
  return <div className={className} onDragOver={(e) => e.preventDefault()} onDrop={drop}>
    {children}<Toast error message={error} />
  </div>;
}

function Preview({ item, controls = false }) {
  return item.mime_type.startsWith('video/')
    ? <video className="media-preview" src={mediaUrl(item.url)} controls={controls} preload="metadata" />
    : <img className="media-preview" src={mediaUrl(item.url)} alt={item.caption || item.original_name} loading="lazy" />;
}

export default function MediaArchive({ associations = {}, compact = false }) {
  const [tag, setTag] = useState(''); const [planet, setPlanet] = useState('');
  const [offset, setOffset] = useState(0); const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null); const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const resource = useResource('/api/media' + query({ tag, planet_id: planet, ...associations, limit: 12, offset }));
  const worlds = useResource('/api/planets?limit=200');
  useEffect(() => {
    if (!pending) return;
    const url = URL.createObjectURL(pending);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pending]);
  async function upload() {
    setBusy(true); setError(''); setProgress(0);
    try { await uploadMedia(pending, associations, setProgress); setPending(null); setPreview(''); resource.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="stack">
    <AttachmentDrop associations={associations} onAttached={resource.reload}>
      <div className="dropzone">
        <h3>{compact ? 'Attached media' : 'CosmoDrag upload bay'}</h3>
        <p className="small muted">Drop images, MP4 files, or a gallery card here. Maximum 10 MB each.</p>
        <Input label="Choose media file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
          disabled={busy} onChange={(e) => setPending(e.target.files[0] || null)} />
      </div>
    </AttachmentDrop>
    {pending && <Panel className="stack">
      {preview && (pending.type.startsWith('video/') ? <video className="media-preview" src={preview} controls /> : <img className="media-preview" src={preview} alt="Upload preview" />)}
      <p>{pending.name}</p><Button disabled={busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload media'}</Button>
      {busy && <label>Upload {progress}%<progress aria-label="Upload progress" max="100" value={progress} /></label>}
    </Panel>}
    <Toast message={error} error />
    {!compact && <div className="toolbar">
      <Input label="Media tag filter" value={tag} onChange={(e) => { setTag(e.target.value); setOffset(0); }} />
      <ResourceState resource={worlds}><Select label="Media planet filter" value={planet} onChange={(e) => { setPlanet(e.target.value); setOffset(0); }}>
        <option value="">All planets</option>{worlds.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select></ResourceState>
    </div>}
    <ResourceState resource={resource}>
      {resource.data?.length ? <div className="grid-cards">{resource.data.map((item) =>
        <Panel key={item.id} className="stack" draggable onDragStart={(e) => e.dataTransfer.setData('application/x-starfield-media', String(item.id))}>
          <Preview item={item} /><p>{item.caption || item.original_name}</p>
          <Button variant="ghost" onClick={() => setSelected(item)}>View media {item.id}</Button>
        </Panel>)}</div> : <EmptyState title="No media in this view">Upload a discovery or attach a gallery item.</EmptyState>}
      <Pagination offset={offset} total={resource.total} onChange={setOffset} />
    </ResourceState>
    {selected && <MediaEditor item={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); resource.reload(); }} />}
  </div>;
}

function MediaEditor({ item, onClose, onSaved }) {
  const [caption, setCaption] = useState(item.caption); const [tags, setTags] = useState(item.tags.join(', '));
  const [planetId, setPlanetId] = useState(item.planet_id || ''); const [logId, setLogId] = useState(item.log_id || '');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  const worlds = useResource('/api/planets?limit=200'); const logs = useResource('/api/logs?limit=200');
  async function save(remove = false) {
    setBusy(true); setError('');
    try {
      if (remove) await media.remove(item.id);
      else await media.update(item.id, { caption, tags: tags.split(',').map((x) => x.trim()).filter(Boolean), planet_id: Number(planetId) || null, log_id: Number(logId) || null });
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return <Modal title={item.original_name} onClose={onClose}><div className="stack">
    <Preview item={item} controls /><Toast error message={error} />
    <TextArea label="Media caption" value={caption} maxLength={5000} onChange={(e) => setCaption(e.target.value)} />
    <Input label="Media tags" value={tags} onChange={(e) => setTags(e.target.value)} />
    <ResourceState resource={worlds}><Select label="Attach to planet" value={planetId} onChange={(e) => setPlanetId(e.target.value)}>
      <option value="">Unlinked</option>{worlds.data?.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}
    </Select></ResourceState>
    <ResourceState resource={logs}><Select label="Attach to log" value={logId} onChange={(e) => setLogId(e.target.value)}>
      <option value="">Unlinked</option>{logs.data?.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}
    </Select></ResourceState>
    <div className="actions"><Button disabled={busy} onClick={() => save()}>Save media</Button>
      <Button disabled={busy} variant="danger" onClick={() => setConfirm(true)}>Delete media</Button></div>
    {confirm && <div className="notice error"><p>Permanently delete this file and its metadata?</p>
      <Button variant="danger" disabled={busy} onClick={() => save(true)}>Confirm delete media</Button></div>}
  </div></Modal>;
}
