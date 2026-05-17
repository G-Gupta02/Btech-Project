import torch
import torch.nn as nn


class DQNNetwork(nn.Module):
    """
    Phase 3: Dueling DQN Network Architecture.

    Splits into two streams after shared feature extraction:
      - Value stream  V(s)      : how good is the current state?
      - Advantage stream A(s,a) : how much better is each action?
    Combined as: Q(s,a) = V(s) + A(s,a) - mean(A(s,·))

    Outperforms standard DQN for resource scheduling problems.
    """

    def __init__(self, state_dim, action_dim):
        super(DQNNetwork, self).__init__()

        # Shared feature extractor
        self.feature = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
        )

        # Value stream: scalar V(s)
        self.value_stream = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

        # Advantage stream: A(s, a) for each action
        self.advantage_stream = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, action_dim),
        )

    def forward(self, x):
        features = self.feature(x)
        value     = self.value_stream(features)          # (batch, 1)
        advantage = self.advantage_stream(features)      # (batch, n_actions)
        # Combine: Q = V + (A - mean(A))
        q = value + (advantage - advantage.mean(dim=1, keepdim=True))
        return q