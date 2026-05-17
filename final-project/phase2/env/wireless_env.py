import numpy as np


class WirelessEnv:
    """
    Phase 3 5G-like downlink environment.

    Key upgrade over Phase 2:
    - Uses Proportional Fair (PF) reward: rate / (avg_rate + epsilon)
    - Forces the AI to balance BOTH throughput AND fairness.
    - Compatible with Dueling Double DQN.
    """

    def __init__(
        self,
        n_users=10,
        cell_radius=500.0,
        noise_power=1e-9,
        tx_power=1.0,
        bandwidth=1e6,
        episode_length=200,
        reward_scale=1e6,      # divide rate by this (1e6 => Mbps)
        fix_user_positions=True,
    ):
        self.n_users = n_users
        self.cell_radius = cell_radius
        self.noise_power = noise_power
        self.tx_power = tx_power
        self.bandwidth = bandwidth
        self.episode_length = episode_length
        self.reward_scale = reward_scale
        self.fix_user_positions = fix_user_positions

        # Path loss exponent
        self.alpha = 3.5

        # If fixed positions (recommended for RL)
        if self.fix_user_positions:
            self.user_distances = np.random.uniform(
                50.0, self.cell_radius, self.n_users
            ).astype(np.float32)
        else:
            self.user_distances = None

        self.channel_gains = None
        self.avg_rate = None
        self.t = 0

    # --------------------------------------------------
    # Reset
    # --------------------------------------------------
    def reset(self):
        self.t = 0

        if not self.fix_user_positions:
            self.user_distances = np.random.uniform(
                50.0, self.cell_radius, self.n_users
            ).astype(np.float32)

        self.avg_rate = np.zeros(self.n_users, dtype=np.float32)

        self._update_channel()

        return self._get_state()

    # --------------------------------------------------
    # Channel Update
    # --------------------------------------------------
    def _update_channel(self):
        path_loss = self.user_distances ** (-self.alpha)
        fading = np.random.exponential(scale=1.0, size=self.n_users)
        self.channel_gains = (path_loss * fading).astype(np.float32)

    # --------------------------------------------------
    # State
    # --------------------------------------------------
    def _get_state(self):
        return np.concatenate(
            [self.channel_gains, self.avg_rate], axis=0
        ).astype(np.float32)

    # --------------------------------------------------
    # Step
    # --------------------------------------------------
    def step(self, action):
        user = int(action)

        if user < 0 or user >= self.n_users:
            raise ValueError(f"Invalid action {action}")

        h = float(self.channel_gains[user])

        snr = (self.tx_power * h) / self.noise_power

        rate = float(self.bandwidth * np.log2(1.0 + snr))

        # Phase 3: Proportional Fair (PF) reward
        # The AI is rewarded proportionally to how much this user has been starved.
        # reward = rate_mbps / (user_avg_rate + epsilon)
        rate_mbps = rate / self.reward_scale

        # Proportional Fair reward (penalises hogging one user repeatedly)
        # Compute reward BEFORE updating avg_rate for stability
        pf_epsilon = 0.1   # prevents division by zero and massive reward spikes
        reward = rate_mbps / (self.avg_rate[user] + pf_epsilon)

        # Update moving average throughput for ALL users (crucial for fairness decay)
        beta = 0.9
        self.avg_rate = beta * self.avg_rate
        self.avg_rate[user] += (1.0 - beta) * rate_mbps

        # Update channel for next time slot
        self._update_channel()

        self.t += 1
        done = self.t >= self.episode_length

        next_state = self._get_state()

        info = {
            "raw_rate": rate,              # bits/sec (for evaluation)
            "rate_mbps": rate_mbps,        # Mbps throughput
            "pf_reward": reward,           # Proportional Fair reward given to agent
            "user": user,
        }

        return next_state, reward, done, info