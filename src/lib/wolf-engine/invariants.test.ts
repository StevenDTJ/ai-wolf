import { describe, it, expect } from 'vitest';
import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';
import { validateInvariants } from './invariants';

function makePlayers(): WolfPlayer[] {
  const roles: WolfPlayer['role'][] = [
    'villager',
    'villager',
    'villager',
    'werewolf',
    'werewolf',
    'seer',
    'witch',
    'hunter',
  ];

  return roles.map((role, index) => ({
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

function makeState(): WolfGameState {
  return {
    id: 'game-1',
    players: makePlayers(),
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

describe('validateInvariants', () => {
  it('detects dead player cannot appear in alive list', () => {
    const state = makeState();
    const deadPlayer = { ...state.players[1], isAlive: false };
    const aliveShadow = { ...state.players[1], isAlive: true };
    state.players = [deadPlayer, aliveShadow, ...state.players.slice(2)];

    const errors = validateInvariants(state);
    expect(errors).toContain('dead_player_in_alive_list:p2');
  });

  it('detects werewolf kill target that is wolf', () => {
    const state = makeState();
    state.nightAction.killedId = 'p4';

    const errors = validateInvariants(state);
    expect(errors).toContain('werewolf_kill_target_invalid:p4');
  });

  it('detects werewolf kill target that is already dead', () => {
    const state = makeState();
    state.players = state.players.map(player =>
      player.id === 'p2' ? { ...player, isAlive: false } : player
    );
    state.nightAction.killedId = 'p2';

    const errors = validateInvariants(state);
    expect(errors).toContain('werewolf_kill_target_invalid:p2');
  });

  it('allows resolved killed target to be dead after night settlement', () => {
    const state = makeState();
    state.status = 'day';
    state.players = state.players.map(player =>
      player.id === 'p2' ? { ...player, isAlive: false } : player
    );
    state.nightAction.killedId = 'p2';

    const errors = validateInvariants(state);
    expect(errors).not.toContain('werewolf_kill_target_invalid:p2');
  });

  it('detects duplicate death in one resolution', () => {
    const state = makeState();
    state.nightAction.killedId = 'p2';
    state.nightAction.poisonedId = 'p2';

    const errors = validateInvariants(state);
    expect(errors).toContain('duplicate_death_same_resolution:p2');
  });
});
