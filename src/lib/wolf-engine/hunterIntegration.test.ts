import { describe, it, expect } from 'vitest';
import { handleHunterElimination } from './hunterIntegration';
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
    isAlive: index < 7, // p8 (hunter) is dead
    hasWill: true,
    wasProtected: false,
    playerNumber: index + 1,
    systemPrompt: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
  }));
};

const makeState = (eliminatedId?: string): WolfGameState => ({
  id: 'game-1',
  players: makePlayers(),
  currentRound: 1,
  status: 'day',
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
  eliminatedPlayerId: eliminatedId,
  hunterKillTargetId: null,
  hunterKillPhase: null,
  hunterKillRound: null,
  wolfKillHistory: [],
});

// Mock AI 函数
const mockAICall = async () => '选择：3';

describe('handleHunterElimination', () => {
  it('returns original state when no player eliminated', async () => {
    const state = makeState(undefined);

    const result = await handleHunterElimination(state, mockAICall);

    expect(result).toBe(state);
  });

  it('returns original state when eliminated player is not hunter', async () => {
    const state = makeState('p1'); // villager

    const result = await handleHunterElimination(state, mockAICall);

    expect(result).toBe(state);
    expect(result.hunterKillTargetId).toBeNull();
  });

  it('records hunter kill phase when hunter shoots', async () => {
    const state = makeState('p8');

    const result = await handleHunterElimination(state, mockAICall);

    expect(result.hunterKillPhase).toBe('day');
    expect(result.hunterKillRound).toBe(1);
  });

  it('uses parsed hunter target as the executed kill target', async () => {
    const state = makeState('p8');
    const aiCall = async () => '遗言：我会带走3号，选择：3';

    const result = await handleHunterElimination(state, aiCall);
    const target = result.players.find(player => player.id === 'p3');

    expect(result.hunterKillTargetId).toBe('p3');
    expect(target?.isAlive).toBe(false);
  });
});
