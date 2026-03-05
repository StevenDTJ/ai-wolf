// 狼人杀系统广播模块
import { WolfGameState } from './types';
import { WolfMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 构建夜间死亡广播（不标注死因）
 * @param state 游戏状态
 * @returns 系统消息
 */
export function buildNightBroadcast(state: WolfGameState): WolfMessage {
  // 收集所有夜间死亡玩家
  const deadIds: string[] = [];

  // 狼人击杀
  if (state.nightAction.killedId) {
    deadIds.push(state.nightAction.killedId);
  }

  // 女巫毒药
  if (state.nightAction.poisonedId) {
    deadIds.push(state.nightAction.poisonedId);
  }

  // 猎人夜间击杀（如果猎人被杀）
  // 注意：猎人击杀会在 hunterFlow 中处理，这里只需要列出最终死亡名单

  const uniqueDeadIds = [...new Set(deadIds)];

  let content: string;
  if (uniqueDeadIds.length === 0) {
    content = '天亮了，昨夜无人死亡';
  } else {
    const names = uniqueDeadIds
      .map(id => state.players.find(p => p.id === id)?.name || '某人')
      .join('、');
    content = `天亮了，昨夜死亡：${names}`;
  }

  return {
    id: uuidv4(),
    playerId: 'system',
    playerName: '系统',
    content,
    type: 'inner_thought',
    round: state.currentRound,
    timestamp: Date.now(),
  };
}

/**
 * 构建白天投票结果广播
 * @param state 游戏状态
 * @param baseMessage 基础消息（如 "X被投票出局"）
 * @returns 完整的系统消息
 */
export function buildDayVoteBroadcast(state: WolfGameState, baseMessage: string): WolfMessage {
  let content = baseMessage;

  // 如果猎人击杀了玩家，明确标注
  if (state.hunterKillTargetId) {
    const killedTarget = state.players.find(p => p.id === state.hunterKillTargetId);
    if (killedTarget) {
      content += `，猎人带走了 ${killedTarget.name}！`;
    }
  }

  return {
    id: uuidv4(),
    playerId: 'system',
    playerName: '系统',
    content,
    type: 'speech',
    round: state.currentRound,
    timestamp: Date.now(),
  };
}
