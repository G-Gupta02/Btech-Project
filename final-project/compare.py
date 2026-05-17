#!/usr/bin/env python3
"""
compare.py — Full Comparison: Phase 1 Baselines vs Phase 2 Dueling Double DQN
Run from:  d:\\fresh_project\\final project\\
    python compare.py
"""

import os, sys, importlib.util, time
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT   = os.path.dirname(os.path.abspath(__file__))
PHASE1 = os.path.join(ROOT, 'phase1')
PHASE2 = os.path.join(ROOT, 'phase2')
OUT    = os.path.join(ROOT, 'results')

# ── Config ────────────────────────────────────────────────────────────────────
SEED         = 42
N_USERS      = 10
N_EVAL_STEPS = 2000
MODEL_PATH   = os.path.join(PHASE2, 'double_dqn_model.pth')

COLORS = {
    'Round Robin':        '#4C72B0',
    'Max-SNR':            '#DD8452',
    'Proportional Fair':  '#8172B2',
    'Dueling Double DQN': '#C44E52',
}

# ── Dynamic module loader ─────────────────────────────────────────────────────
def load_module(name, filepath):
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# ── Load environment and model from final project folders ─────────────────────
# Phase 1 environment (realistic 5G sim — used by the baselines)
p1_env_mod    = load_module("p1_env",  os.path.join(PHASE1, 'env', 'wireless_env.py'))
WirelessEnv   = p1_env_mod.WirelessEnv

# Phase 2 environment (same physical sim + PF reward — what the DQN was trained on)
p2_env_mod    = load_module("p2_env",  os.path.join(PHASE2, 'env', 'wireless_env.py'))
WirelessEnvP2 = p2_env_mod.WirelessEnv

# Phase 2 Dueling Double DQN network
p2_net_mod    = load_module("p2_net",  os.path.join(PHASE2, 'rl', 'dqn_network.py'))
DuelingNet    = p2_net_mod.DQNNetwork

# Phase 2 replay buffer
p2_rb_mod     = load_module("p2_rb",   os.path.join(PHASE2, 'rl', 'replay_buffer.py'))
ReplayBuffer  = p2_rb_mod.ReplayBuffer

# ── Helpers ───────────────────────────────────────────────────────────────────
def set_seed(s=SEED):
    np.random.seed(s)
    torch.manual_seed(s)

def make_env():
    return WirelessEnv(
        n_users=N_USERS, cell_radius=500.0,
        noise_power=1e-9, tx_power=1.0,
        bandwidth=1e6, episode_length=200,
    )

def jain_fairness(pur):
    r   = np.array(pur, dtype=np.float64)
    num = r.sum() ** 2
    den = len(r) * (r ** 2).sum()
    return float(num / den) if den > 0 else 0.0

def moving_avg(data, w=50):
    if len(data) < w:
        return np.array(data)
    return np.convolve(data, np.ones(w) / w, mode='valid')

# ── Phase 1: Baseline Schedulers ──────────────────────────────────────────────
def run_round_robin():
    set_seed()
    env   = make_env()
    state = env.reset()
    pur   = np.zeros(N_USERS)
    thr   = []
    idx   = 0
    for _ in range(N_EVAL_STEPS):
        state, _, done, info = env.step(idx)
        pur[idx] += info['raw_rate']
        thr.append(info['raw_rate'] / 1e6)
        idx = (idx + 1) % N_USERS
        if done:
            state = env.reset()
    return pur, thr

def run_max_snr():
    set_seed()
    env   = make_env()
    state = env.reset()
    pur   = np.zeros(N_USERS)
    thr   = []
    for _ in range(N_EVAL_STEPS):
        a = int(np.argmax(state[:N_USERS]))
        state, _, done, info = env.step(a)
        pur[a] += info['raw_rate']
        thr.append(info['raw_rate'] / 1e6)
        if done:
            state = env.reset()
    return pur, thr

def run_proportional_fair():
    set_seed()
    env   = make_env()
    state = env.reset()
    pur   = np.zeros(N_USERS)
    thr   = []
    avg   = np.ones(N_USERS) * 1e-6
    beta  = 0.9
    for _ in range(N_EVAL_STEPS):
        a = int(np.argmax(state[:N_USERS] / avg))
        state, _, done, info = env.step(a)
        pur[a] += info['raw_rate']
        thr.append(info['raw_rate'] / 1e6)
        avg      = beta * avg
        avg[a]  += (1 - beta) * info['raw_rate']
        if done:
            state = env.reset()
    return pur, thr

