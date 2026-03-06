import { describe, it, expect } from 'vitest';
import { deriveUiEvents, type WolfGameState } from './uiEventAdapter';
import { WolfRole } from '@/types';

function createMockPlayer(id: string, name: string, role: WolfRole) {
  return {
    id,
    name,
    playerNumber: parseInt(id.replace('p', '')),
    role,
    isAlive: true,
    hasWill: true,
    wasProtected: false,
    model: 'test',
    baseUrl: 'test',
    apiKey: 'test',
    systemPrompt: 'test',
  };
}

function createMockState(overrides: Partial<WolfGameState> = {}): WolfGameState {
  return {
    id: 'game-1',
    players: [
      createMockPlayer('p1', '玩家1', 'villager'),
      createMockPlayer('p2', '玩家2', 'werewolf'),
      createMockPlayer('p3', '玩家3', 'seer'),
      createMockPlayer('p4', '玩家4', 'witch'),
      createMockPlayer('p5', '玩家5', 'hunter'),
      createMockPlayer('p6', '玩家6', 'villager'),
      createMockPlayer('p7', '玩家7', 'werewolf'),
      createMockPlayer('p8', '玩家8', 'villager'),
    ],
    currentRound: 1,
    status: 'waiting',
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
    ...overrides,
  };
}

describe('uiEventAdapter', () => {
  it('maps status transitions to phase_changed events', () => {
    const prevState = createMockState({ status: 'night' });
    const nextState = createMockState({ status: 'day' });

    const events = deriveUiEvents(prevState, nextState);

    expect(events.some(e => e.type === 'phase_changed')).toBe(true);
    const phaseEvent = events.find(e => e.type === 'phase_changed');
    expect(phaseEvent?.data.previousStatus).toBe('night');
    expect(phaseEvent?.data.currentStatus).toBe('day');
  });

  it('emits player_eliminated when player is eliminated', () => {
    const prevState = createMockState({
      players: [
        createMockPlayer('p1', '玩家1', 'villager'),
        createMockPlayer('p2', '玩家2', 'werewolf'),
        createMockPlayer('p3', '玩家3', 'seer'),
        createMockPlayer('p4', '玩家4', 'witch'),
        createMockPlayer('p5', '玩家5', 'hunter'),
        createMockPlayer('p6', '玩家6', 'villager'),
        createMockPlayer('p7', '玩家7', 'werewolf'),
        createMockPlayer('p8', '玩家8', 'villager'),
      ],
      status: 'voting',
    });
    const nextState = createMockState({
      players: [
        { ...createMockPlayer('p1', '玩家1', 'villager'), isAlive: false },
        createMockPlayer('p2', '玩家2', 'werewolf'),
        createMockPlayer('p3', '玩家3', 'seer'),
        createMockPlayer('p4', '玩家4', 'witch'),
        createMockPlayer('p5', '玩家5', 'hunter'),
        createMockPlayer('p6', '玩家6', 'villager'),
        createMockPlayer('p7', '玩家7', 'werewolf'),
        createMockPlayer('p8', '玩家8', 'villager'),
      ],
      status: 'day',
      eliminatedPlayerId: 'p1',
    });

    const events = deriveUiEvents(prevState, nextState);

    expect(events.some(e => e.type === 'player_eliminated')).toBe(true);
    const elimEvent = events.find(e => e.type === 'player_eliminated');
    expect(elimEvent?.data.playerId).toBe('p1');
    expect(elimEvent?.data.playerName).toBe('玩家1');
  });

  it('emits round_started when round increments', () => {
    const prevState = createMockState({ currentRound: 1, status: 'day' });
    const nextState = createMockState({ currentRound: 2, status: 'night' });

    const events = deriveUiEvents(prevState, nextState);

    expect(events.some(e => e.type === 'round_started')).toBe(true);
    const roundEvent = events.find(e => e.type === 'round_started');
    expect(roundEvent?.data.round).toBe(2);
  });

  it('returns empty array when no state changes', () => {
    const state = createMockState();
    const events = deriveUiEvents(state, state);

    expect(events).toHaveLength(0);
  });

  it('uses generic public text for seer check event', () => {
    const prevState = createMockState({ status: 'night_seer' });
    const nextState = createMockState({
      status: 'night_werewolf',
      nightAction: {
        protectedId: null,
        checkedId: 'p2',
        checkResult: 'evil',
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
    });

    const events = deriveUiEvents(prevState, nextState);
    const seerEvent = events.find(
      e => e.type === 'night_action' && e.data.actionType === 'seer_check'
    );

    expect(seerEvent).toBeDefined();
    expect(seerEvent?.data.publicText).toBe('夜晚行动已结算');
    expect(String(seerEvent?.data.directorText)).toContain('预言家查验');
  });

  it('does not leak wolf-action wording in public kill text', () => {
    const prevState = createMockState({ status: 'night_werewolf' });
    const nextState = createMockState({
      status: 'day',
      players: [
        { ...createMockPlayer('p1', '玩家1', 'villager'), isAlive: false },
        createMockPlayer('p2', '玩家2', 'werewolf'),
        createMockPlayer('p3', '玩家3', 'seer'),
        createMockPlayer('p4', '玩家4', 'witch'),
        createMockPlayer('p5', '玩家5', 'hunter'),
        createMockPlayer('p6', '玩家6', 'villager'),
        createMockPlayer('p7', '玩家7', 'werewolf'),
        createMockPlayer('p8', '玩家8', 'villager'),
      ],
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: 'p1',
        healedId: null,
        poisonedId: null,
      },
    });

    const events = deriveUiEvents(prevState, nextState);
    const publicTexts = events
      .map(event => event.data.publicText)
      .filter((text): text is string => typeof text === 'string');

    expect(publicTexts.some(text => text.includes('昨夜死亡：玩家1'))).toBe(true);
    expect(publicTexts.some(text => text.includes('狼人击杀'))).toBe(false);
  });

  it('emits game_ended when winner is determined', () => {
    const prevState = createMockState({ status: 'voting' });
    const nextState = createMockState({
      status: 'ended',
      winner: 'good',
      currentRound: 5,
    });

    const events = deriveUiEvents(prevState, nextState);

    expect(events.some(e => e.type === 'game_ended')).toBe(true);
    const gameEndEvent = events.find(e => e.type === 'game_ended');
    expect(gameEndEvent?.data.winner).toBe('good');
  });
});
