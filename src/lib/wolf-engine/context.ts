// 狼人杀上下文构建模块

import { WolfPlayer, WolfMessage, WolfVote, WolfGameStatus } from '@/types';
import { WolfGameState, WolfNightAction } from './types';

// 角色类型
export type WolfRole = 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter';

// 游戏阶段
export type GamePhase =
  | 'night'
  | 'night_seer'
  | 'night_werewolf'
  | 'werewolf_chat'
  | 'night_witch'
  | 'day'
  | 'day_speech'
  | 'voting';

// 公开信息
export interface PublicInfo {
  speeches: WolfMessage[];
  votes: WolfVote[];
  systemBroadcasts: WolfMessage[];
}

// 私有信息
export interface PrivateInfo {
  seerChecks?: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
  witchPotions?: { saveUsed: boolean; poisonUsed: boolean; saveAvailable: boolean; poisonAvailable: boolean };
  wolfChats?: WolfMessage[];
  wolfKills?: Array<{ round: number; targetId: string }>;
  hunterPendingDeath?: boolean;
}

// 统一上下文
export interface WolfContext {
  phase: GamePhase;
  publicInfo: PublicInfo;
  privateInfo: PrivateInfo;
  alivePlayers: WolfPlayer[];
  nightAction?: WolfNightAction;
  currentRound: number;
}

/**
 * 对公开信息按轮次和时间戳排序
 * @param items 包含 round 和 timestamp 属性的项
 * @returns 排序后的项数组（round 升序，timestamp 升序）
 */
export function orderPublicInfo<T extends { round: number; timestamp: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.round - b.round) || (a.timestamp - b.timestamp));
}

/**
 * 构建统一上下文（角色 × 阶段）
 * @param role 角色类型
 * @param state 游戏状态
 * @param phase 当前阶段
 * @returns 包含公开信息和私有信息的上下文
 */
export function buildContext(
  role: WolfRole,
  state: WolfGameState,
  phase: GamePhase
): WolfContext {
  const alivePlayers = state.players.filter(p => p.isAlive);

  // 公开信息 - 按 round→timestamp 排序
  const speeches = orderPublicInfo(
    state.messages.filter(m => m.type === 'speech' || m.type === 'final_speech')
  );
  const votes = orderPublicInfo(
    state.votes.filter(v => v.round < state.currentRound)
  );
  const systemBroadcasts = orderPublicInfo(
    state.messages.filter(m => m.type === 'inner_thought' && m.playerId === 'system')
  );

  const publicInfo: PublicInfo = {
    speeches,
    votes,
    systemBroadcasts,
  };

  // 私有信息 - 根据角色决定
  const privateInfo: PrivateInfo = {};

  if (role === 'seer') {
    privateInfo.seerChecks = state.seerChecks;
  }

  if (role === 'witch') {
    privateInfo.witchPotions = {
      saveUsed: state.witchSaveUsed,
      poisonUsed: state.witchPoisonUsed,
      saveAvailable: !state.witchSaveUsed,
      poisonAvailable: !state.witchPoisonUsed,
    };
  }

  if (role === 'werewolf') {
    privateInfo.wolfChats = state.wolfChatMessages;
    // TODO: 添加刀人记录
  }

  // 猎人死亡提示（夜间或白天被淘汰时）
  if (role === 'hunter') {
    const hunter = state.players.find(p => p.role === 'hunter');
    if (hunter && !hunter.isAlive) {
      privateInfo.hunterPendingDeath = true;
    }
  }

  return {
    phase,
    publicInfo,
    privateInfo,
    alivePlayers,
    nightAction: state.nightAction,
    currentRound: state.currentRound,
  };
}
