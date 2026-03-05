import { describe, it, expect } from 'vitest';
import { buildNightBroadcast, buildDayVoteBroadcast } from './broadcasts';
import { WolfGameState } from './types';
import { WolfPlayer, WolfMessage } from '@/types';

describe('broadcasts', () => {
  it('builds night broadcast with all deaths without cause', () => {
    const mockState: Partial<WolfGameState> = {
      players: basePlayers as any,
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: 'player-3',
        healedId: null,
        poisonedId: null,
      },
      currentRound: 1,
    };

    const msg = buildNightBroadcast(mockState as WolfGameState);
    expect(msg.content).toContain('昨夜死亡');
    expect(msg.content).not.toContain('被刀');
    expect(msg.content).not.toContain('被毒');
  });

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
      id: 'player-3',
      name: '玩家3',
      playerNumber: 3,
      role: 'hunter',
      isAlive: false,
      hasWill: true,
      wasProtected: false,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      systemPrompt: '',
    },
  ];

  
  it('includes night hunter kill in death list', () => {
    const mockState: Partial<WolfGameState> = {
      players: basePlayers as any,
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
      hunterKillTargetId: 'player-2',
      hunterKillPhase: 'night',
      hunterKillRound: 1,
      currentRound: 1,
    };

    const msg = buildNightBroadcast(mockState as WolfGameState);
    expect(msg.content).toContain('玩家2');
  });


  it('builds day vote broadcast with hunter kill info', () => {
    const mockState: Partial<WolfGameState> = {
      players: basePlayers as any,
      hunterKillTargetId: 'player-2',
      hunterKillPhase: 'day',
      hunterKillRound: 1,
      currentRound: 1,
    };

    const msg = buildDayVoteBroadcast(mockState as WolfGameState, '玩家3被投票出局');
    // 猎人击杀应明确标注
    expect(msg.content).toContain('猎人带走');
  });
});


