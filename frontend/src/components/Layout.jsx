import ReferenceCredit from './ReferenceCredit';
import Navbar from './Navbar';
import { StripeAccent } from './ui';
export default function Layout({ children }) {
  return <div className="app-shell"><Navbar /><main className="app-main" id="main-content">{children}</main><footer className="app-footer"><span>CONSTELLATION / PERSONAL EXPLORATION TERMINAL</span><StripeAccent /><ReferenceCredit /></footer></div>;
}
