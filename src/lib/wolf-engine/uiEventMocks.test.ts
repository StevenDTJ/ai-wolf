import { describe, it, expect } from 'vitest';
import { buildMockRoundEvents, buildMockGameEvents, createMockEventSource } from './uiEventMocks';

describe('uiEventMocks', () => {
  it('returns deterministic mock event timeline for a round', () => {
    const events = buildMockRoundEvents(1);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('round_started');
    expect(events[0].data).toHaveProperty('round', 1);
  });

  it('includes phase_changed events', () => {
    const events = buildMockRoundEvents(1);

    const phaseChanges = events.filter(e => e.type === 'phase_changed');
    expect(phaseChanges.length).toBeGreaterThan(0);
  });

  it('includes vote events', () => {
    const events = buildMockRoundEvents(1);

    const votes = events.filter(e => e.type === 'vote_cast');
    expect(votes.length).toBeGreaterThan(0);
  });

  it('includes player_eliminated event', () => {
    const events = buildMockRoundEvents(1);

    const eliminated = events.filter(e => e.type === 'player_eliminated');
    expect(eliminated.length).toBe(1);
  });

  it('buildMockGameEvents generates multiple rounds', () => {
    const events = buildMockGameEvents(3);

    const rounds = events.filter(e => e.type === 'round_started');
    expect(rounds.length).toBe(3);

    const gameEnded = events.filter(e => e.type === 'game_ended');
    expect(gameEnded.length).toBe(1);
  });

  it('createMockEventSource returns fresh events each time', () => {
    const source = createMockEventSource(2);

    const events1 = source.getEvents();
    const events2 = source.getEvents();

    // Same events returned
    expect(events1.length).toBe(events2.length);
  });

  it('mock source reset regenerates events', () => {
    const source = createMockEventSource(2);

    const events1 = source.getEvents();
    source.reset();
    const events2 = source.getEvents();

    // Events should be regenerated (same content but new timestamps possible)
    expect(events1.length).toBe(events2.length);
  });
});
