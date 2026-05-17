/**
 * HeatmapSection.jsx
 * -------------------
 * Heatmap / timeline visualisation showing which user received which
 * Resource Block at each time slot. Colour-coded by user index.
 *
 * Algorithm can be toggled via a selector at the top.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALGORITHMS, generateHeatmapData } from '../data/mockData';

const N_STEPS  = 30;   // time slots (columns)
const N_USERS  = 10;   // rows

/* ─── User colours ──────────────────────────────────────────────────────────── */
const USER_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899',
];

/* ─── Heatmap cell ──────────────────────────────────────────────────────────── */
const Cell = ({ user, rate, step, rowUser, animate }) => {
  const isAllocated = user === rowUser;
  const color       = isAllocated ? USER_COLORS[user] : 'transparent';

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: step * 0.02, duration: 0.25 }}
      title={isAllocated ? `t=${step} UE${user} (rate=${rate})` : undefined}
      style={{
        width: '100%', aspectRatio: '1',
        background: isAllocated ? `${color}cc` : 'rgba(15,23,42,0.4)',
        borderRadius: 3,
        border: `1px solid ${isAllocated ? `${color}80` : 'rgba(255,255,255,0.03)'}`,
        boxShadow: isAllocated ? `0 0 6px ${color}55` : 'none',
        transition: 'all 0.2s',
      }}
    />
  );
};

/* ─── Allocation frequency bar ─────────────────────────────────────────────── */
const FrequencyBar = ({ data, nSteps }) => {
  const counts = Array(N_USERS).fill(0);
  data.forEach(({ user }) => counts[user]++);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0.5rem 0' }}>
      {Array.from({ length: N_USERS }).map((_, u) => (
        <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: USER_COLORS[u], flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#64748b', width: 34 }}>UE {u}</span>
          <div style={{ flex: 1, height: 8, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts[u] / nSteps) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: USER_COLORS[u], borderRadius: 3 }}
            />
          </div>
          <span style={{ fontSize: 10, color: '#475569', width: 28, textAlign: 'right' }}>
            {counts[u]}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────────── */
const HeatmapSection = () => {
  const [selectedAlgo, setSelectedAlgo] = useState('roundRobin');
  const [animKey, setAnimKey]           = useState(0);

  const data = useMemo(
    () => generateHeatmapData(selectedAlgo, N_STEPS, N_USERS),
    [selectedAlgo]
  );

  const switchAlgo = id => {
    setSelectedAlgo(id);
    setAnimKey(k => k + 1);
  };

  const algo = ALGORITHMS[selectedAlgo];

  return (
    <section id="heatmap" style={{ padding: '6rem 2rem', background: 'rgba(5,5,15,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', color: '#f59e0b',
            textTransform: 'uppercase', marginBottom: 12,
          }}>Timeline View</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Resource Block Allocation Heatmap
          </h2>
          <p style={{ color: '#64748b', marginTop: 12, fontSize: '1rem', maxWidth: 600, margin: '12px auto 0' }}>
            Each row = one user. Each column = one time slot. A coloured cell means that user was allocated
            the Resource Block at that time slot.
          </p>
        </motion.div>

        {/* Algorithm toggle */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {Object.values(ALGORITHMS).map(a => (
            <motion.button
              key={a.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => switchAlgo(a.id)}
              style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                border: `1.5px solid ${selectedAlgo === a.id ? a.color : 'rgba(255,255,255,0.08)'}`,
                background: selectedAlgo === a.id ? `${a.color}18` : 'transparent',
                color: selectedAlgo === a.id ? a.color : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              {a.name}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Heatmap grid ──────────────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(12,12,24,0.8)',
            border: `1px solid ${algo.color}22`,
            borderRadius: 16, padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            overflowX: 'auto',
          }}>
            {/* Column headers (time steps) */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 50, flexShrink: 0 }} />
              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${N_STEPS}, 1fr)`,
                gap: 3,
              }}>
                {Array.from({ length: N_STEPS }).map((_, t) => (
                  <div key={t} style={{ fontSize: 8, color: '#334155', textAlign: 'center' }}>
                    {t + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows (users) */}
            {Array.from({ length: N_USERS }).map((_, u) => (
              <div key={`${animKey}-${u}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                {/* Row label */}
                <div style={{
                  width: 50, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: USER_COLORS[u] }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>UE {u}</span>
                </div>

                {/* Cells */}
                <div style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${N_STEPS}, 1fr)`,
                  gap: 3,
                }}>
                  {data.map((d, t) => (
                    <Cell
                      key={t}
                      user={d.user}
                      rate={d.rate}
                      step={t}
                      rowUser={u}
                      animate={true}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Time axis label */}
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: '#334155' }}>← Time Slot →</span>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 16, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {Array.from({ length: N_USERS }).map((_, u) => (
                <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: USER_COLORS[u] }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>UE {u}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Algorithm info */}
            <div style={{
              background: 'rgba(12,12,24,0.7)',
              border: `1px solid ${algo.color}22`,
              borderRadius: 14, padding: '1.2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: algo.color }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{algo.name}</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {algo.description}
              </p>
            </div>

            {/* Allocation frequency */}
            <div style={{
              background: 'rgba(12,12,24,0.7)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 14, padding: '1.2rem',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
                Allocation Frequency (out of {N_STEPS} slots)
              </div>
              <FrequencyBar data={data} nSteps={N_STEPS} />
            </div>

            {/* Observations */}
            <div style={{
              background: 'rgba(12,12,24,0.7)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 14, padding: '1.2rem',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
                What to Observe
              </div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
                {selectedAlgo === 'roundRobin' && '⬤ Perfect uniform distribution — each row gets exactly the same number of slots. No channel awareness.'}
                {selectedAlgo === 'maxSNR'     && '⬤ Only 2–3 close users dominate all slots. Edge users (UE 6–9) get zero allocations — severe starvation.'}
                {selectedAlgo === 'proportionalFair' && '⬤ Near-uniform but channels users with better conditions more often. Good balance between RR and SNR.'}
                {selectedAlgo === 'duelingDQN' && '⬤ Learned policy: proportionally fair with slight preference for high-SNR users. Combines throughput + fairness optimally.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeatmapSection;
