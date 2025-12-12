import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hub from './pages/Hub';
import Journal from './pages/Journal';
import LogEntry from './pages/LogEntry';
import Crew from './pages/Crew';
import RamManager from './pages/RamManager';
import { SelectedSystemsProvider } from './context/SelectedSystemsContext';



function App() {
  return (
    <SelectedSystemsProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/new" element={<LogEntry />} />
            <Route path="/crew" element={<Crew />} />
            <Route path="/ram" element={<RamManager />} />
            {/* Placeholders for other routes */}
            <Route path="/planet-pulse" element={<div className="text-center mt-20 text-xl text-hud-blue animate-pulse">PLANET PULSE MODULE OFFLINE</div>} />

          </Routes>
        </Layout>
      </Router>
    </SelectedSystemsProvider>
  );
}

export default App;
