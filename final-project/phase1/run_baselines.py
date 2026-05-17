from env.wireless_env import WirelessEnv
from baselines.round_robin import round_robin_scheduler
from baselines.max_snr import max_snr_scheduler
import numpy as np


def jain_fairness(per_user_rate):
    """
    Compute Jain's Fairness Index:
    J = (sum r_i)^2 / (N * sum r_i^2)
    """
    rates = np.array(per_user_rate, dtype=np.float64)
    num = (rates.sum()) ** 2
    den = len(rates) * (rates**2).sum()
    if den == 0:
        return 0.0
    return num / den


def main():
    # Optional: for reproducibility
    np.random.seed(42)

    # Create environment
    env = WirelessEnv(
        n_users=10,
        cell_radius=500.0,
        noise_power=1e-9,
        tx_power=1.0,
        bandwidth=1e6,
    )

    n_steps = 2000  # number of time steps to simulate for each scheduler

    print("Running Round Robin scheduler...")
    rr_avg_reward, rr_per_user_rate = round_robin_scheduler(env, n_steps=n_steps)
    rr_fairness = jain_fairness(rr_per_user_rate)

    print("\nRunning Max-SNR scheduler...")
    msnr_avg_reward, msnr_per_user_rate = max_snr_scheduler(env, n_steps=n_steps)
    msnr_fairness = jain_fairness(msnr_per_user_rate)

    print("\n=== Results over", n_steps, "time steps ===")
    print(f"Round Robin:  avg throughput = {rr_avg_reward:.2e} bits/s")
    print(f"Round Robin:  Jain fairness  = {rr_fairness:.4f}")

    print(f"\nMax-SNR:      avg throughput = {msnr_avg_reward:.2e} bits/s")
    print(f"Max-SNR:      Jain fairness  = {msnr_fairness:.4f}")

    print("\nPer-user total rate (RR):")
    print(rr_per_user_rate)

    print("\nPer-user total rate (Max-SNR):")
    print(msnr_per_user_rate)


if __name__ == "__main__":
    main()
