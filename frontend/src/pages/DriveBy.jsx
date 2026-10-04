import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CosmoDropZone from '../components/CosmoDropZone';
import { Button } from '../components/ui';
export default function DriveBy({ context }) {
  const [open, setOpen] = useState(false); const ref = useRef(null);
  useEffect(() => {
    const outside = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return <div className="driveby" ref={ref}><Button variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>Drive-By +</Button>{open && <div className="driveby-panel stack"><h2>Quick actions</h2><div className="actions"><Link onClick={() => setOpen(false)} to="/journal/new">New log</Link><Link onClick={() => setOpen(false)} to="/journal/media">Media gallery</Link></div><CosmoDropZone context={context} /></div>}</div>;
}
