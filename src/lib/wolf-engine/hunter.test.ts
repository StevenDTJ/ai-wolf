import { describe, it, expect } from 'vitest';
import { getHunterKillPrompt, parseHunterKillTarget } from './hunter';
import { WolfPlayer } from '@/types';

describe('getHunterKillPrompt', () => {
  it('generates prompt for hunter to choose kill target', () => {
    const hunter: WolfPlayer = {
      id: 'p8',
      name: '玩家8',
      role: 'hunter',
      isAlive: false,
      hasWill: true,
      wasProtected: false,
      playerNumber: 8,
      systemPrompt: '',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
    };

    const alivePlayers: WolfPlayer[] = [
      { id: 'p1', name: '玩家1', role: 'villager', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 1, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
      { id: 'p2', name: '玩家2', role: 'werewolf', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 2, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
      { id: 'p3', name: '玩家3', role: 'seer', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 3, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
    ];

    const prompt = getHunterKillPrompt(hunter, alivePlayers);

    expect(prompt).toContain('猎人');
    expect(prompt).toContain('玩家8');
    expect(prompt).toContain('玩家1');
    expect(prompt).toContain('玩家2');
    expect(prompt).toContain('选择');
  });
});

describe('parseHunterKillTarget', () => {
  it('extracts player number from AI response', () => {
    const alivePlayers: WolfPlayer[] = [
      { id: 'p1', name: '玩家1', role: 'villager', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 1, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
      { id: 'p2', name: '玩家2', role: 'werewolf', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 2, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
    ];

    const targetId = parseHunterKillTarget('我觉得应该带走2号玩家', alivePlayers);
    expect(targetId).toBe('p2');
  });

  it('returns null when no valid target', () => {
    const alivePlayers: WolfPlayer[] = [
      { id: 'p1', name: '玩家1', role: 'villager', isAlive: true, hasWill: true, wasProtected: false, playerNumber: 1, systemPrompt: '', model: '', baseUrl: '', apiKey: '' },
    ];

    const targetId = parseHunterKillTarget('我不知道', alivePlayers);
    expect(targetId).toBeNull();
  });
});
