import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Workspace({ name, tabs }) {
  const location = useLocation();
  const fitted = !location.pathname.startsWith('/galaxy');
  return <div className={fitted ? 'terminal-workspace' : undefined}>
    <nav className="workspace-tabs" aria-label={name + ' tools'}>
      {tabs.map(([path, label, end = false]) => <NavLink key={path} to={path} end={end}>{label}</NavLink>)}
    </nav>
    {fitted ? <div className="workspace-screen" key={location.pathname} tabIndex={0} role="region" aria-label={name + ' workspace'}><Outlet key={location.pathname + location.search} /></div>
      : <Outlet key={location.pathname + location.search} />}
  </div>;
}
