import type { WolfGameState } from '@/lib/wolf-engine';
import type { WolfPhaseTransition } from '@/hooks/useWolfGame';

export function shouldAutoAdvanceWolfGame(
  session: WolfGameState | null,
  isLoading: boolean,
  pendingTransition: WolfPhaseTransition | null
): boolean {
  if (!session || isLoading || pendingTransition) {
    return false;
  }

  return session.status !== 'ended';
}
