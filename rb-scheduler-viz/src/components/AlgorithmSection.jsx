/**
 * AlgorithmSection.jsx
 * ---------------------
 * Explains each algorithm with:
 *   • Decision-logic visual (pseudo-code style)
 *   • Pros/Cons list
 *   • Phase badge
 *   • Animated reveal on scroll
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALGORITHMS, PERFORMANCE_METRICS } from '../data/mockData';

/* ─── Pseudo-code block per algorithm ─────────────────────────────────────── */
const PSEUDO_CODE = {
  roundRobin: `// Round Robin — O(1) per step
idx = 0
for each time slot t:
  schedule( user = idx )
  idx = (idx + 1) mod N_USERS`,

  maxSNR: `// Max-SNR — O(N) per step
for each time slot t:
  snr[u] = channel_gain[u] * tx_power / noise
  schedule( user = argmax(snr) )`,

  proportionalFair: `// Proportional Fair — O(N) per step
avg_rate = ones(N) * 1e-6   # long-term avg
β = 0.9
for each time slot t:
  score[u] = channel[u] / avg_rate[u]
  chosen = argmax(score)
  schedule( user = chosen )
  avg_rate[chosen] = β*avg_rate[chosen]
                   + (1-β)*channel[chosen]`,

  duelingDQN: `// Dueling Double DQN — O(1) inference
# State = [channel_gains | avg_rates]
state = env.get_state()         # dim: 2N
with no_grad():
  Q_vals = online_net(state)    # Dueling heads
  # Q(s,a) = V(s) + A(s,a) - mean(A)
  action = argmax(Q_vals)       # chosen user
env.step(action)

# (Training via experience replay & target net)`,
};

