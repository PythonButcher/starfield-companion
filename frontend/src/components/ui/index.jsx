import { useEffect, useId, useRef } from 'react';
export function StripeAccent() { return <div className="stripe-accent" aria-hidden="true"><i /><i /><i /><i /></div>; }
export function Panel({ children, className = '', ...props }) { return <section className={'panel ' + className} {...props}>{children}</section>; }
export function Button({ variant = 'primary', className = '', type = 'button', ...props }) { return <button type={type} className={'button button-' + variant + ' ' + className} {...props} />; }
export function Input({ label, id, className = '', ...props }) {
  const generated = useId();
  return <label className={'field ' + className} htmlFor={id || generated}>{label && <span>{label}</span>}<input id={id || generated} {...props} /></label>;
}
export function TextArea({ label, id, ...props }) {
  const generated = useId();
  return <label className="field" htmlFor={id || generated}>{label && <span>{label}</span>}<textarea id={id || generated} {...props} /></label>;
}
export function Select({ label, id, children, ...props }) {
  const generated = useId();
  return <label className="field" htmlFor={id || generated}>{label && <span>{label}</span>}<select id={id || generated} {...props}>{children}</select></label>;
}
export function Tag({ children, tone = '' }) { return <span className={'tag ' + tone}>{children}</span>; }
export function StatBar({ value, label }) { return <label className="stat-bar"><span>{label} <b>{value}%</b></span><progress max="100" value={value} /></label>; }
export function Spinner({ label = 'Establishing connection…' }) { return <div className="scan-loader" role="status"><span />{label}</div>; }
export function EmptyState({ title = 'No records on file', children }) { return <div className="empty-state"><span aria-hidden="true">◎</span><h3>{title}</h3><p>{children || 'Your next discovery starts here.'}</p></div>; }
export function SectionHeader({ eyebrow, title, children }) { return <header className="section-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="actions">{children}</div></header>; }
export function Toast({ message, error = false }) { return message ? <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{message}</p> : null; }
export function ErrorState({ message, retry }) { return <div className="notice error" role="alert"><p>{message}</p>{retry && <Button variant="ghost" onClick={retry}>Retry connection</Button>}</div>; }
export function ResourceState({ resource, children }) {
  if (resource.loading) return <Spinner />;
  if (resource.error) return <ErrorState message={resource.error} retry={resource.reload} />;
  return children;
}
export function Pagination({ offset, total, pageSize = 12, onChange }) {
  if (total <= pageSize) return null;
  return <nav className="pagination" aria-label="Results pages"><Button variant="ghost" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - pageSize))}>Previous</Button><span>{offset + 1}–{Math.min(offset + pageSize, total)} / {total}</span><Button variant="ghost" disabled={offset + pageSize >= total} onClick={() => onChange(offset + pageSize)}>Next</Button></nav>;
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null); const titleId = useId();
  useEffect(() => {
    const dialog = ref.current; const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={onClose}><div className="modal-heading"><h2 id={titleId}>{title}</h2><Button variant="ghost" onClick={onClose} aria-label="Close dialog">×</Button></div>{children}</dialog>;
}
