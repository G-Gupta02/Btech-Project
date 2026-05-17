/**
 * App.js
 * -------
 * Root component — assembles all sections in order.
 * Import new sections here if you add more later.
 */

import React from 'react';
import './index.css';

// Layout
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';

// Sections (in page order)
import HeroSection       from './components/HeroSection';
import SimulationSection from './components/SimulationSection';
import ComparisonSection from './components/ComparisonSection';
import AlgorithmSection  from './components/AlgorithmSection';
import DashboardSection  from './components/DashboardSection';
import HeatmapSection    from './components/HeatmapSection';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#05050f' }}>
      {/* Sticky navigation */}
      <Navbar />

      {/* Main content */}
      <main>
        <HeroSection />
        <SimulationSection />
        <ComparisonSection />
        <AlgorithmSection />
        <DashboardSection />
        <HeatmapSection />
      </main>

      <Footer />
    </div>
  );
}

export default App;
