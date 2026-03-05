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

  it('orders publicInfo.speeches by round then timestamp', () => {
    // Add speeches with different rounds and timestamps
    mockState.messages = [
      { id: '1', playerId: 'a', playerName: 'A', content: 'round2-late', type: 'speech', round: 2, timestamp: 30 },
      { id: '2', playerId: 'a', playerName: 'A', content: 'round1', type: 'speech', round: 1, timestamp: 10 },
      { id: '3', playerId: 'a', playerName: 'A', content: 'round2-early', type: 'speech', round: 2, timestamp: 10 },
    ];

    const ctx = buildContext('villager', mockState, 'day_speech');
    const speeches = ctx.publicInfo.speeches;

    expect(speeches[0].content).toBe('round1');
    expect(speeches[1].content).toBe('round2-early');
    expect(speeches[2].content).toBe('round2-late');
  });
});
