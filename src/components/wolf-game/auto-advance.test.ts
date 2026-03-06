import { describe, expect, it } from 'vitest';
import { createWolfGame } from '@/lib/wolf-engine';
import { createDefaultWolfPlayer } from '@/hooks/useWolfGame';
import { shouldAutoAdvanceWolfGame } from './auto-advance';

function createSession() {
  const players = Array.from({ length: 8 }, (_, index) => ({
    ...createDefaultWolfPlayer(index + 1),
    apiKey: 'test-key',
  }));

  return createWolfGame(players);
}

describe('shouldAutoAdvanceWolfGame', () => {
  it('auto-advances after init when session is waiting', () => {
    const session = createSession();
    expect(session.status).toBe('waiting');
    expect(shouldAutoAdvanceWolfGame(session, false, null)).toBe(true);
  });

  it('does not auto-advance when transition is pending', () => {
    const session = createSession();
    expect(shouldAutoAdvanceWolfGame(session, false, 'to_day')).toBe(false);
  });

  it('does not auto-advance for ended game', () => {
    const session = createSession();
    const ended = { ...session, status: 'ended' as const };
    expect(shouldAutoAdvanceWolfGame(ended, false, null)).toBe(false);
  });

  it('does not auto-advance while loading', () => {
    const session = createSession();
    expect(shouldAutoAdvanceWolfGame(session, true, null)).toBe(false);
  });
});
