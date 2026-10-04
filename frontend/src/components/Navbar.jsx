import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import SystemSearch from './SystemSearch';
import DriveBy from '../pages/DriveBy';
import { StripeAccent } from './ui';
const routes = [['/', 'Explorer’s Hub'], ['/journal', 'Quantum Journal'], ['/planet-pulse', 'PlanetPulse'], ['/crew', 'Crew Command'], ['/missions', 'Missions'], ['/outposts', 'Outposts'], ['/media', 'CosmoDrag'], ['/ram', 'R.A.M.']];
export default function Navbar() {
  const location = useLocation(); const navigate = useNavigate();
  useEffect(() => {
    const keydown = (event) => {
      if (event.target.closest('input, textarea, select, [contenteditable], dialog')) return;
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) navigate('/journal/new');
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [navigate]);
  return <nav className="app-nav" aria-label="Main navigation"><div className="brand-row"><Link className="brand" to="/"><span className="brand-symbol" aria-hidden="true">✳</span><span>STARFIELD<small>COMPANION / EXPLORER TERMINAL</small></span></Link><StripeAccent /><SystemSearch /></div><div className="nav-links">{routes.map(([path, label]) => <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>)}<DriveBy context={{ route: location.pathname }} /></div></nav>;
}
