import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hub from './pages/Hub';
import Journal from './pages/Journal';
import LogEntry from './pages/LogEntry';
import LogDetail from './pages/LogDetail';
import Crew from './pages/Crew';
import Planets from './pages/Planets';
import RamManager from './pages/RamManager';
import { SelectedSystemsProvider } from './context/SelectedSystemsContext';
import { EmptyState } from './components/ui';
export default function App() {
  return <SelectedSystemsProvider><BrowserRouter><Layout><Routes>
    <Route path="/" element={<Hub />} /><Route path="/journal" element={<Journal />} />
    <Route path="/journal/new" element={<LogEntry />} /><Route path="/journal/:id" element={<LogDetail />} /><Route path="/journal/:id/edit" element={<LogEntry />} />
    <Route path="/crew" element={<Crew />} /><Route path="/ram" element={<RamManager />} />
    <Route path="/planet-pulse" element={<Planets />} />
    <Route path="/media" element={<EmptyState title="Media archive is being connected" />} />
    <Route path="*" element={<EmptyState title="Signal not found">This route is outside the charted systems. Choose a module above.</EmptyState>} />
  </Routes></Layout></BrowserRouter></SelectedSystemsProvider>;
}
