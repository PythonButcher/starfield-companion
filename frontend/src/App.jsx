import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hub from './pages/Hub';
import Journal from './pages/Journal';
import LogEntry from './pages/LogEntry';
import Crew from './pages/Crew';


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/new" element={<LogEntry />} />
          <Route path="/crew" element={<Crew />} />
          {/* Placeholders for other routes */}
          <Route path="/planet-pulse" element={<div className="text-center mt-20 text-xl text-hud-blue animate-pulse">PLANET PULSE MODULE OFFLINE</div>} />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
