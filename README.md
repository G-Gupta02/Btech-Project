# B.Tech Final Year Project — 5G Resource Block Scheduling

**Deep Learning Techniques for Resource Allocation in 5G Wireless Networks**

---

## Repository Structure

```
├── final-project/          ← Python simulation & RL training code
│   ├── phase1/             ← Baseline schedulers (Round Robin, Max-SNR, Proportional Fair)
│   │   ├── baselines/      ← Scheduler implementations
│   │   └── env/            ← 5G wireless environment (WirelessEnv)
│   ├── phase2/             ← Dueling Double DQN agent
│   │   ├── env/            ← Phase 2 environment (PF reward shaping)
│   │   ├── rl/             ← DQN network, agent, replay buffer, trainer
│   │   └── double_dqn_model.pth   ← Pre-trained model weights
│   ├── results/            ← Generated plots & comparison report
│   └── compare.py          ← Master comparison script (runs all 4 algorithms)
│
└── rb-scheduler-viz/       ← Interactive React demo website
    ├── src/
    │   ├── components/     ← Hero, Simulation, Comparison, Algorithm, Dashboard, Heatmap
    │   ├── data/           ← mockData.js (swap in real outputs here)
    │   └── hooks/          ← useSimulation.js (step-by-step scheduling logic)
    └── package.json
```

---

## Phase 1 — Classical Baseline Schedulers

| Algorithm | Strategy | Complexity |
|---|---|---|
| Round Robin | Cyclic equal time-share | O(1) |
| Max-SNR | Always pick highest SNR user | O(N) |
| Proportional Fair | Balance throughput & fairness | O(N) |

---

## Phase 2 — Dueling Double DQN

- **State**: `[channel_gains (N) | avg_rates (N)]` — dimension 2N
- **Architecture**: Shared FC layers → Dueling Value/Advantage heads → Q(s,a)
- **Training**: Experience replay + target network (Double DQN to reduce overestimation)
- **Reward**: Proportional-Fair shaped reward (throughput + fairness)

### Results (2000 eval steps, 10 UEs, 500m cell)

| Algorithm | Avg Throughput | Jain Fairness |
|---|---|---|
| Round Robin | 0.6812 Mbps | **1.0000** |
| Max-SNR | **2.3451 Mbps** | 0.4123 |
| Proportional Fair | 1.8934 Mbps | 0.8876 |
| **Dueling Double DQN** | **2.1267 Mbps** | **0.9412** |

The D3QN agent achieves **+212% throughput vs Round Robin** while maintaining **+128% fairness vs Max-SNR**.

---

## Running the Python Simulation

```bash
cd "final-project"
pip install numpy torch matplotlib
python compare.py
# Outputs: results/comparison_plot.png + results/comparison_report.txt
```

## Running the React Demo Website

```bash
cd rb-scheduler-viz
npm install
npm start
# Opens http://localhost:3000
```

---

## Environment Parameters

| Parameter | Value |
|---|---|
| Cell radius | 500 m |
| Path-loss exponent α | 3.5 |
| Noise power | 1×10⁻⁹ W |
| Tx power | 1.0 W |
| Bandwidth | 1 MHz |
| Episode length | 200 steps |
| Fading model | Rayleigh (exponential) |
