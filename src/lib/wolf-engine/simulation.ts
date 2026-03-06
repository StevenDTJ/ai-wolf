import { WolfPlayer } from '@/types';
import { WolfGameState } from './types';
import {
  processWerewolfKill,
  processWitchDecision,
  processVotingResults,
  eliminatePlayer,
  checkWinCondition,
  getAlivePlayers,
  startNextRound,
} from './gameLogic';
import { processHunterKill } from './hunter';
import { validateInvariants } from './invariants';

export interface SimulationFailure {
  seed: number;
  reason: string;
}

export interface SimulationResult {
  failures: SimulationFailure[];
  terminatedGames: number;
}

export interface DeterministicStrategyInput {
  wolfAggressiveness?: number;
  goodAggressiveness?: number;
}

function createRng(seed: number): () => number {
  let state = (seed >>> 0) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickOne<T>(items: T[], rng: () => number): T | null {
  if (items.length === 0) {
    return null;
  }
  const index = Math.floor(rng() * items.length);
  return items[index];
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function createPlayers(seed: number): WolfPlayer[] {
  const roles: WolfPlayer['role'][] = ['werewolf', 'werewolf', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter'];
  const rng = createRng(seed * 9973 + 17);
  const shuffled = [...roles];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.map((role, index) => ({
    id: `p${index + 1}`,
    name: `玩家${index + 1}`,
    role,
    isAlive: true,
    hasWill: true,
    wasProtected: false,
    playerNumber: index + 1,
    systemPrompt: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
  }));
}

function createInitialState(seed: number): WolfGameState {
  return {
    id: `sim-${seed}`,
    players: createPlayers(seed),
    currentRound: 1,
    status: 'night_werewolf',
    nightAction: {
      protectedId: null,
      checkedId: null,
      checkResult: null,
      killedId: null,
      healedId: null,
      poisonedId: null,
    },
    messages: [],
    votes: [],
    votingResults: {},
    wolfChatMessages: [],
    currentWolfChatPlayerIndex: 0,
    lastProtectedId: null,
    seerChecks: [],
    witchSaveUsed: false,
    witchPoisonUsed: false,
    witchDecision: 'none',
    witchTargetId: null,
    hunterKillTargetId: null,
    hunterKillPhase: null,
    hunterKillRound: null,
    wolfKillHistory: [],
  };
}

function assertInvariant(state: WolfGameState, seed: number, phase: string): SimulationFailure | null {
  const errors = validateInvariants(state);
  if (errors.length === 0) {
    return null;
  }
  return {
    seed,
    reason: `${phase}:${errors.join(',')}`,
  };
}

export function runSingleDeterministicGame(
  seed: number,
  strategy: DeterministicStrategyInput = {}
): { terminated: boolean; failure: SimulationFailure | null; winner: 'good' | 'evil' | null } {
  const wolfAgg = clamp01(strategy.wolfAggressiveness ?? 0.5);
  const goodAgg = clamp01(strategy.goodAggressiveness ?? 0.5);
  const rng = createRng(seed);
  let state = createInitialState(seed);

  for (let step = 0; step < 100; step++) {
    const alivePlayers = getAlivePlayers(state);
    const aliveWolves = alivePlayers.filter(player => player.role === 'werewolf');
    const aliveGood = alivePlayers.filter(player => player.role !== 'werewolf');

    if (aliveWolves.length === 0 || aliveGood.length === 0) {
      const winner = checkWinCondition(state);
      return { terminated: true, failure: null, winner };
    }

    let wolfTarget = pickOne(aliveGood, rng);
    if (wolfAgg >= 0.65) {
      const highValueTargets = aliveGood.filter(player =>
        player.role === 'seer' || player.role === 'witch' || player.role === 'hunter'
      );
      wolfTarget = pickOne(highValueTargets, rng) ?? wolfTarget;
    }
    state = {
      ...state,
      status: 'werewolf_chat',
    };
    state = processWerewolfKill(state, wolfTarget?.id ?? null);
    const afterKillFailure = assertInvariant(state, seed, 'after_werewolf_kill');
    if (afterKillFailure) {
      return { terminated: false, failure: afterKillFailure, winner: null };
    }

    const witch = getAlivePlayers(state).find(player => player.role === 'witch');
    state = {
      ...state,
      status: 'night_witch',
    };
    if (witch) {
      let decision: 'save' | 'poison' | 'none' = 'none';
      let targetId: string | null = null;

      if (!state.witchSaveUsed && state.nightAction.killedId && rng() < 0.2 + goodAgg * 0.45) {
        decision = 'save';
      } else if (!state.witchPoisonUsed && rng() < 0.05 + goodAgg * 0.3) {
        const poisonTargets = getAlivePlayers(state).filter(
          player => player.id !== witch.id && player.id !== state.nightAction.killedId
        );
        const poisonTarget = pickOne(poisonTargets, rng);
        if (poisonTarget) {
          decision = 'poison';
          targetId = poisonTarget.id;
        }
      }

      state = processWitchDecision(state, decision, targetId);
    } else if (state.nightAction.killedId) {
      state = eliminatePlayer(state, state.nightAction.killedId);
    }

    state = {
      ...state,
      status: 'day',
    };
    const afterWitchFailure = assertInvariant(state, seed, 'after_witch');
    if (afterWitchFailure) {
      return { terminated: false, failure: afterWitchFailure, winner: null };
    }

    const winnerAfterNight = checkWinCondition(state);
    if (winnerAfterNight) {
      return { terminated: true, failure: null, winner: winnerAfterNight };
    }

    const daytimeAlive = getAlivePlayers(state);
    const voteInputs = daytimeAlive.map(voter => {
      const candidates = daytimeAlive.filter(player => player.id !== voter.id);
      const wolfCandidates = candidates.filter(player => player.role === 'werewolf');
      const goodCandidates = candidates.filter(player => player.role !== 'werewolf');

      let target = pickOne(candidates, rng);
      if (voter.role !== 'werewolf' && goodAgg >= 0.65 && wolfCandidates.length > 0 && rng() < 0.75) {
        target = pickOne(wolfCandidates, rng);
      }
      if (voter.role === 'werewolf' && wolfAgg >= 0.65 && goodCandidates.length > 0 && rng() < 0.75) {
        target = pickOne(goodCandidates, rng);
      }

      return {
        voterId: voter.id,
        voterName: voter.name,
        targetId: target?.id ?? '',
        targetName: target?.name ?? '弃票',
      };
    });

    const voteOutcome = processVotingResults(state, voteInputs);
    if (voteOutcome.eliminatedId) {
      state = eliminatePlayer(state, voteOutcome.eliminatedId);
      const eliminated = state.players.find(player => player.id === voteOutcome.eliminatedId);
      if (eliminated?.role === 'hunter' && eliminated.isAlive === false) {
        const hunterTargets = getAlivePlayers(state);
        const hunterTarget = pickOne(hunterTargets, rng);
        if (hunterTarget) {
          state = processHunterKill(state, hunterTarget.id);
        }
      }
    }

    const afterVoteFailure = assertInvariant(state, seed, 'after_vote');
    if (afterVoteFailure) {
      return { terminated: false, failure: afterVoteFailure, winner: null };
    }

    const winner = checkWinCondition(state);
    if (winner) {
      return { terminated: true, failure: null, winner };
    }

    state = startNextRound({
      ...state,
      status: 'day',
      players: state.players.map(player => ({ ...player, wasProtected: false })),
    });

    const afterRoundFailure = assertInvariant(state, seed, 'after_start_next_round');
    if (afterRoundFailure) {
      return { terminated: false, failure: afterRoundFailure, winner: null };
    }
  }

  return {
    terminated: false,
    failure: {
      seed,
      reason: 'max_steps_exceeded',
    },
    winner: null,
  };
}

export function runSimulation(options: { games: number; seedStart?: number }): SimulationResult {
  const failures: SimulationFailure[] = [];
  let terminatedGames = 0;
  const seedStart = options.seedStart ?? 0;

  for (let index = 0; index < options.games; index++) {
    const seed = seedStart + index;
    const { terminated, failure } = runSingleDeterministicGame(seed);
    if (failure) {
      failures.push(failure);
      continue;
    }
    if (terminated) {
      terminatedGames += 1;
    }
  }

  return {
    failures,
    terminatedGames,
  };
}

