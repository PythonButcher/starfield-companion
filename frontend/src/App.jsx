import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hub from './pages/Hub';
import Journal from './pages/Journal';
import LogEntry from './pages/LogEntry';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/new" element={<LogEntry />} />
          {/* Placeholders for other routes */}
          <Route path="/planet-pulse" element={<div className="text-center mt-20 text-xl text-hud-blue animate-pulse">PLANET PULSE MODULE OFFLINE</div>} />
          <Route path="/crew" element={<div className="text-center mt-20 text-xl text-hud-blue animate-pulse">CREW ROSTER OFFLINE</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
