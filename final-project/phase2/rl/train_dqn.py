import torch
import matplotlib.pyplot as plt
import os
import sys
import numpy as np

# Add the parent directory (phase3) to sys.path to allow imports from env and rl
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from env.wireless_env import WirelessEnv
from rl.dqn_agent import DQNAgent


def train(double_dqn=True):

    # ----------------------------
    # Environment setup
    # ----------------------------
    env = WirelessEnv()
    state_dim = env.n_users * 2
    action_dim = env.n_users

    # ----------------------------
    # Agent setup
    # ----------------------------
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    agent = DQNAgent(
        state_dim=state_dim,
        action_dim=action_dim,
        double_dqn=double_dqn,
        device=device,
    )

    episodes = 1000
    rewards_log = []

    # ----------------------------
    # Training loop
    # ----------------------------
    for episode in range(episodes):
        state = env.reset()
        total_reward = 0
        done = False

        while not done:
            action = agent.select_action(state)
            next_state, reward, done, info = env.step(action)  # Fixed: 4 return values

            agent.replay_buffer.push(state, action, reward, next_state, done)
            
            # Speed up: Update only every 10 steps
            if env.t % 10 == 0 or done:
                agent.update()

            state = next_state
            total_reward += reward
            
        if (episode + 1) % 10 == 0:
            print(f"Finished episode {episode+1}")

        # Update target network every 10 episodes
        if episode % 10 == 0:
            agent.update_target()

        rewards_log.append(total_reward)

        if (episode + 1) % 100 == 0:
            print(f"Episode {episode+1}/{episodes}, Avg Reward (last 100): {np.mean(rewards_log[-100:]):.2f}")

    # ----------------------------
    # Save trained model (next to train_dqn.py in phase3/rl/)
    # ----------------------------
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_name = "double_dqn_model.pth" if double_dqn else "dqn_model.pth"
    model_path = os.path.join(script_dir, model_name)
    torch.save(agent.q_net.state_dict(), model_path)
    print(f"\nModel saved as {model_path}")

    # ----------------------------
    # Save training curve
    # ----------------------------
    plots_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plots")
    os.makedirs(plots_dir, exist_ok=True)
    label = "Double Dueling DQN" if double_dqn else "Dueling DQN"
    plt.figure()
    plt.plot(rewards_log)
    plt.title(f"Phase 3 — {label} Training Reward (PF Reward)")
    plt.xlabel("Episode")
    plt.ylabel("Total PF Reward")
    plt.grid()
    plot_path = os.path.join(plots_dir, "training_curve.png")
    plt.savefig(plot_path)
    plt.close()
    print(f"Training curve saved to {plot_path}")

    return agent, rewards_log


if __name__ == "__main__":
    # Change to True to train Double DQN
    train(double_dqn=True)