import { describe, it, expect } from 'vitest';
import {
  buildDayContext,
  buildNightContext,
  createDefaultWolfPlayer,
  resolveWerewolfTargetId,
  ensureTransitionStateValid,
  buildHunterFinalSpeech,
} from './useWolfGame';
import { createWolfGame, startWolfGame } from '@/lib/wolf-engine';
import { WolfPlayer } from '@/types';

function createState() {
  const players = Array.from({ length: 8 }, (_, index) => ({
    ...createDefaultWolfPlayer(index + 1),
    apiKey: 'test-key',
  }));

  return startWolfGame(createWolfGame(players));
}

describe('useWolfGame helpers', () => {
  it('creates default player with number', () => {
    const player = createDefaultWolfPlayer(2);
    expect(player.playerNumber).toBe(2);
    expect(player.name).toBe('玩家2');
  });

  it('buildDayContext does not include seer checks', () => {
    const context = buildDayContext(createState(), 'villager', 'day_speech');
    expect(context).not.toHaveProperty('seerChecks');
  });

  it('buildNightContext excludes privileged fields by default', () => {
    const context = buildNightContext(createState(), 'villager', 'night_werewolf');

    expect(context).not.toHaveProperty('seerChecks');
    expect(context).not.toHaveProperty('lastProtectedId');
    expect(context).not.toHaveProperty('witchSaveUsed');
    expect(context).not.toHaveProperty('witchPoisonUsed');
  });

  it('buildDayContext keeps full seer check history for seer private info', () => {
    const state = createState();
    state.seerChecks = [
      { playerId: 'a', playerName: '玩家A', result: 'good' },
      { playerId: 'b', playerName: '玩家B', result: 'evil' },
    ];

    const context = buildDayContext(state, 'seer', 'day_speech');
    expect(context.privateInfo.seerChecks).toHaveLength(2);
  });

  it('resolveWerewolfTargetId ignores dead target in message', () => {
    const aliveVictims: WolfPlayer[] = [
      { ...createDefaultWolfPlayer(3), id: 'alive-3', isAlive: true },
      { ...createDefaultWolfPlayer(4), id: 'alive-4', isAlive: true },
    ];

    const target = resolveWerewolfTargetId('我建议刀2号', '', aliveVictims);
    expect(target).toBeNull();
  });

  it('resolveWerewolfTargetId ignores dead killVote and uses alive fallback from message', () => {
    const aliveVictims: WolfPlayer[] = [
      { ...createDefaultWolfPlayer(3), id: 'alive-3', isAlive: true },
      { ...createDefaultWolfPlayer(4), id: 'alive-4', isAlive: true },
    ];

    const target = resolveWerewolfTargetId('我建议刀3号', 'dead-2', aliveVictims);
    expect(target).toBe('alive-3');
  });

  it('transition to day/night does not produce invariant errors for valid state', () => {
    const state = createState();

    expect(() => ensureTransitionStateValid(state, 'to_day')).not.toThrow();
    expect(() => ensureTransitionStateValid(state, 'to_night')).not.toThrow();
  });

  it('buildHunterFinalSpeech keeps statement target consistent with executed hunter kill target', () => {
    const state = createState();
    const hunter = state.players[0];
    const target = state.players[4];

    hunter.role = 'hunter';
    state.hunterKillTargetId = target.id;

    const speech = buildHunterFinalSpeech(hunter, state);

    expect(speech).toContain(`${target.playerNumber}号`);
  });
});
