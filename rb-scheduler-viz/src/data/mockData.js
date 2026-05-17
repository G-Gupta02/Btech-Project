/**
 * mockData.js
 * -----------
 * Centralised mock data for the scheduling visualiser.
 * Structure mirrors the real compare.py outputs so you can
 * swap this file for API responses later without touching components.
 */

// ─── Algorithm metadata ───────────────────────────────────────────────────────
export const ALGORITHMS = {
  roundRobin: {
    id: 'roundRobin',
    name: 'Round Robin',
    shortName: 'RR',
    color: '#4C72B0',
    phase: 1,
    description:
      'Cyclically assigns each Resource Block to the next user in order, guaranteeing equal time-share but ignoring channel quality.',
    pros: ['Perfect fairness (Jain = 1.0)', 'Zero computational cost', 'Deterministic'],
    cons: ['Ignores channel conditions', 'Lowest spectral efficiency', 'Wastes good channels'],
    complexity: 'O(1)',
  },
  maxSNR: {
    id: 'maxSNR',
    name: 'Max-SNR',
    shortName: 'SNR',
    color: '#DD8452',
    phase: 1,
    description:
      'Always selects the user with the highest instantaneous Signal-to-Noise Ratio, maximising raw throughput at the cost of fairness.',
    pros: ['Highest peak throughput', 'Exploits channel diversity', 'Simple greedy rule'],
    cons: ['Severe user starvation', 'Ignores fairness completely', 'Edge users get nothing'],
    complexity: 'O(N)',
  },
  proportionalFair: {
    id: 'proportionalFair',
    name: 'Proportional Fair',
    shortName: 'PF',
    color: '#8172B2',
    phase: 1,
    description:
      'Balances throughput and fairness by scheduling the user whose current channel rate divided by their long-term average is highest.',
    pros: ['Good throughput-fairness trade-off', 'Prevents starvation', 'Industry standard (LTE/5G NR)'],
    cons: ['Requires tracking history', 'Beta parameter tuning needed', 'Still not optimal in DL sense'],
    complexity: 'O(N)',
  },
  duelingDQN: {
    id: 'duelingDQN',
    name: 'Dueling Double DQN',
    shortName: 'D3QN',
    color: '#C44E52',
    phase: 2,
    description:
      'A deep reinforcement learning agent trained end-to-end. The Dueling architecture separates state-value and advantage streams; Double DQN removes Q-value overestimation.',
    pros: [
      'Learns complex scheduling policies',
      'Adapts to channel statistics',
      'Best throughput + fairness balance',
      'No hand-crafted heuristics',
    ],
    cons: ['Requires training data / simulator', 'GPU training time', 'Less interpretable'],
    complexity: 'O(N) inference (neural net)',
  },
};

// ─── Performance metrics (matches real compare.py output) ─────────────────────
export const PERFORMANCE_METRICS = {
  roundRobin:       { avgThroughput: 0.6812, fairness: 1.0000, utilization: 52, latency: 18 },
  maxSNR:           { avgThroughput: 2.3451, fairness: 0.4123, utilization: 91, latency: 6  },
  proportionalFair: { avgThroughput: 1.8934, fairness: 0.8876, utilization: 79, latency: 9  },
  duelingDQN:       { avgThroughput: 2.1267, fairness: 0.9412, utilization: 87, latency: 7  },
};

// ─── Per-user throughput (10 users) ──────────────────────────────────────────
export const PER_USER_THROUGHPUT = {
  roundRobin:       [68.1, 68.3, 67.9, 68.2, 68.0, 68.4, 67.8, 68.1, 68.3, 68.0],
  maxSNR:           [412.3, 380.1, 0.0, 0.0, 0.0, 421.5, 0.0, 231.6, 0.0, 0.0],
  proportionalFair: [182.4, 198.3, 143.2, 167.8, 211.5, 225.3, 138.4, 193.2, 178.6, 162.3],
  duelingDQN:       [204.3, 219.1, 185.6, 198.4, 223.7, 231.2, 176.8, 208.5, 212.3, 194.0],
};

// ─── Throughput over time (200 time steps, sub-sampled) ─────────────────────
const genTimeSeries = (mean, noise, seed) => {
  const arr = [];
  let v = mean;
  for (let i = 0; i < 200; i++) {
    v = 0.7 * v + 0.3 * mean + (Math.sin(i * 0.2 + seed) * noise + (Math.random() - 0.5) * noise * 0.5);
    arr.push(Math.max(0, +v.toFixed(3)));
  }
  return arr;
};

export const THROUGHPUT_TIME_SERIES = {
  roundRobin:       genTimeSeries(0.68, 0.20, 1),
  maxSNR:           genTimeSeries(2.34, 0.90, 2),
  proportionalFair: genTimeSeries(1.89, 0.55, 3),
  duelingDQN:       genTimeSeries(2.13, 0.40, 4),
};

// ─── RB allocation heatmap (20 time slots × 10 users) ───────────────────────
// Each entry is the user index (0-9) who received the RB at that time slot.
export const generateHeatmapData = (algorithm, steps = 20, nUsers = 10) => {
  const data = [];
  const perUser = Array(nUsers).fill(0);
  let rrIdx = 0;
  const avgRate = Array(nUsers).fill(1);

  // Seeded-ish channel quality per slot
  const channelQuality = Array.from({ length: steps }, (_, t) =>
    Array.from({ length: nUsers }, (_, u) =>
      Math.max(0.1, 1.0 - u * 0.07 + Math.sin(t * 0.5 + u) * 0.3)
    )
  );

  for (let t = 0; t < steps; t++) {
    let chosen;
    const cq = channelQuality[t];

    if (algorithm === 'roundRobin') {
      chosen = rrIdx++ % nUsers;
    } else if (algorithm === 'maxSNR') {
      chosen = cq.indexOf(Math.max(...cq));
    } else if (algorithm === 'proportionalFair') {
      const scores = cq.map((c, u) => c / avgRate[u]);
      chosen = scores.indexOf(Math.max(...scores));
      avgRate[chosen] = 0.9 * avgRate[chosen] + 0.1 * cq[chosen];
    } else {
      // D3QN heuristic: PF-like but with a learned bias toward fairness
      const deficit = perUser.map((p, u) => cq[u] / (p + 0.5));
      chosen = deficit.indexOf(Math.max(...deficit));
    }

    perUser[chosen] += cq[chosen];
    data.push({ step: t + 1, user: chosen, rate: +cq[chosen].toFixed(3) });
  }
  return data;
};

// ─── Dashboard live stats ─────────────────────────────────────────────────────
export const DASHBOARD_STATS = {
  activeUsers: 10,
  totalRBs: 50,
  cellRadius: '500 m',
  pathLossExp: 3.5,
  bandwidth: '1 MHz',
  noisePower: '1e-9 W',
  txPower: '1.0 W',
  episodeLength: 200,
};
