import numpy as np

def max_snr_scheduler(env, n_steps=1000):
    """
    Max-SNR scheduler:
    - At each time step, choose the user with highest channel gain.
    """
    state = env.reset()
    total_reward = 0.0

    per_user_rate = np.zeros(env.n_users, dtype=np.float64)
    n_users = env.n_users

    for _ in range(n_steps):
        # In our state, first n_users entries are current channel gains
        channel_gains = state[:n_users]

        # Pick user with highest gain
        action = int(np.argmax(channel_gains))

        next_state, reward, _, info = env.step(action)

        total_reward += reward
        per_user_rate[action] += info["raw_rate"]

        state = next_state

    avg_reward = total_reward / n_steps
    return avg_reward, per_user_rate
