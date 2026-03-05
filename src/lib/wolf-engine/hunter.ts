// 猎人功能
import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';

// 处理猎人击杀
export function processHunterKill(
  state: WolfGameState,
  targetId: string
): WolfGameState {
  const targetPlayer = state.players.find(p => p.id === targetId);
  if (!targetPlayer) {
    return state;
  }

  return {
    ...state,
    hunterKillTargetId: targetId,
    players: state.players.map(p =>
      p.id === targetId ? { ...p, isAlive: false } : p
    ),
  };
}

// 获取猎人击杀目标
export function getHunterKillTarget(
  state: WolfGameState
): WolfPlayer | null {
  if (!state.hunterKillTargetId) {
    return null;
  }
  return state.players.find(p => p.id === state.hunterKillTargetId) || null;
}

// 猎人选择击杀目标提示词
const HUNTER_KILL_PROMPT = `你是{playerName}，身份是猎人。

【可见范围】⚠️ 重要：你的选择会被所有存活玩家看到！

【当前局面】
- 存活玩家：{alivePlayers}
- 你刚刚被淘汰

【你的任务】
猎人被淘汰时，可以选择带走一名存活玩家。选择一个你认为最可能是狼人的人带走。

请按以下格式输出：
理由：【简要说明原因，30字以内】
选择：【玩家编号，如：2】`;

// 生成猎人击杀提示词
export function getHunterKillPrompt(
  hunter: WolfPlayer,
  alivePlayers: WolfPlayer[]
): string {
  const alivePlayersStr = alivePlayers
    .filter(p => p.id !== hunter.id)
    .map(p => `${p.playerNumber}号 ${p.name}`)
    .join('、');

  return HUNTER_KILL_PROMPT
    .replace('{playerName}', hunter.name)
    .replace('{alivePlayers}', alivePlayersStr);
}

// 从 AI 响应中解析击杀目标
export function parseHunterKillTarget(
  response: string,
  alivePlayers: WolfPlayer[]
): string | null {
  // 匹配 "选择：X" 或 "选择：X号"
  const choiceMatch = response.match(/选择[：:]\s*(\d+)/);
  if (choiceMatch) {
    const playerNum = parseInt(choiceMatch[1], 10);
    const target = alivePlayers.find(p => p.playerNumber === playerNum);
    if (target) {
      return target.id;
    }
  }

  // 匹配 "X号" 格式
  const numMatch = response.match(/(\d+)\s*号/);
  if (numMatch) {
    const playerNum = parseInt(numMatch[1], 10);
    const target = alivePlayers.find(p => p.playerNumber === playerNum);
    if (target) {
      return target.id;
    }
  }

  return null;
}
