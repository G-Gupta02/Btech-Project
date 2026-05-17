import numpy as np


def proportional_fair_scheduler(env, n_steps=1000):
    """
    Proportional Fair (PF) Scheduler.

    At each time step, selects the user with the highest ratio of:
        current_rate[user] / avg_rate[user]

    This is the industry-standard algorithm used in real 4G/5G base stations.
    It is specifically designed to balance BOTH throughput AND fairness —
    which is exactly what our DRL models are trying to achieve.

    A user gets selected when their current channel is good RELATIVE to their
    own historical average, not just compared to other users. This naturally
    prevents any single user from being starved.
    """
    state = env.reset()
    total_reward = 0.0

    n_users = env.n_users
    per_user_rate = np.zeros(n_users, dtype=np.float64)

    # Historical average rate tracker (exponential moving average)
    # Initialised to a small epsilon to avoid division by zero at step 0
    avg_rate = np.ones(n_users, dtype=np.float64) * 1e-6
    beta = 0.9  # EMA decay — same as the environment uses internally

    for _ in range(n_steps):
        # Current instantaneous channel gains are the first n_users elements of state
        channel_gains = state[:n_users]

        # Estimate instantaneous rate proportional to log2(1 + SNR)
        # We use channel_gains as a proxy — no need to compute actual bits/s here
        # since we only need relative ratios for scheduling decisions
        instantaneous_rate = channel_gains  # proportional to actual rate

        # PF metric: instantaneous_rate / historical_avg_rate
        pf_metric = instantaneous_rate / avg_rate

        # Pick the user with the highest PF metric
        action = int(np.argmax(pf_metric))

        next_state, reward, done, info = env.step(action)

        total_reward += reward
        per_user_rate[action] += info["raw_rate"]

        # Update EMA of average rate for the selected user only
        # (non-selected users' averages decay naturally — standard PF behaviour)
        avg_rate = beta * avg_rate
        avg_rate[action] += (1.0 - beta) * info["raw_rate"]

        state = next_state

        if done:
            state = env.reset()

    avg_reward = total_reward / n_steps
    return avg_reward, per_user_rate
