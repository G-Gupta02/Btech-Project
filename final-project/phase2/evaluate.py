import torch
import numpy as np
import os

from env.wireless_env import WirelessEnv  # Fixed: was WirelessEnvRL
from rl.dqn_network import DQNNetwork


def jain_fairness(per_user_rate):
    rates = np.array(per_user_rate, dtype=np.float64)
    num = (rates.sum()) ** 2
    den = len(rates) * (rates**2).sum()
    return num / den if den > 0 else 0.0

def evaluate(model_path="double_dqn_model.pth"):

    if not os.path.exists(model_path):
        print(f"Model file '{model_path}' not found.")
        return

    env = WirelessEnv()  # Fixed: was WirelessEnvRL
    state_dim = env.n_users * 2
    action_dim = env.n_users

    model = DQNNetwork(state_dim, action_dim)
    model.load_state_dict(torch.load(model_path))
    model.eval()

    state = env.reset()
    total_throughput_mbps = 0
    per_user_rate = np.zeros(env.n_users, dtype=np.float64)
    steps = 1000

    for _ in range(steps):
        state_tensor = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            action = torch.argmax(model(state_tensor)).item()

        state, reward, done, info = env.step(action)  # Fixed: 4 return values
        total_throughput_mbps += info["rate_mbps"]
        per_user_rate[action] += info["rate_mbps"]

        if done:
            state = env.reset()

    avg_throughput_mbps = total_throughput_mbps / steps
    fairness = jain_fairness(per_user_rate)

    print(f"\nPhase 3 Model: {model_path}")
    print(f"Average Throughput: {avg_throughput_mbps:.3f} Mbps")
    print(f"Jain's Fairness Index: {fairness:.4f}")


if __name__ == "__main__":
    evaluate()