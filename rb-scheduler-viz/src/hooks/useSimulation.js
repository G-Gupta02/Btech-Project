/**
 * useSimulation.js
 * ----------------
 * Custom React hook that runs the scheduling simulation frame-by-frame.
 * Exposes play / pause / reset controls and the current allocation state.
 *
 * Separating simulation logic from UI keeps components lightweight and
 * makes it easy to plug in real model outputs later.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
// mockData is imported by components; hook keeps only simulation logic

const N_USERS = 10;
const N_RBS   = 12; // Resource blocks shown in the grid

/**
 * Generates a single time-step allocation for any algorithm.
 * Returns an array of { rbIndex, user, rate } objects.
 */
const allocateStep = (algorithm, step, channelState, avgRates) => {
  const allocation = [];

  for (let rb = 0; rb < N_RBS; rb++) {
    // Each RB has its own fading; use deterministic pseudo-random
    const seed  = step * N_RBS + rb;
    const cq    = Array.from({ length: N_USERS }, (_, u) =>
      Math.max(0.05, 1.0 - u * 0.07 + Math.sin(seed * 0.3 + u * 1.1) * 0.35)
    );

    let chosen;

    switch (algorithm) {
      case 'roundRobin':
        chosen = (step * N_RBS + rb) % N_USERS;
        break;

      case 'maxSNR':
        chosen = cq.indexOf(Math.max(...cq));
        break;

      case 'proportionalFair': {
        const scores = cq.map((c, u) => c / (avgRates[u] + 1e-6));
        chosen = scores.indexOf(Math.max(...scores));
        break;
      }

      case 'duelingDQN': {
        // Emulates the trained policy: weighted PF + learned fairness bonus
        const deficit  = channelState.perUser.map((p, u) =>
          (cq[u] * 1.15) / (p + 0.5)
        );
        chosen = deficit.indexOf(Math.max(...deficit));
        break;
      }

      default:
        chosen = rb % N_USERS;
    }

    allocation.push({ rbIndex: rb, user: chosen, rate: +cq[chosen].toFixed(3) });
  }

  return allocation;
};

/**
 * Main simulation hook.
 * @param {string} algorithm  – one of the ALGORITHMS keys
 * @param {number} speed      – 1-5 (1=slowest, 5=fastest)
 */
export const useSimulation = (algorithm, speed = 2) => {
  const [step,        setStep]        = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [allocation,  setAllocation]  = useState([]);
  const [history,     setHistory]     = useState([]); // array of past allocations
  const [perUser,     setPerUser]     = useState(Array(N_USERS).fill(0));
  const [avgRates,    setAvgRates]    = useState(Array(N_USERS).fill(1e-6));

  const intervalRef = useRef(null);

  // Speed map: ms per frame
  const SPEED_MAP = { 1: 1200, 2: 700, 3: 400, 4: 200, 5: 80 };
  const delay = SPEED_MAP[speed] || 700;

  /** Run one simulation step */
  const runStep = useCallback(() => {
    setStep(prev => {
      const s = prev;
      setPerUser(pu => {
        setAvgRates(ar => {
          const newAr = [...ar];
          const cState = { perUser: pu };
          const alloc  = allocateStep(algorithm, s, cState, ar);

          // Update averages (exponential moving avg)
          alloc.forEach(({ user, rate }) => {
            newAr[user] = 0.9 * newAr[user] + 0.1 * rate;
          });

          setAllocation(alloc);
          setHistory(h => [...h.slice(-39), { step: s, alloc }]);

          // Update per-user accumulated rates
          const newPu = [...pu];
          alloc.forEach(({ user, rate }) => { newPu[user] += rate; });
          setPerUser(newPu);

          return newAr;
        });
        return pu; // placeholder — real update happens inside
      });

      return s + 1;
    });
  }, [algorithm]);

  /** Start the interval */
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(runStep, delay);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, delay, runStep]);

  /** Reset when algorithm changes */
  useEffect(() => {
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  const handlePlay  = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    setAllocation([]);
    setHistory([]);
    setPerUser(Array(N_USERS).fill(0));
    setAvgRates(Array(N_USERS).fill(1e-6));
  };

  return {
    step,
    isPlaying,
    allocation,
    history,
    perUser,
    handlePlay,
    handlePause,
    handleReset,
    nUsers: N_USERS,
    nRBs:   N_RBS,
  };
};
