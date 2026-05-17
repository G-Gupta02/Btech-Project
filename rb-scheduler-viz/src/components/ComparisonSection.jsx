/**
 * ComparisonSection.jsx
 * ----------------------
 * Algorithm comparison panel with:
 *   • Bar chart – average throughput
 *   • Bar chart – Jain's Fairness Index
 *   • Line chart – throughput over time (moving avg)
 *   • Radar / summary table
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { ALGORITHMS, PERFORMANCE_METRICS, THROUGHPUT_TIME_SERIES } from '../data/mockData';

/* ─── Colour helpers ─────────────────────────────────────────────────────────── */
const ALGO_KEYS = Object.keys(ALGORITHMS);

/* ─── Custom tooltip for Recharts ───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ─── Build chart datasets ──────────────────────────────────────────────────── */

// 1. Bar chart data: throughput + fairness side-by-side
const barData = ALGO_KEYS.map(k => ({
  name:       ALGORITHMS[k].shortName,
  fullName:   ALGORITHMS[k].name,
  Throughput: PERFORMANCE_METRICS[k].avgThroughput,
  Fairness:   PERFORMANCE_METRICS[k].fairness,
  color:      ALGORITHMS[k].color,
}));

// 2. Time-series line chart (sub-sampled to 60 points with 10-step MA)
const movingAvg = (arr, w = 10) =>
  arr.map((_, i, a) => {
    if (i < w - 1) return null;
    return +(a.slice(i - w + 1, i + 1).reduce((s, v) => s + v, 0) / w).toFixed(4);
  }).filter(v => v !== null);

const timeData = (() => {
  const series = {};
  ALGO_KEYS.forEach(k => { series[k] = movingAvg(THROUGHPUT_TIME_SERIES[k], 10); });
  const len = Math.min(...Object.values(series).map(a => a.length));
  return Array.from({ length: len }, (_, i) => ({
    step: i + 10,
    ...Object.fromEntries(ALGO_KEYS.map(k => [ALGORITHMS[k].shortName, series[k][i]])),
  }));
})();

// 3. Radar data
const radarData = [
  { metric: 'Throughput', RR: 29, SNR: 100, PF: 81, D3QN: 91 },
  { metric: 'Fairness',   RR: 100, SNR: 17, PF: 89, D3QN: 94 },
  { metric: 'Utilization',RR: 52,  SNR: 91, PF: 79, D3QN: 87 },
  { metric: 'Latency',    RR: 30,  SNR: 95, PF: 82, D3QN: 90 },
  { metric: 'Adaptivity', RR: 10,  SNR: 35, PF: 60, D3QN: 98 },
];

