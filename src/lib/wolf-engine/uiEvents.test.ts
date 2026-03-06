import { describe, it, expect } from 'vitest';
import { createUiEvent, type UiEventV1, type UiEventType } from './uiEvents';

describe('uiEvents', () => {
  it('exposes UiEventV1 with required fields', () => {
    const event = createUiEvent('phase_changed', {
      gameId: 'g1',
      round: 1,
      publicText: '进入白天',
    });
    expect(event.id).toBeTruthy();
    expect(event.type).toBe('phase_changed');
    expect(event.timestamp).toBeDefined();
    expect(event.data.gameId).toBe('g1');
    expect(event.data.round).toBe(1);
    expect(event.data.publicText).toBe('进入白天');
  });

  it('supports all event types', () => {
    const eventTypes: UiEventType[] = [
      'round_started',
      'phase_changed',
      'player_eliminated',
      'vote_cast',
      'vote_result',
      'night_action',
      'message_added',
      'game_ended',
    ];

    eventTypes.forEach((type) => {
      const event = createUiEvent(type, { gameId: 'test', round: 1 });
      expect(event.type).toBe(type);
    });
  });

  it('generates unique ids', () => {
    const event1 = createUiEvent('phase_changed', { gameId: 'g1', round: 1 });
    const event2 = createUiEvent('phase_changed', { gameId: 'g1', round: 1 });
    expect(event1.id).not.toBe(event2.id);
  });
});
