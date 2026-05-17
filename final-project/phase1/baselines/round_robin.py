import numpy as np

def round_robin_scheduler(env, n_steps=1000):
    """
    Simple Round Robin scheduler:
    - At each time step, pick the next user in order.
    """
    state = env.reset()
    total_reward = 0.0

    # Track per-user total rate (for fairness calculation)
    per_user_rate = np.zeros(env.n_users, dtype=np.float64)

    user_idx = 0

    for _ in range(n_steps):
        action = user_idx  # Choose user in cyclic order

        next_state, reward, _, info = env.step(action)

        total_reward += reward
        per_user_rate[action] += info["raw_rate"]

        # Move to next user
        user_idx = (user_idx + 1) % env.n_users

        state = next_state  # not used further here, but kept for completeness

    avg_reward = total_reward / n_steps
    return avg_reward, per_user_rate