/* ─── Metric summary table ──────────────────────────────────────────────────── */
const MetricTable = () => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <th style={thStyle}>Algorithm</th>
          <th style={thStyle}>Phase</th>
          <th style={thStyle}>Avg Throughput</th>
          <th style={thStyle}>Jain Fairness</th>
          <th style={thStyle}>Utilization</th>
          <th style={thStyle}>Latency</th>
        </tr>
      </thead>
      <tbody>
        {ALGO_KEYS.map((k, i) => {
          const a = ALGORITHMS[k];
          const m = PERFORMANCE_METRICS[k];
          const isDQN = k === 'duelingDQN';
          return (
            <motion.tr
              key={k}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: isDQN ? 'rgba(196,78,82,0.06)' : 'transparent',
              }}
            >
              <td style={{ ...tdStyle, fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                  {a.name}
                </div>
              </td>
              <td style={tdStyle}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11,
                  background: a.phase === 2 ? 'rgba(196,78,82,0.15)' : 'rgba(99,102,241,0.12)',
                  color: a.phase === 2 ? '#f87171' : '#a5b4fc',
                }}>Phase {a.phase}</span>
              </td>
              <td style={{ ...tdStyle, color: a.color, fontFamily: 'monospace' }}>{m.avgThroughput} Mbps</td>
              <td style={{ ...tdStyle, color: a.color, fontFamily: 'monospace' }}>{m.fairness.toFixed(4)}</td>
              <td style={{ ...tdStyle, color: '#94a3b8' }}>{m.utilization}%</td>
              <td style={{ ...tdStyle, color: '#94a3b8' }}>{m.latency} ms</td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const thStyle = {
  padding: '10px 14px', textAlign: 'left',
  color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const tdStyle = { padding: '12px 14px', color: '#cbd5e1' };

/* ─── Card wrapper ──────────────────────────────────────────────────────────── */
const Card = ({ title, subtitle, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    style={{
      background: 'rgba(15,15,30,0.7)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '1.5rem',
      backdropFilter: 'blur(10px)',
    }}
  >
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </motion.div>
);

/* ─── Main component ─────────────────────────────────────────────────────────── */
const ComparisonSection = () => {
  const [activeAlgos, setActiveAlgos] = useState(new Set(ALGO_KEYS));

  const toggleAlgo = key => {
    setActiveAlgos(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  return (
    <section id="comparison" style={{ padding: '6rem 2rem', background: 'rgba(5,5,15,0.4)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', color: '#8172B2',
            textTransform: 'uppercase', marginBottom: 12,
          }}>Performance Analysis</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Algorithm Comparison
          </h2>
          <p style={{ color: '#64748b', marginTop: 12, fontSize: '1rem', maxWidth: 560, margin: '12px auto 0' }}>
            Quantitative comparison across throughput, Jain's Fairness Index, latency, and utilisation metrics.
          </p>
        </motion.div>

        {/* Toggle buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {ALGO_KEYS.map(k => {
            const a = ALGORITHMS[k];
            const on = activeAlgos.has(k);
            return (
              <motion.button key={k} whileTap={{ scale: 0.95 }} onClick={() => toggleAlgo(k)} style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${on ? a.color : 'rgba(255,255,255,0.08)'}`,
                background: on ? `${a.color}18` : 'transparent',
                color: on ? a.color : '#64748b',
                transition: 'all 0.2s',
              }}>
                {a.name}
              </motion.button>
            );
          })}
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Throughput bar */}
          <Card title="Average Throughput" subtitle="Mbps per step (higher is better)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={barData.filter((_, i) => activeAlgos.has(ALGO_KEYS[i]))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Throughput" radius={[5, 5, 0, 0]}>
                  {barData
                    .filter((_, i) => activeAlgos.has(ALGO_KEYS[i]))
                    .map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Fairness bar */}
          <Card title="Jain's Fairness Index" subtitle="0–1 scale (1.0 = perfect fairness)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0.5rem 0' }}>
              {barData.filter((_, i) => activeAlgos.has(ALGO_KEYS[i])).map(d => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: d.color, fontWeight: 600 }}>{d.fullName}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {d.Fairness.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ height: 20, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${d.Fairness * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: d.color, borderRadius: 4 }}
                    />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>
                ── Perfect fairness at 1.0 ──
              </div>
            </div>
          </Card>
        </div>

        {/* Time-series line chart */}
        <Card
          title="Throughput Over Time"
          subtitle="10-step moving average (Mbps)"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Time Step', position: 'insideBottom', fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Mbps', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
              {ALGO_KEYS.filter(k => activeAlgos.has(k)).map(k => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={ALGORITHMS[k].shortName}
                  stroke={ALGORITHMS[k].color}
                  strokeWidth={k === 'duelingDQN' ? 2.5 : 1.5}
                  dot={false}
                  strokeDasharray={k === 'duelingDQN' ? undefined : (k === 'proportionalFair' ? '6 3' : undefined)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <Card title="Multi-Metric Radar" subtitle="Normalised 0–100 scores across key dimensions">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#334155', fontSize: 9 }} domain={[0, 100]} />
                {ALGO_KEYS.filter(k => activeAlgos.has(k)).map(k => (
                  <Radar
                    key={k}
                    name={ALGORITHMS[k].shortName}
                    dataKey={ALGORITHMS[k].shortName}
                    stroke={ALGORITHMS[k].color}
                    fill={ALGORITHMS[k].color}
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Metrics table */}
          <Card title="Summary Table" subtitle="All algorithms at a glance">
            <MetricTable />
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
