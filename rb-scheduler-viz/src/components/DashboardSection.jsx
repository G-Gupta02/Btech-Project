/**
 * DashboardSection.jsx
 * ---------------------
 * Live-updating performance dashboard.
 * Simulates real-time stats with periodic random variation to feel alive.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ALGORITHMS, PERFORMANCE_METRICS, DASHBOARD_STATS } from '../data/mockData';

/* ─── Stat card ──────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, unit, color, icon, delta }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    whileHover={{ y: -3 }}
    style={{
      background: 'rgba(15,15,30,0.7)',
      border: `1px solid ${color}22`,
      borderRadius: 14, padding: '1.2rem',
      backdropFilter: 'blur(10px)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, color: '#64748b' }}>{unit}</span>
    </div>
    {delta !== undefined && (
      <div style={{ fontSize: 11, marginTop: 6, color: delta >= 0 ? '#10b981' : '#ef4444' }}>
        {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)} vs baseline
      </div>
    )}
  </motion.div>
);

/* ─── Mini gauge (SVG arc) ─────────────────────────────────────────────────── */
const Gauge = ({ value, max = 100, color, label }) => {
  const pct     = Math.min(value / max, 1);
  const R       = 44;
  const cx      = 56, cy = 58;
  const start   = Math.PI * 0.75;          // 135°
  const end     = Math.PI * 2.25;          // 405°
  const range   = end - start;
  const angle   = start + range * pct;

  const arc = (theta) => [cx + R * Math.cos(theta), cy + R * Math.sin(theta)];
  const [sx, sy] = arc(start);
  const [ex, ey] = arc(end);
  const [px, py] = arc(angle);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 112 80" style={{ width: 110, overflow: 'visible' }}>
        {/* BG arc */}
        <path
          d={`M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`}
          fill="none" stroke="#1e293b" strokeWidth={8} strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${sx} ${sy} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${px} ${py}`}
          fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        />
        {/* Needle dot */}
        <circle cx={px} cy={py} r={5} fill={color} />
        {/* Center value */}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={14} fontWeight={800}>{value}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#475569" fontSize={9}>{label}</text>
      </svg>
    </div>
  );
};

/* ─── Live mini-line for each algorithm ─────────────────────────────────────── */
const useLiveStream = (baseValue, noise = 0.3, interval = 1000) => {
  const [data, setData] = useState(
    Array.from({ length: 20 }, (_, i) => ({ t: i, v: baseValue + (Math.random() - 0.5) * noise }))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const next = { t: last.t + 1, v: +(baseValue + (Math.random() - 0.5) * noise * 2).toFixed(3) };
        return [...prev.slice(-29), next];
      });
    }, interval);
    return () => clearInterval(id);
  }, [baseValue, noise, interval]);
  return data;
};

const MiniStream = ({ baseValue, color }) => {
  const data = useLiveStream(baseValue, baseValue * 0.18, 800);
  return (
    <ResponsiveContainer width="100%" height={50}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} fill={`${color}18`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/* ─── Per-algorithm live card ─────────────────────────────────────────────── */
const AlgoLiveCard = ({ algo }) => {
  const m = PERFORMANCE_METRICS[algo.id];
  const [thr, setThr] = useState(m.avgThroughput);

  useEffect(() => {
    const id = setInterval(() => {
      setThr(+(m.avgThroughput + (Math.random() - 0.5) * m.avgThroughput * 0.12).toFixed(4));
    }, 1100);
    return () => clearInterval(id);
  }, [m.avgThroughput]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{
        background: 'rgba(12,12,24,0.7)',
        border: `1px solid ${algo.color}22`,
        borderRadius: 14, padding: '1rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: algo.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{algo.name}</span>
        </div>
        <div style={{
          fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
          background: algo.phase === 2 ? 'rgba(196,78,82,0.15)' : 'rgba(99,102,241,0.12)',
          color: algo.phase === 2 ? '#f87171' : '#a5b4fc',
        }}>Ph {algo.phase}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={thr}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '1.5rem', fontWeight: 800, color: algo.color, fontFamily: 'monospace', marginBottom: 2 }}
        >
          {thr} <span style={{ fontSize: 12, fontWeight: 400, color: '#475569' }}>Mbps</span>
        </motion.div>
      </AnimatePresence>

      <MiniStream baseValue={m.avgThroughput} color={algo.color} />

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#475569' }}>Fairness</div>
          <div style={{ fontSize: 12, color: algo.color, fontWeight: 700 }}>{m.fairness.toFixed(4)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#475569' }}>Util.</div>
          <div style={{ fontSize: 12, color: algo.color, fontWeight: 700 }}>{m.utilization}%</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#475569' }}>Latency</div>
          <div style={{ fontSize: 12, color: algo.color, fontWeight: 700 }}>{m.latency} ms</div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main DashboardSection ──────────────────────────────────────────────────── */
const DashboardSection = () => (
  <section id="dashboard" style={{ padding: '6rem 2rem', background: 'rgba(3,3,10,0.5)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', color: '#10b981',
          textTransform: 'uppercase', marginBottom: 12,
        }}>Live Dashboard</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
          Performance Monitoring
        </h2>
        <p style={{ color: '#64748b', marginTop: 12, fontSize: '1rem', maxWidth: 560, margin: '12px auto 0' }}>
          Real-time metrics stream. Values fluctuate to simulate live network conditions.
        </p>
      </motion.div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Active Users"  value={DASHBOARD_STATS.activeUsers} unit="UEs"   color="#6366f1" icon="👥" />
        <StatCard label="Total RBs"     value={DASHBOARD_STATS.totalRBs}    unit="blocks" color="#10b981" icon="📦" />
        <StatCard label="Cell Radius"   value="500"                          unit="m"      color="#DD8452" icon="📡" />
        <StatCard label="Bandwidth"     value="1"                            unit="MHz"    color="#8172B2" icon="〰️" />
        <StatCard label="Tx Power"      value="1.0"                          unit="W"      color="#C44E52" icon="⚡" />
        <StatCard label="Path-Loss α"   value="3.5"                          unit=""       color="#f59e0b" icon="📉" />
      </div>

      {/* Gauges row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem',
        background: 'rgba(15,15,30,0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 16, padding: '1.5rem',
      }}>
        {Object.values(ALGORITHMS).map(algo => (
          <div key={algo.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Gauge
              value={PERFORMANCE_METRICS[algo.id].utilization}
              color={algo.color}
              label={algo.shortName}
            />
            <span style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Utilization</span>
          </div>
        ))}
      </div>

      {/* Live algorithm cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {Object.values(ALGORITHMS).map(algo => (
          <AlgoLiveCard key={algo.id} algo={algo} />
        ))}
      </div>
    </div>
  </section>
);

export default DashboardSection;