# ── Phase 2: Dueling Double DQN (pre-trained) ─────────────────────────────────
def run_dueling_dqn():
    set_seed()
    # Use Phase 2 environment — the same one the model was trained on (PF reward)
    env = WirelessEnvP2(
        n_users=N_USERS, cell_radius=500.0,
        noise_power=1e-9, tx_power=1.0,
        bandwidth=1e6, episode_length=200,
    )
    net = DuelingNet(N_USERS * 2, N_USERS)

    if not os.path.exists(MODEL_PATH):
        print(f"  [!] Model not found at {MODEL_PATH}")
        print(      "      Running with an untrained network (results will be poor).")
    else:
        net.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
        print(f"  [OK] Loaded pre-trained model: {MODEL_PATH}")

    net.eval()
    state = env.reset()
    pur   = np.zeros(N_USERS)
    thr   = []
    for _ in range(N_EVAL_STEPS):
        with torch.no_grad():
            a = torch.argmax(net(torch.FloatTensor(state).unsqueeze(0))).item()
        state, _, done, info = env.step(a)
        raw = info.get('raw_rate', info.get('rate_mbps', 0) * 1e6)
        pur[a] += raw
        thr.append(raw / 1e6)
        if done:
            state = env.reset()
    return pur, thr

# ── Plots ─────────────────────────────────────────────────────────────────────
def make_plots(results):
    os.makedirs(OUT, exist_ok=True)
    labels   = list(results.keys())
    cols     = [COLORS[l] for l in labels]
    avg_thr  = [np.mean(results[l]['steps']) for l in labels]
    fairness = [jain_fairness(results[l]['pur'])  for l in labels]

    fig = plt.figure(figsize=(20, 16))
    fig.suptitle(
        '5G Resource Allocation — Final Comparison\n'
        'Phase 1 Baselines  vs  Phase 2 Dueling Double DQN',
        fontsize=16, fontweight='bold', y=0.99
    )
    gs = fig.add_gridspec(3, 2, hspace=0.50, wspace=0.35)

    # 1. Average throughput bar chart
    ax1 = fig.add_subplot(gs[0, 0])
    bars = ax1.bar(labels, avg_thr, color=cols, edgecolor='black', width=0.5)
    ax1.set_title('Average Throughput per Step', fontweight='bold', fontsize=12)
    ax1.set_ylabel('Throughput (Mbps)')
    ax1.set_ylim(0, max(avg_thr) * 1.30)
    for b, v in zip(bars, avg_thr):
        ax1.text(b.get_x() + b.get_width() / 2, b.get_height() + max(avg_thr) * 0.015,
                 f'{v:.3f}', ha='center', va='bottom', fontweight='bold', fontsize=10)
    ax1.set_xticklabels(labels, rotation=12, ha='right', fontsize=9)
    ax1.grid(axis='y', alpha=0.4)

    # 2. Jain's Fairness Index bar chart
    ax2 = fig.add_subplot(gs[0, 1])
    bars2 = ax2.bar(labels, fairness, color=cols, edgecolor='black', width=0.5)
    ax2.set_title("Jain's Fairness Index", fontweight='bold', fontsize=12)
    ax2.set_ylabel('Fairness (0 – 1)')
    ax2.set_ylim(0, 1.25)
    ax2.axhline(1.0, color='green', linestyle='--', alpha=0.5, label='Perfect (1.0)')
    for b, v in zip(bars2, fairness):
        ax2.text(b.get_x() + b.get_width() / 2, b.get_height() + 0.015,
                 f'{v:.4f}', ha='center', va='bottom', fontweight='bold', fontsize=10)
    ax2.set_xticklabels(labels, rotation=12, ha='right', fontsize=9)
    ax2.grid(axis='y', alpha=0.4)
    ax2.legend(fontsize=9)

    # 3. Per-user throughput grouped bar chart
    ax3 = fig.add_subplot(gs[1, :])
    x = np.arange(N_USERS)
    w = 0.70 / len(labels)
    for i, lbl in enumerate(labels):
        pu = results[lbl]['pur'] / 1e6
        ax3.bar(x + i * w - (len(labels) - 1) * w / 2, pu, width=w,
                label=lbl, color=COLORS[lbl], edgecolor='black', linewidth=0.5, alpha=0.87)
    ax3.set_title(f'Per-User Throughput over {N_EVAL_STEPS} Steps', fontweight='bold', fontsize=12)
    ax3.set_ylabel('Total Throughput (Mbps)')
    ax3.set_xlabel('User (UE Index)')
    ax3.set_xticks(x)
    ax3.set_xticklabels([f'UE {i}' for i in range(N_USERS)])
    ax3.legend(fontsize=9)
    ax3.grid(axis='y', alpha=0.4)

    # 4. Throughput over time (moving average)
    ax4 = fig.add_subplot(gs[2, :])
    w2 = 50
    for lbl in labels:
        ma = moving_avg(results[lbl]['steps'], w2)
        ax4.plot(range(w2 - 1, w2 - 1 + len(ma)), ma,
                 label=lbl, color=COLORS[lbl], linewidth=2.0)
    ax4.set_title(f'Throughput Over Time ({w2}-step Moving Average)', fontweight='bold', fontsize=12)
    ax4.set_xlabel('Step')
    ax4.set_ylabel('Throughput (Mbps)')
    ax4.legend(fontsize=9)
    ax4.grid(alpha=0.4)

    out_path = os.path.join(OUT, 'comparison_plot.png')
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\n  [OK] Plot saved -> {out_path}")

