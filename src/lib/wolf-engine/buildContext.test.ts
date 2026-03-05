import { describe, it, expect, beforeEach } from 'vitest';
import { buildContext } from './context';
import { WolfGameState, WolfPlayer } from '@/types';
import { createWolfGame } from './gameLogic';

describe('buildContext', () => {
  let mockState: WolfGameState;
  const mockPlayers: WolfPlayer[] = [
    {
      id: 'wolf-1',
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
      id: 'seer-1',
      name: '玩家2',
      playerNumber: 2,
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
      id: 'villager-1',
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
  ];

  beforeEach(() => {
    mockState = createWolfGame(mockPlayers);
    mockState.currentRound = 2;
    mockState.seerChecks = [
      { playerId: 'wolf-1', playerName: '玩家1', result: 'evil' },
    ];
  });

  it('includes publicInfo for seer', () => {
    const ctx = buildContext('seer', mockState, 'night_seer');
    expect(ctx.publicInfo).toBeTruthy();
  });

  it('includes privateInfo.seerChecks for seer', () => {
    const ctx = buildContext('seer', mockState, 'night_seer');
    expect(ctx.privateInfo).toBeTruthy();
    expect(ctx.privateInfo.seerChecks).toBeTruthy();
    expect(ctx.privateInfo.seerChecks?.length).toBe(1);
  });

  
  it('builds public timeline ordered across speeches, votes, broadcasts', () => {
    mockState.messages = [
      { id: 'b1', playerId: 'system', playerName: '系统', content: '播报', type: 'speech', round: 1, timestamp: 30 },
      { id: 's1', playerId: 'p1', playerName: 'A', content: '发言', type: 'speech', round: 1, timestamp: 10 },
    ];
    mockState.votes = [
      { voterId: 'p2', voterName: 'B', targetId: 'p1', targetName: 'A', round: 1, timestamp: 20 },
    ];

    const ctx = buildContext('villager', mockState, 'day_speech');
    expect(ctx.publicInfo.timeline.map(e => e.timestamp)).toEqual([10, 20, 30]);
  });

});

