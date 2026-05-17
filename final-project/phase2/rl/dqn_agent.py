import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from rl.dqn_network import DQNNetwork
from rl.replay_buffer import ReplayBuffer

class DQNAgent:
    def __init__(
        self,
        state_dim,
        action_dim,
        lr=1e-3,
        gamma=0.99,
        double_dqn=False,
        device="cpu",
    ):
        self.device = device
        self.gamma = gamma
        self.double_dqn = double_dqn

        self.q_net = DQNNetwork(state_dim, action_dim).to(device)
        self.target_net = DQNNetwork(state_dim, action_dim).to(device)
        self.target_net.load_state_dict(self.q_net.state_dict())

        self.optimizer = optim.Adam(self.q_net.parameters(), lr=lr)
        self.loss_fn = nn.MSELoss()

        self.replay_buffer = ReplayBuffer()

        self.epsilon = 1.0
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.999

        self.action_dim = action_dim

    def select_action(self, state):
        if np.random.rand() < self.epsilon:
            return np.random.randint(self.action_dim)

        state = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        with torch.no_grad():
            q_values = self.q_net(state)
        return torch.argmax(q_values).item()

    def update(self, batch_size=64):
        if len(self.replay_buffer) < batch_size:
            return

        states, actions, rewards, next_states, dones = self.replay_buffer.sample(batch_size)

        states = torch.FloatTensor(states).to(self.device)
        actions = torch.LongTensor(actions).unsqueeze(1).to(self.device)
        rewards = torch.FloatTensor(rewards).unsqueeze(1).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).unsqueeze(1).to(self.device)

        current_q = self.q_net(states).gather(1, actions)

        if self.double_dqn:
            next_actions = torch.argmax(self.q_net(next_states), dim=1, keepdim=True)
            next_q = self.target_net(next_states).gather(1, next_actions)
        else:
            next_q = self.target_net(next_states).max(1, keepdim=True)[0]

        target_q = rewards + self.gamma * next_q * (1 - dones)

        loss = self.loss_fn(current_q, target_q.detach())

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def update_target(self):
        self.target_net.load_state_dict(self.q_net.state_dict())