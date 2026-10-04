import Navbar from './Navbar';
import { StripeAccent } from './ui';
export default function Layout({ children }) {
  return <div className="app-shell"><Navbar /><main className="app-main" id="main-content">{children}</main><footer className="app-footer"><span>CONSTELLATION / PERSONAL EXPLORATION TERMINAL</span><StripeAccent /><span>LOCAL ARCHIVE • 01</span></footer></div>;
}
