import { useEffect, useId, useRef, useState } from 'react';
import DataSlate, { DataSlateIcon } from './DataSlate';
import { Button } from './ui';

export default function DataSlateDrawer({ resource, briefing }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!open) return;
    // Native modal behavior contains focus and makes the covered Hub inert.
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  function dismissBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      setOpen(false);
    }
  }

  return <>
    <Button ref={triggerRef} variant="ghost" className="slate-toggle" aria-label="Open Data Slate" title="Open Data Slate"
      aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}>
      <DataSlateIcon /><span>Data Slate</span>
    </Button>
    <dialog ref={dialogRef} id={id} className="slate-drawer" aria-labelledby={`${id}-title`} onClick={dismissBackdrop}
      onCancel={(event) => {
        // An Escape from the nested log reader must only close that reader.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        setOpen(false);
      }}>
      <DataSlate resource={resource} briefing={briefing} titleId={`${id}-title`} onClose={() => setOpen(false)} />
    </dialog>
  </>;
}
