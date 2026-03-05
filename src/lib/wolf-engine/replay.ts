import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';
import {
  processWerewolfKill,
  processWitchDecision,
  processVotingResults,
  eliminatePlayer,
  getAlivePlayers,
} from './gameLogic';
import { validateInvariants } from './invariants';

export interface ReplayPlayer {
  id: string;
  name: string;
  role: WolfPlayer['role'];
  playerNumber: number;
  isAlive?: boolean;
}

export type ReplayAction =
  | { type: 'werewolf_kill'; targetId: string | null }
  | { type: 'witch_decision'; decision: 'save' | 'poison' | 'none'; targetId: string | null }
  | { type: 'day_vote'; votes: Array<{ voterId: string; targetId: string }> }
  | { type: 'hunter_shot'; targetId: string };

export interface ReplayFixture {
  name: string;
  players: ReplayPlayer[];
  actions: ReplayAction[];
  expectedTimeline: string[];
}

function buildInitialState(fixture: ReplayFixture): WolfGameState {
  return {
    id: `replay-${fixture.name}`,
    players: fixture.players.map(player => ({
      ...player,
      isAlive: player.isAlive ?? true,
      hasWill: true,
      wasProtected: false,
      systemPrompt: '',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
    })),
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

function assertReplayInvariants(state: WolfGameState, actionType: ReplayAction['type']): void {
  const errors = validateInvariants(state);
  if (errors.length > 0) {
    throw new Error(`replay_invariant_violation:${actionType}:${errors.join(',')}`);
  }
}

export function replayFixture(fixture: ReplayFixture): string[] {
  let state = buildInitialState(fixture);
  const timeline: string[] = [];

  for (const action of fixture.actions) {
    if (action.type === 'werewolf_kill') {
      state = processWerewolfKill(state, action.targetId);
      timeline.push(`werewolf_kill:${action.targetId ?? 'none'}`);
      assertReplayInvariants(state, action.type);
      continue;
    }

    if (action.type === 'witch_decision') {
      state = processWitchDecision(state, action.decision, action.targetId);
      timeline.push(`witch_decision:${action.decision}`);
      const deaths = [state.nightAction.killedId, state.nightAction.poisonedId].filter(
        (id): id is string => Boolean(id)
      );
      timeline.push(`night_deaths:${deaths.length > 0 ? deaths.join(',') : 'none'}`);
      assertReplayInvariants(state, action.type);
      continue;
    }

    if (action.type === 'day_vote') {
      const voteInputs = action.votes.map(vote => {
        const voter = state.players.find(player => player.id === vote.voterId);
        const target = state.players.find(player => player.id === vote.targetId);
        return {
          voterId: vote.voterId,
          voterName: voter?.name || vote.voterId,
          targetId: vote.targetId,
          targetName: target?.name || vote.targetId,
        };
      });

      const outcome = processVotingResults(state, voteInputs);
      if (outcome.eliminatedId) {
        state = eliminatePlayer(state, outcome.eliminatedId);
        timeline.push(`day_vote:eliminated:${outcome.eliminatedId}`);
      } else if (outcome.hasTie) {
        timeline.push(`day_vote:tie:${outcome.tiedIds.join(',')}`);
      } else {
        timeline.push('day_vote:none');
      }
      timeline.push(`alive_count:${getAlivePlayers(state).length}`);
      assertReplayInvariants(state, action.type);
      continue;
    }

    state = eliminatePlayer(state, action.targetId);
    timeline.push(`hunter_shot:${action.targetId}`);
    timeline.push(`alive_count:${getAlivePlayers(state).length}`);
    assertReplayInvariants(state, action.type);
  }

  return timeline;
}
