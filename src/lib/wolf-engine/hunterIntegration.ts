// 猎人功能集成到游戏流程
import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';
import { processHunterKill, getHunterKillPrompt, parseHunterKillTarget } from './hunter';
import { callAI } from './aiClient';
import { getAlivePlayers } from './gameLogic';

// AI 调用类型（方便测试注入 mock）
type AICallFn = (player: WolfPlayer, prompt: string, temperature: number) => Promise<string>;

// 处理猎人被淘汰
export async function handleHunterElimination(
  state: WolfGameState,
  aiCallFn?: AICallFn
): Promise<WolfGameState> {
  // 没有淘汰玩家，直接返回
  if (!state.eliminatedPlayerId) {
    return state;
  }

  // 找到被淘汰的玩家
  const eliminatedPlayer = state.players.find(
    p => p.id === state.eliminatedPlayerId
  );

  // 如果被淘汰的不是猎人，直接返回
  if (!eliminatedPlayer || eliminatedPlayer.role !== 'hunter') {
    return state;
  }

  // 如果猎人已经被处理过击杀（避免重复）
  if (state.hunterKillTargetId) {
    return state;
  }

  // 获取存活玩家（排除猎人自己）
  const alivePlayers = getAlivePlayers(state).filter(
    p => p.id !== eliminatedPlayer.id
  );

  // 如果没有存活玩家，返回
  if (alivePlayers.length === 0) {
    return state;
  }

  // 使用注入的 AI 函数或默认的 callAI
  const aiFn = aiCallFn || callAI;

  try {
    // 生成提示词
    const prompt = getHunterKillPrompt(eliminatedPlayer, alivePlayers);

    // 调用 AI 获取击杀目标
    const response = await aiFn(eliminatedPlayer, prompt, 0.8);
    const targetId = parseHunterKillTarget(response, alivePlayers);

    // 如果 AI 返回了有效目标，执行击杀
    if (targetId) {
      return processHunterKill(state, targetId);
    }

    // 如果 AI 没有返回有效目标，随机选择
    const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return processHunterKill(state, randomTarget.id);
  } catch (error) {
    console.error('猎人击杀 AI 调用失败:', error);
    // AI 调用失败时，随机选择
    const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return processHunterKill(state, randomTarget.id);
  }
}