/* ─── Small metric pill ───────────────────────────────────────────────────── */
const MetricPill = ({ label, value, color }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 12px', borderRadius: 8,
    background: `${color}10`, border: `1px solid ${color}25`,
    fontSize: 12,
  }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <span style={{ color, fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

/* ─── Single algorithm card ───────────────────────────────────────────────── */
const AlgoCard = ({ algo, isSelected, onClick, index }) => {
  const metrics = PERFORMANCE_METRICS[algo.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12 }}
      onClick={onClick}
      style={{
        background: isSelected ? `rgba(15,15,30,0.9)` : 'rgba(12,12,24,0.6)',
        border: `1.5px solid ${isSelected ? algo.color : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16, padding: '1.4rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: isSelected ? `0 0 30px ${algo.color}22` : 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${algo.color}20`,
          border: `1.5px solid ${algo.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: algo.color,
        }}>{algo.shortName}</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{algo.name}</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
              background: algo.phase === 2 ? 'rgba(196,78,82,0.15)' : 'rgba(99,102,241,0.12)',
              color: algo.phase === 2 ? '#f87171' : '#a5b4fc',
            }}>Phase {algo.phase}</span>
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
            Complexity: <code style={{ color: '#94a3b8' }}>{algo.complexity}</code>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isSelected ? 90 : 0 }}
          style={{ color: algo.color, fontSize: 18, lineHeight: 1 }}
        >›</motion.div>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 10px' }}>
        {algo.description}
      </p>

      {/* Quick metrics */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <MetricPill label="Throughput" value={`${metrics.avgThroughput} Mbps`} color={algo.color} />
        <MetricPill label="Fairness"   value={metrics.fairness.toFixed(4)}     color={algo.color} />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '1rem' }}>
              {/* Pseudo-code */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Decision Logic
                </div>
                <pre style={{
                  background: '#080814', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '1rem', fontSize: 11,
                  color: '#a5b4fc', fontFamily: '"Fira Code", "Courier New", monospace',
                  lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {PSEUDO_CODE[algo.id]}
                </pre>
              </div>

              {/* Pros / Cons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#10b981', marginBottom: 6, fontWeight: 700 }}>✓ Advantages</div>
                  {algo.pros.map(p => (
                    <div key={p} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, paddingLeft: 12 }}>
                      · {p}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 6, fontWeight: 700 }}>✗ Disadvantages</div>
                  {algo.cons.map(c => (
                    <div key={c} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, paddingLeft: 12 }}>
                      · {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── DQN Architecture diagram (SVG-based) ─────────────────────────────────── */
const DQNDiagram = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    style={{
      background: 'rgba(15,15,30,0.7)',
      border: '1px solid rgba(196,78,82,0.2)',
      borderRadius: 16, padding: '1.5rem',
      backdropFilter: 'blur(10px)',
    }}
  >
    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
      Dueling Double DQN Architecture
    </div>
    <div style={{ fontSize: 12, color: '#475569', marginBottom: '1.2rem' }}>
      State space: 2N (channel gains + avg rates) → Dueling heads → Q-values → argmax → action
    </div>
    <svg viewBox="0 0 700 180" style={{ width: '100%', fontFamily: 'sans-serif' }}>
      {/* Nodes */}
      {[
        { x: 40,  y: 70, w: 80,  h: 40, label: 'State\n(2N dim)', color: '#6366f1' },
        { x: 160, y: 70, w: 80,  h: 40, label: 'Shared\nFC Layers', color: '#8b5cf6' },
        { x: 295, y: 30, w: 80,  h: 40, label: 'Value\nV(s)', color: '#DD8452' },
        { x: 295, y: 110, w: 80, h: 40, label: 'Advantage\nA(s,a)', color: '#DD8452' },
        { x: 430, y: 70, w: 80,  h: 40, label: 'Q(s,a)\nCombine', color: '#8172B2' },
        { x: 565, y: 70, w: 80,  h: 40, label: 'argmax\nAction', color: '#C44E52' },
      ].map(({ x, y, w, h, label, color }, i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx={8} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
          {label.split('\n').map((line, li) => (
            <text key={li} x={x + w / 2} y={y + 14 + li * 14} textAnchor="middle" fill={color} fontSize={10} fontWeight={600}>
              {line}
            </text>
          ))}
        </g>
      ))}

      {/* Arrows */}
      {[
        [120, 90, 160, 90],
        [240, 90, 295, 50],
        [240, 90, 295, 130],
        [375, 50, 430, 90],
        [375, 130, 430, 90],
        [510, 90, 565, 90],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={1.5}
          markerEnd="url(#arrow)" />
      ))}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
        </marker>
      </defs>

      {/* Labels */}
      <text x={350} y={18} textAnchor="middle" fill="#475569" fontSize={9}>Dueling Heads</text>
      <text x={470} y={65} textAnchor="middle" fill="#475569" fontSize={9}>Q = V + A - mean(A)</text>
    </svg>
  </motion.div>
);

/* ─── Main component ─────────────────────────────────────────────────────────── */
const AlgorithmSection = () => {
  const [selectedAlgo, setSelectedAlgo] = useState('duelingDQN');

  return (
    <section id="algorithms" style={{ padding: '6rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', color: '#DD8452',
            textTransform: 'uppercase', marginBottom: 12,
          }}>Algorithm Explainer</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Under the Hood
          </h2>
          <p style={{ color: '#64748b', marginTop: 12, fontSize: '1rem', maxWidth: 560, margin: '12px auto 0' }}>
            Click any algorithm to reveal its decision logic, pseudo-code, and trade-offs.
          </p>
        </motion.div>

        {/* Algorithm cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {Object.values(ALGORITHMS).map((algo, i) => (
            <AlgoCard
              key={algo.id}
              algo={algo}
              index={i}
              isSelected={selectedAlgo === algo.id}
              onClick={() => setSelectedAlgo(selectedAlgo === algo.id ? null : algo.id)}
            />
          ))}
        </div>

        {/* DQN architecture diagram */}
        <DQNDiagram />

        {/* Why DL wins banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, rgba(196,78,82,0.08) 0%, rgba(99,102,241,0.08) 100%)',
            border: '1px solid rgba(196,78,82,0.2)',
            borderRadius: 16, padding: '1.5rem 2rem',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>
            Why Deep Reinforcement Learning wins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['End-to-end optimisation', 'No hand-crafted rules — the agent discovers the optimal policy directly from rewards.'],
              ['Handles non-stationarity', 'Adapts to time-varying channels that break fixed heuristics.'],
              ['Throughput + Fairness', 'The PF-shaped reward simultaneously pushes both metrics, unlike greedy rules.'],
              ['Dueling + Double trick', 'Reduces overestimation bias and stabilises learning in large discrete action spaces.'],
            ].map(([title, body]) => (
              <div key={title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AlgorithmSection;
