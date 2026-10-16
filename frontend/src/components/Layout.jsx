import ReferenceCredit from './ReferenceCredit';
import Navbar from './Navbar';
import StarterControls from './StarterControls';
import { StripeAccent } from './ui';
import { useLocation } from 'react-router-dom';
export default function Layout({ children }) {
  const { pathname } = useLocation();
  // Galaxy keeps its existing composition; the terminal workspaces fit the window.
  const fitted = !pathname.startsWith('/galaxy');
  return <div className={'app-shell' + (fitted ? ' terminal-shell' : '')}><Navbar /><main className="app-main" id="main-content">{children}</main><footer className="app-footer"><span>CONSTELLATION / PERSONAL EXPLORATION TERMINAL</span><StarterControls /><StripeAccent /><ReferenceCredit /></footer></div>;
}
