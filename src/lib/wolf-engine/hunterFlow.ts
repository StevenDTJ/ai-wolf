// 猎人击杀流程控制
import { WolfGameState } from './types';
import { processHunterKill } from './hunter';

/**
 * 女巫结算后检查猎人是否死亡，如果死亡则触发猎人击杀
 * @param state 游戏状态
 * @returns 更新后的游戏状态
 */
export function applyHunterAfterWitch(state: WolfGameState): WolfGameState {
  // 检查猎人是否死亡
  const hunter = state.players.find(p => p.role === 'hunter');

  // 如果猎人存活或已被处理，直接返回
  if (!hunter || hunter.isAlive || state.hunterKillTargetId) {
    return state;
  }

  // 猎人死亡，获取存活目标（排除猎人自己）
  const alivePlayers = state.players.filter(p => p.isAlive && p.id !== hunter.id);

  // 如果没有存活玩家，返回
  if (alivePlayers.length === 0) {
    return state;
  }

  // 随机选择击杀目标（简化实现，实际应由 AI 决策）
  const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  return processHunterKill(state, randomTarget.id);
}

/**
 * 投票后检查猎人是否被淘汰，如果淘汰则触发猎人击杀
 * 该函数由 handleHunterElimination 已经处理，这里是占位符
 * @param state 游戏状态
 * @returns 游戏状态
 */
export function applyHunterAfterVote(state: WolfGameState): WolfGameState {
  // 已在 useWolfGame.ts 的 handleVoting 中通过 handleHunterElimination 处理
  return state;
}
