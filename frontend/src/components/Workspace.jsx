import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Workspace({ name, tabs }) {
  const location = useLocation();
  return <>
    <nav className="workspace-tabs" aria-label={name + ' tools'}>
      {tabs.map(([path, label, end = false]) => <NavLink key={path} to={path} end={end}>{label}</NavLink>)}
    </nav>
    <Outlet key={location.pathname + location.search} />
  </>;
}
