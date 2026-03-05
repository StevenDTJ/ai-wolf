import { describe, it, expect } from 'vitest';
import { processSeerCheck, processWerewolfKill, processWitchDecision } from './gameLogic';
import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';

const makePlayers = (): WolfPlayer[] => {
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
};

const makeState = (killedId: string | null): WolfGameState => ({
  id: 'game-1',
  players: makePlayers(),
  currentRound: 1,
  status: 'night_witch',
  nightAction: {
    protectedId: null,
    checkedId: null,
    checkResult: null,
    killedId,
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
});

describe('processSeerCheck, processWerewolfKill, processWitchDecision', () => {
  it('uses save potion to prevent the kill', () => {
    const state = makeState('p2');
    const next = processWitchDecision(state, 'save', null);

    expect(next.witchSaveUsed).toBe(true);
    expect(next.nightAction.healedId).toBe('p2');
    expect(next.nightAction.killedId).toBeNull();
    expect(next.players.find(p => p.id === 'p2')?.isAlive).toBe(true);
  });

  it('cannot save if potion already used', () => {
    const state = { ...makeState('p2'), witchSaveUsed: true };
    const next = processWitchDecision(state, 'save', null);

    expect(next.witchDecision).toBe('none');
    expect(next.nightAction.killedId).toBe('p2');
    expect(next.players.find(p => p.id === 'p2')?.isAlive).toBe(false);
  });

  it('uses poison potion to kill target', () => {
    const state = makeState('p2');
    const next = processWitchDecision(state, 'poison', 'p3');

    expect(next.witchPoisonUsed).toBe(true);
    expect(next.nightAction.poisonedId).toBe('p3');
    expect(next.players.find(p => p.id === 'p3')?.isAlive).toBe(false);
    expect(next.players.find(p => p.id === 'p2')?.isAlive).toBe(false);
  });

  it('does nothing when decision is none', () => {
    const state = makeState('p2');
    const next = processWitchDecision(state, 'none', null);

    expect(next.nightAction.killedId).toBe('p2');
    expect(next.nightAction.healedId).toBeNull();
    expect(next.nightAction.poisonedId).toBeNull();
  });
});
describe('processSeerCheck', () => {
  it('records seer check result for the checked player', () => {
    const state = makeState('p2');
    const next = processSeerCheck(state, 'p4', true);

    expect(next.nightAction.checkedId).toBe('p4');
    expect(next.nightAction.checkResult).toBe('evil');
    expect(next.seerChecks).toEqual([
      { playerId: 'p4', playerName: '玩家4', result: 'evil' },
    ]);
  });
});
describe('processWerewolfKill', () => {
  it('stores the intended kill target without killing immediately', () => {
    const state = makeState(null);
    const next = processWerewolfKill(state, 'p5');

    expect(next.nightAction.killedId).toBe('p5');
    expect(next.players.find(p => p.id === 'p5')?.isAlive).toBe(true);
  });
});