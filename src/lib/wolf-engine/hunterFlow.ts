// 猎人击杀流程控制
import { WolfGameState } from './types';
import { resolveHunterShot, type HunterShotResolution } from './hunterIntegration';

function getNightHunterId(state: WolfGameState): string | null {
  const hunter = state.players.find(player => player.role === 'hunter');
  if (!hunter) {
    return null;
  }

  const diedFromWolfKill = state.nightAction.killedId === hunter.id && state.nightAction.healedId !== hunter.id;
  const diedFromPoison = state.nightAction.poisonedId === hunter.id;

  return diedFromWolfKill || diedFromPoison ? hunter.id : null;
}

export async function resolveNightHunterShot(state: WolfGameState): Promise<HunterShotResolution> {
  if (state.hunterKillTargetId) {
    const hunter = state.players.find(player => player.role === 'hunter') || null;
    const target = state.hunterKillTargetId
      ? state.players.find(player => player.id === state.hunterKillTargetId) || null
      : null;

    return {
      state,
      triggered: Boolean(target),
      hunter,
      target,
      phase: state.hunterKillPhase || 'night',
      speech: hunter && target ? `我是${hunter.name}，遗言声明：我带走${target.playerNumber}号。` : null,
    };
  }

  const hunterId = getNightHunterId(state);
  if (!hunterId) {
    return {
      state,
      triggered: false,
      hunter: null,
      target: null,
      phase: null,
      speech: null,
    };
  }

  return resolveHunterShot(state, { hunterId, phase: 'night' });
}

/**
 * 女巫结算后检查猎人是否死亡，如果死亡则触发猎人击杀
 * 保留同步包装，兼容旧测试；实际对局流程请使用 resolveNightHunterShot。
 */
export function applyHunterAfterWitch(state: WolfGameState): WolfGameState {
  if (state.hunterKillTargetId) {
    return state;
  }

  const hunterId = getNightHunterId(state);
  if (!hunterId) {
    return state;
  }

  const aliveTargets = state.players.filter(player => player.isAlive && player.id !== hunterId);
  if (aliveTargets.length === 0) {
    return state;
  }

  const target = aliveTargets[0];
  return {
    ...state,
    hunterKillTargetId: target.id,
    hunterKillPhase: 'night',
    hunterKillRound: state.currentRound,
    players: state.players.map(player =>
      player.id === target.id ? { ...player, isAlive: false } : player
    ),
  };
}

/**
 * 投票后检查猎人是否被淘汰，如果淘汰则触发猎人击杀
 * 该函数由 handleHunterElimination 已经处理，这里是占位符
 */
export function applyHunterAfterVote(state: WolfGameState): WolfGameState {
  return state;
}

