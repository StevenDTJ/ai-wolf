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
  const deadIds: string[] = [];

  if (state.nightAction.killedId) {
    deadIds.push(state.nightAction.killedId);
  }

  if (state.nightAction.poisonedId) {
    deadIds.push(state.nightAction.poisonedId);
  }

  const hunterTarget = state.hunterKillPhase === 'night' && state.hunterKillRound === state.currentRound && state.hunterKillTargetId
    ? state.players.find(player => player.id === state.hunterKillTargetId) || null
    : null;

  if (hunterTarget) {
    deadIds.push(hunterTarget.id);
  }

  const uniqueDeadIds = [...new Set(deadIds)];

  let content: string;
  if (uniqueDeadIds.length === 0) {
    content = '天亮了，昨夜无人死亡';
  } else {
    const names = uniqueDeadIds
      .map(id => state.players.find(p => p.id === id)?.name || '某人')
      .join('、');
    content = `天亮了，昨夜死亡：${names}`;
    if (hunterTarget) {
      content += `；猎人带走了 ${hunterTarget.name}`;
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

/**
 * 构建白天投票结果广播
 * @param state 游戏状态
 * @param baseMessage 基础消息（如 "X被投票出局"）
 * @returns 完整的系统消息
 */
export function buildDayVoteBroadcast(state: WolfGameState, baseMessage: string): WolfMessage {
  let content = baseMessage;

  if (state.hunterKillPhase === 'day' && state.hunterKillRound === state.currentRound && state.hunterKillTargetId) {
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
