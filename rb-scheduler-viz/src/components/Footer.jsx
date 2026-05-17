/**
 * Footer.jsx
 * ----------
 * Minimal project footer.
 */

import React from 'react';

const Footer = () => (
  <footer style={{
    padding: '2rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(3,3,10,0.9)',
  }}>
    <div style={{
      maxWidth: 1200, margin: '0 auto',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
          5G Resource Block Scheduler Visualiser
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>
          B.Tech Final Year Project · Wireless Communication & Deep Reinforcement Learning
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#334155' }}>
        <div>Phase 1: Round Robin · Max-SNR · Proportional Fair</div>
        <div>Phase 2: Dueling Double DQN (PyTorch)</div>
        <div style={{ marginTop: 4 }}>Built with React · Recharts · Framer Motion</div>
      </div>
    </div>
  </footer>
);

export default Footer;