# ── Text Report ───────────────────────────────────────────────────────────────
def save_report(results):
    labels   = list(results.keys())
    avg_thr  = {l: np.mean(results[l]['steps'])     for l in labels}
    fairness = {l: jain_fairness(results[l]['pur'])  for l in labels}

    lines = [
        "=" * 65,
        "  FINAL PROJECT: 5G Resource Allocation Comparison",
        "  Phase 1 Baselines  vs  Phase 2 Dueling Double DQN",
        "=" * 65,
        f"\n  Eval Steps : {N_EVAL_STEPS} | Seed: {SEED} | Users: {N_USERS}",
        f"  Environment: Realistic 5G (500m cell, path-loss a=3.5)\n",
        f"  {'Algorithm':<22} {'Avg Throughput (Mbps)':>22} {'Jain Fairness':>15}",
        "  " + "-" * 62,
    ]
    for l in labels:
        lines.append(f"  {l:<22} {avg_thr[l]:>22.4f} {fairness[l]:>15.4f}")
    lines.append("=" * 65)

    best_t = max(labels, key=lambda l: avg_thr[l])
    best_f = max(labels, key=lambda l: fairness[l])
    lines += [
        f"\n  Best Throughput : {best_t}  ({avg_thr[best_t]:.4f} Mbps)",
        f"  Best Fairness   : {best_f}  ({fairness[best_f]:.4f})",
        "\n  --- Gains of Dueling Double DQN vs Baselines ---",
    ]
    drl = 'Dueling Double DQN'
    for base in ['Round Robin', 'Max-SNR', 'Proportional Fair']:
        if base in avg_thr:
            gt = (avg_thr[drl]  - avg_thr[base])  / avg_thr[base]  * 100
            gf = (fairness[drl] - fairness[base]) / fairness[base] * 100
            lines.append(f"  vs {base:<22} | Throughput: {gt:+.1f}%   Fairness: {gf:+.1f}%")

    report = "\n".join(lines)
    print("\n" + report)
    os.makedirs(OUT, exist_ok=True)
    rpt_path = os.path.join(OUT, 'comparison_report.txt')
    with open(rpt_path, 'w') as f:
        f.write(report)
    print(f"\n  [OK] Report saved -> {rpt_path}")

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    results = {}
    sep = "=" * 55

    print(f"\n{sep}")
    print("  PHASE 1 — Baseline Schedulers")
    print(sep)

    print("\n  [1/4] Round Robin ...")
    pur, thr = run_round_robin()
    results['Round Robin'] = {'pur': pur, 'steps': thr}
    print(f"        Thr: {np.mean(thr):.4f} Mbps  |  Fair: {jain_fairness(pur):.4f}")

    print("\n  [2/4] Max-SNR ...")
    pur, thr = run_max_snr()
    results['Max-SNR'] = {'pur': pur, 'steps': thr}
    print(f"        Thr: {np.mean(thr):.4f} Mbps  |  Fair: {jain_fairness(pur):.4f}")

    print("\n  [3/4] Proportional Fair ...")
    pur, thr = run_proportional_fair()
    results['Proportional Fair'] = {'pur': pur, 'steps': thr}
    print(f"        Thr: {np.mean(thr):.4f} Mbps  |  Fair: {jain_fairness(pur):.4f}")

    print(f"\n{sep}")
    print("  PHASE 2 — Dueling Double DQN")
    print(sep)

    print("\n  [4/4] Dueling Double DQN (pre-trained) ...")
    pur, thr = run_dueling_dqn()
    results['Dueling Double DQN'] = {'pur': pur, 'steps': thr}
    print(f"        Thr: {np.mean(thr):.4f} Mbps  |  Fair: {jain_fairness(pur):.4f}")

    print(f"\n{sep}")
    print("  GENERATING OUTPUTS ...")
    print(sep)
    save_report(results)
    make_plots(results)
    print(f"\n  Done! All results saved in: {OUT}/\n")
