import { WolfGameState } from './types';

export function validateInvariants(state: WolfGameState): string[] {
  const errors: string[] = [];

  const aliveIds = new Set(state.players.filter(player => player.isAlive).map(player => player.id));
  const deadIds = new Set(state.players.filter(player => !player.isAlive).map(player => player.id));

  for (const id of aliveIds) {
    if (deadIds.has(id)) {
      errors.push(`dead_player_in_alive_list:${id}`);
    }
  }

  const killedId = state.nightAction.killedId;
  if (killedId) {
    const target = state.players.find(player => player.id === killedId);
    if (!target || !target.isAlive || target.role === 'werewolf') {
      errors.push(`werewolf_kill_target_invalid:${killedId}`);
    }
  }

  if (
    state.nightAction.killedId &&
    state.nightAction.poisonedId &&
    state.nightAction.killedId === state.nightAction.poisonedId
  ) {
    errors.push(`duplicate_death_same_resolution:${state.nightAction.killedId}`);
  }

  return errors;
}
