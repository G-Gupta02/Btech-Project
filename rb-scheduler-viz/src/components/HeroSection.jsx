/**
 * HeroSection.jsx
 * ---------------
 * Landing hero with animated tagline, brief overview cards,
 * and a floating RB grid for visual interest.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Animated background grid of RBs
const FloatingGrid = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {Array.from({ length: 80 }).map((_, i) => (
      <motion.div
        key={i}
        style={{
          position: 'absolute',
          width: 32, height: 32,
          borderRadius: 4,
          border: '1px solid rgba(99,102,241,0.15)',
          background: 'rgba(99,102,241,0.03)',
          left: `${(i % 10) * 10 + 2}%`,
          top:  `${Math.floor(i / 10) * 18 + 2}%`,
        }}
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{
          duration: 2 + (i % 4),
          repeat: Infinity,
          delay: i * 0.08,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const StatBadge = ({ value, label, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    style={{
      background: 'rgba(15,15,30,0.7)',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: '1.2rem 1.8rem',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
    }}
  >
    <div style={{ fontSize: '2rem', fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
  </motion.div>
);

const TAG_COLORS = ['#6366f1', '#DD8452', '#8172B2', '#C44E52'];

const HeroSection = () => (
  <section id="hero" style={{
    minHeight: '100vh',
    display: 'flex', alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 80,
  }}>
    {/* Gradient orbs */}
    <div style={{
      position: 'absolute', top: '10%', left: '20%',
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: '10%', right: '15%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(196,78,82,0.10) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    <FloatingGrid />

    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }}>
      {/* Phase badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '6px 16px', marginBottom: '1.5rem',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'block' }} />
        <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.06em' }}>
          B.Tech Final Year Project · 5G Resource Allocation
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        style={{
          fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: '#f1f5f9' }}>Resource Block</span>
        <br />
        <span style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #c44e52 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Scheduling Visualiser</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          fontSize: '1.15rem', color: '#94a3b8',
          maxWidth: 660, lineHeight: 1.7, marginBottom: '2.5rem',
        }}
      >
        An interactive demonstration comparing <strong style={{ color: '#a5b4fc' }}>classical baseline schedulers</strong> against a
        trained <strong style={{ color: '#f87171' }}>Dueling Double DQN</strong> agent for downlink resource allocation
        in a realistic 5G wireless environment. Explore allocation behaviour, fairness–throughput trade-offs, and deep
        learning's scheduling advantage.
      </motion.p>

      {/* Algorithm tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '3rem' }}
      >
        {['Round Robin', 'Max-SNR', 'Proportional Fair', 'Dueling Double DQN'].map((name, i) => (
          <span key={name} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: `${TAG_COLORS[i]}18`,
            border: `1px solid ${TAG_COLORS[i]}44`,
            color: TAG_COLORS[i],
          }}>{name}</span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '4rem' }}
      >
        <a
          href="#simulation"
          onClick={e => { e.preventDefault(); document.querySelector('#simulation')?.scrollIntoView({ behavior: 'smooth' }); }}
          style={{
            padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ▶ Launch Simulation
        </a>
        <a
          href="#comparison"
          onClick={e => { e.preventDefault(); document.querySelector('#comparison')?.scrollIntoView({ behavior: 'smooth' }); }}
          style={{
            padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: 'transparent',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc', textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
        >
          View Results →
        </a>
      </motion.div>

      {/* Stat badges */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}
      >
        <StatBadge value="4"        label="Algorithms"       color="#6366f1" />
        <StatBadge value="10"       label="Users (UEs)"      color="#DD8452" />
        <StatBadge value="2,000"    label="Eval Steps"       color="#8172B2" />
        <StatBadge value="0.9412"   label="Best Fairness"    color="#C44E52" />
        <StatBadge value="2.35 Mbps" label="Peak Throughput" color="#10b981" />
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
