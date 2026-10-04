import Portfolio from './pages/Portfolio';
import SupplyNetworks from './pages/SupplyNetworks';
import ShipForge from './pages/ShipForge';
import Surveys from './pages/Surveys';
import Missions from './pages/Missions';
import Crafting from './pages/Crafting';
import Outposts from './pages/Outposts';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Hub from './pages/Hub';
import Journal from './pages/Journal';
import LogEntry from './pages/LogEntry';
import LogDetail from './pages/LogDetail';
import Crew from './pages/Crew';
import Media from './pages/Media';
import Galaxy from './pages/Galaxy';
import Workspace from './components/Workspace';
import RamManager from './pages/RamManager';
import { SelectedSystemsProvider } from './context/SelectedSystemsContext';
import { EmptyState } from './components/ui';

// Preserve record IDs, filters and anchors in bookmarked module URLs.
function LegacyRoute({ to }) {
  const { search, hash } = useLocation();
  return <Navigate replace to={to + search + hash} />;
}

export default function App() {
  return <SelectedSystemsProvider><BrowserRouter><Layout><Routes>
    <Route path="/" element={<Hub />} />
    <Route path="/galaxy" element={<Workspace name="Galaxy & Surveys" tabs={[
      ['/galaxy', 'Star Map & Worlds', true], ['/galaxy/surveys', 'Survey Gap Ledger'],
    ]} />}>
      <Route index element={<Galaxy />} /><Route path="surveys" element={<Surveys />} />
    </Route>
    <Route path="/logistics" element={<Workspace name="Logistics & Industry" tabs={[
      ['/logistics/outposts', 'Outpost Planner'], ['/logistics/portfolio', 'Resource Coverage Matrix'],
      ['/logistics/crafting', 'Crafting & Research Trees'],
      ['/logistics/supply-network', 'Supply Chain Visualizer'],
    ]} />}>
      <Route index element={<LegacyRoute to="/logistics/outposts" />} />
      <Route path="outposts" element={<Outposts />} /><Route path="portfolio" element={<Portfolio />} />
      <Route path="crafting" element={<Crafting />} /><Route path="crafting/research" element={<RamManager />} />
      <Route path="supply-network" element={<SupplyNetworks />} />
    </Route>
    <Route path="/crew" element={<Workspace name="Fleet & Crew" tabs={[
      ['/crew', 'Fleet & Crew Roster', true], ['/crew/blueprints', 'Ship Forge & Blueprints'],
    ]} />}><Route index element={<Crew />} /><Route path="blueprints" element={<ShipForge />} /></Route>
    <Route path="/journal" element={<Workspace name="Logbook & Archives" tabs={[
      ['/journal', 'Captain’s Logs', true], ['/journal/missions', 'Mission Checklists'], ['/journal/media', 'Media Archive'],
    ]} />}>
      <Route index element={<Journal />} /><Route path="new" element={<LogEntry />} />
      <Route path=":id" element={<LogDetail />} /><Route path=":id/edit" element={<LogEntry />} />
      <Route path="missions" element={<Missions />} /><Route path="media" element={<Media />} />
    </Route>
    {Object.entries({ '/planet-pulse': '/galaxy', '/surveys': '/galaxy/surveys', '/outposts': '/logistics/outposts',
      '/portfolio': '/logistics/portfolio', '/crafting': '/logistics/crafting', '/ram': '/logistics/crafting/research',
      '/missions': '/journal/missions', '/media': '/journal/media', '/radar': '/',
    }).map(([from, to]) => <Route key={from} path={from} element={<LegacyRoute to={to} />} />)}
    <Route path="*" element={<EmptyState title="Signal not found">This route is outside the charted systems. Choose a module above.</EmptyState>} />
  </Routes></Layout></BrowserRouter></SelectedSystemsProvider>;
}
