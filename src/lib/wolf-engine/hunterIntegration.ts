// 猎人功能集成到游戏流程
import { WolfGameState } from './types';
import { WolfPlayer } from '@/types';
import { processHunterKill, getHunterKillPrompt, parseHunterKillTarget } from './hunter';
import { callAI } from './aiClient';
import { getAlivePlayers } from './gameLogic';

// AI 调用类型（方便测试注入 mock）
type AICallFn = (player: WolfPlayer, prompt: string, temperature: number) => Promise<string>;

export interface HunterShotResolution {
  state: WolfGameState;
  triggered: boolean;
  hunter: WolfPlayer | null;
  target: WolfPlayer | null;
  phase: 'night' | 'day' | null;
  speech: string | null;
}

interface ResolveHunterShotOptions {
  hunterId?: string | null;
  phase?: 'night' | 'day';
}

function buildHunterShotSpeech(hunter: WolfPlayer, target: WolfPlayer): string {
  return `我是${hunter.name}，遗言声明：我带走${target.playerNumber}号。`;
}

export async function resolveHunterShot(
  state: WolfGameState,
  options: ResolveHunterShotOptions = {},
  aiCallFn?: AICallFn
): Promise<HunterShotResolution> {
  const hunter = options.hunterId
    ? state.players.find(player => player.id === options.hunterId)
    : state.players.find(player => player.id === state.eliminatedPlayerId);

  if (!hunter || hunter.role !== 'hunter') {
    return {
      state,
      triggered: false,
      hunter: null,
      target: null,
      phase: null,
      speech: null,
    };
  }

  const phase = options.phase || (state.status.startsWith('night') || state.status === 'werewolf_chat' ? 'night' : 'day');

  if (state.hunterKillTargetId) {
    const existingTarget = state.players.find(player => player.id === state.hunterKillTargetId) || null;
    return {
      state,
      triggered: Boolean(existingTarget),
      hunter,
      target: existingTarget,
      phase: state.hunterKillPhase || phase,
      speech: existingTarget ? buildHunterShotSpeech(hunter, existingTarget) : null,
    };
  }

  const alivePlayers = getAlivePlayers(state).filter(player => player.id !== hunter.id);
  if (alivePlayers.length === 0) {
    return {
      state,
      triggered: false,
      hunter,
      target: null,
      phase,
      speech: null,
    };
  }

  const aiFn = aiCallFn || callAI;
  let target = alivePlayers[0];

  try {
    const prompt = getHunterKillPrompt(hunter, alivePlayers);
    const response = await aiFn(hunter, prompt, 0.8);
    const parsedTargetId = parseHunterKillTarget(response, alivePlayers);
    if (parsedTargetId) {
      const parsedTarget = alivePlayers.find(player => player.id === parsedTargetId);
      if (parsedTarget) {
        target = parsedTarget;
      }
    }
  } catch (error) {
    console.error('猎人击杀 AI 调用失败:', error);
  }

  const processedState = processHunterKill(state, target.id);
  const nextState: WolfGameState = {
    ...processedState,
    hunterKillPhase: phase,
  };

  return {
    state: nextState,
    triggered: true,
    hunter,
    target,
    phase,
    speech: buildHunterShotSpeech(hunter, target),
  };
}

// 处理猎人被淘汰
export async function handleHunterElimination(
  state: WolfGameState,
  aiCallFn?: AICallFn
): Promise<WolfGameState> {
  if (!state.eliminatedPlayerId) {
    return state;
  }

  const result = await resolveHunterShot(
    state,
    { hunterId: state.eliminatedPlayerId, phase: 'day' },
    aiCallFn
  );

  return result.state;
}
