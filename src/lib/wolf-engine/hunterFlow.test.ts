import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyHunterAfterWitch } from './hunterFlow';
import { WolfGameState } from './types';
import { createWolfGame } from './gameLogic';
import { WolfPlayer } from '@/types';

describe('hunter flow', () => {
  let mockState: WolfGameState;
  const basePlayers: WolfPlayer[] = [
    {
      id: 'player-1',
      name: '玩家1',
      playerNumber: 1,
      role: 'werewolf',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-2',
      name: '玩家2',
      playerNumber: 2,
      role: 'werewolf',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-3',
      name: '玩家3',
      playerNumber: 3,
      role: 'villager',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-4',
      name: '玩家4',
      playerNumber: 4,
      role: 'villager',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-5',
      name: '玩家5',
      playerNumber: 5,
      role: 'villager',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-6',
      name: '玩家6',
      playerNumber: 6,
      role: 'seer',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-7',
      name: '玩家7',
      playerNumber: 7,
      role: 'witch',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
    {
      id: 'player-8',
      name: '玩家8',
      playerNumber: 8,
      role: 'hunter',
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
  ];

  beforeEach(() => {
    mockState = createWolfGame(basePlayers);
  });

  it('runs hunter kill after witch when hunter died at night', () => {
    // 找到猎人
    const hunter = mockState.players.find(p => p.role === 'hunter');
    expect(hunter).toBeTruthy();

    // 模拟猎人夜间死亡
    const stateWithHunterDead = {
      ...mockState,
      players: mockState.players.map(p =>
        p.role === 'hunter' ? { ...p, isAlive: false } : p
      ),
      nightAction: {
        ...mockState.nightAction,
        killedId: hunter!.id, // 猎人被刀
      },
    };

    const next = applyHunterAfterWitch(stateWithHunterDead);
    expect(next.hunterKillTargetId).toBeTruthy();
  });

  it('does not run hunter kill when hunter is alive', () => {
    // 猎人存活
    const stateWithHunterAlive = {
      ...mockState,
      players: mockState.players.map(p =>
        p.role === 'hunter' ? { ...p, isAlive: true } : p
      ),
    };

    const next = applyHunterAfterWitch(stateWithHunterAlive);
    expect(next.hunterKillTargetId).toBeNull();
  });
});
