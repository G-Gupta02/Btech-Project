/**
 * SimulationSection.jsx
 * ----------------------
 * The main interactive simulation panel.
 *
 * Layout:
 *  Left  → Algorithm selector + controls + live metrics
 *  Right → RB grid (animated) + user legend
 *
 * Each coloured cell in the grid shows which user was allocated
 * that Resource Block at the current time step.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../hooks/useSimulation';
import { ALGORITHMS } from '../data/mockData';

/* ─── Colour palette for 10 users ──────────────────────────────────────────── */
const USER_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899',
];

/* ─── A single Resource Block cell ─────────────────────────────────────────── */
const RBCell = ({ rbIndex, user, rate, isActive }) => {
  const color = user !== undefined ? USER_COLORS[user] : '#1e293b';

  return (
    <motion.div
      key={`${rbIndex}-${user}`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, backgroundColor: color }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.08, zIndex: 10 }}
      title={user !== undefined ? `RB ${rbIndex + 1} → UE ${user}  (rate: ${rate})` : `RB ${rbIndex + 1} (idle)`}
      style={{
        width: '100%',
        aspectRatio: '1.3',
        borderRadius: 6,
        border: `1.5px solid ${user !== undefined ? `${color}99` : '#334155'}`,
        cursor: 'default',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700,
        color: user !== undefined ? 'rgba(255,255,255,0.9)' : '#475569',
        boxShadow: user !== undefined ? `0 2px 12px ${color}55` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {user !== undefined && (
        <>
          <span style={{ fontSize: 10 }}>UE{user}</span>
          <span style={{ fontSize: 8, opacity: 0.75 }}>{rate}</span>
        </>
      )}
      {user === undefined && <span style={{ fontSize: 9 }}>RB{rbIndex + 1}</span>}

      {/* Shimmer on allocate */}
      {isActive && (
        <motion.div
          initial={{ left: '-100%' }}
          animate={{ left: '200%' }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute', top: 0, bottom: 0,
            width: '60%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
};

/* ─── User legend bar ───────────────────────────────────────────────────────── */
const UserLegend = ({ perUser, nUsers }) => {
  const total = perUser.reduce((s, v) => s + v, 0) || 1;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Accumulated Allocation
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Array.from({ length: nUsers }).map((_, u) => (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: USER_COLORS[u], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#94a3b8', width: 36 }}>UE {u}</span>
            <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${(perUser[u] / total) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%', background: USER_COLORS[u], borderRadius: 3 }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', width: 36, textAlign: 'right' }}>
              {((perUser[u] / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Algorithm selector button ─────────────────────────────────────────────── */
const AlgoButton = ({ algo, isSelected, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    style={{
      padding: '10px 14px',
      borderRadius: 8,
      border: `1.5px solid ${isSelected ? algo.color : 'rgba(255,255,255,0.06)'}`,
      background: isSelected ? `${algo.color}18` : 'rgba(15,15,30,0.5)',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: algo.color }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? algo.color : '#e2e8f0' }}>
        {algo.name}
      </span>
      <span style={{
        marginLeft: 'auto',
        fontSize: 10, fontWeight: 700,
        padding: '2px 8px', borderRadius: 10,
        background: `Phase ${algo.phase}` === 'Phase 1' ? 'rgba(99,102,241,0.15)' : 'rgba(196,78,82,0.15)',
        color: algo.phase === 1 ? '#a5b4fc' : '#f87171',
      }}>Phase {algo.phase}</span>
    </div>
    <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 18px', lineHeight: 1.4 }}>
      {algo.description.slice(0, 80)}…
    </p>
  </motion.button>
);

/* ─── Main SimulationSection ────────────────────────────────────────────────── */
const SimulationSection = () => {
  const [selectedAlgo, setSelectedAlgo] = useState('roundRobin');
  const [speed, setSpeed] = useState(2);

  const {
    step, isPlaying, allocation, perUser,
    handlePlay, handlePause, handleReset,
    nUsers, nRBs,
  } = useSimulation(selectedAlgo, speed);

  const algo = ALGORITHMS[selectedAlgo];

  return (
    <section id="simulation" style={{ padding: '6rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#6366f1', textTransform: 'uppercase', marginBottom: 12,
          }}>Interactive Simulation</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Step-by-Step RB Allocation
          </h2>
          <p style={{ color: '#64748b', marginTop: 12, fontSize: '1rem', maxWidth: 560, margin: '12px auto 0' }}>
            Watch each algorithm assign Resource Blocks to users in real time. Colour = user identity.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>

          {/* ── Left panel ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Algorithm selector */}
            <div style={{
              background: 'rgba(15,15,30,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '1.2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Select Algorithm
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.values(ALGORITHMS).map(a => (
                  <AlgoButton
                    key={a.id}
                    algo={a}
                    isSelected={selectedAlgo === a.id}
                    onClick={() => setSelectedAlgo(a.id)}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{
              background: 'rgba(15,15,30,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '1.2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Playback Controls
              </div>

              {/* Step counter */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Time Step</span>
                <span style={{
                  fontFamily: 'monospace', fontSize: 18, fontWeight: 700,
                  color: algo.color,
                }}>{String(step).padStart(4, '0')}</span>
              </div>

              {/* Play / Pause / Reset */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {!isPlaying ? (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handlePlay} style={btnStyle('#10b981')}>
                    ▶ Play
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handlePause} style={btnStyle('#f59e0b')}>
                    ⏸ Pause
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset} style={btnStyle('#ef4444', true)}>
                  ↺ Reset
                </motion.button>
              </div>

              {/* Speed slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                  <span>Speed</span>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
                    {['Slow', 'Normal', 'Fast', 'Faster', 'Turbo'][speed - 1]}
                  </span>
                </div>
                <input
                  type="range" min={1} max={5} value={speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', marginTop: 2 }}>
                  <span>1×</span><span>2×</span><span>3×</span><span>4×</span><span>5×</span>
                </div>
              </div>
            </div>

            {/* User allocation bars */}
            <div style={{
              background: 'rgba(15,15,30,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '1.2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <UserLegend perUser={perUser} nUsers={nUsers} />
            </div>
          </div>

          {/* ── Right panel: RB Grid ─────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(15,15,30,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '1.5rem',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                  Resource Block Grid
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                  {nRBs} RBs · {nUsers} UEs · Algorithm: <span style={{ color: algo.color }}>{algo.name}</span>
                </div>
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isPlaying ? '#10b981' : '#475569',
                boxShadow: isPlaying ? '0 0 10px #10b981' : 'none',
                transition: 'all 0.3s',
              }} />
            </div>

            {/* RB Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.ceil(nRBs / 2)}, 1fr)`,
              gap: 8,
              marginBottom: '1.5rem',
            }}>
              {Array.from({ length: nRBs }).map((_, rb) => {
                const alloc = allocation.find(a => a.rbIndex === rb);
                return (
                  <RBCell
                    key={rb}
                    rbIndex={rb}
                    user={alloc?.user}
                    rate={alloc?.rate}
                    isActive={isPlaying && !!alloc}
                  />
                );
              })}
            </div>

            {/* User color key */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                User Equipment (UE) Colour Map
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: nUsers }).map((_, u) => (
                  <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: USER_COLORS[u] }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>UE {u}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* Helper: generic button style */
const btnStyle = (color, outline = false) => ({
  flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', border: outline ? `1.5px solid ${color}` : 'none',
  background: outline ? 'transparent' : `${color}22`,
  color, transition: 'all 0.2s',
});

export default SimulationSection;
