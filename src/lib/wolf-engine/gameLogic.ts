// 狼人杀游戏引擎 - 核心逻辑
import { v4 as uuidv4 } from 'uuid';
import { WolfPlayer, WolfRole, WolfMessage, WolfGameStatus } from '@/types';
import { WolfGameState, WolfNightAction, WolfVoteResult } from './types';

// 角色分配：6人局 = 2狼人 + 2村民 + 1预言家 + 1守卫
const ROLES: WolfRole[] = ['werewolf', 'werewolf', 'villager', 'villager', 'seer', 'guardian'];

// 角色显示名称映射（用于提示词和UI）
export const ROLE_INFO: Record<WolfRole, { label: string; icon: string; isEvil: boolean }> = {
  villager: { label: '村民', icon: '👤', isEvil: false },
  werewolf: { label: '狼人', icon: '🐺', isEvil: true },
  seer: { label: '预言家', icon: '🔮', isEvil: false },
  guardian: { label: '守卫', icon: '🛡️', isEvil: false },
};

// 获取场上存活的角色类型列表
export function getAliveRoleTypes(state: WolfGameState): string {
  const aliveRoles = getAlivePlayers(state).map(p => p.role);
  const uniqueRoles = [...new Set(aliveRoles)];
  return uniqueRoles.map(r => ROLE_INFO[r]?.label || r).join('、');
}

// 初始夜晚行动
function createInitialNightAction(): WolfNightAction {
  return {
    protectedId: null,
    checkedId: null,
    checkResult: null,
    killedId: null,
    healedId: null,
  };
}

// 随机分配角色
function shuffleRoles(): WolfRole[] {
  const shuffled = [...ROLES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 生成系统提示词
function generateSystemPrompt(player: WolfPlayer): string {
  const rolePrompts: Record<WolfRole, string> = {
    villager: `你是${player.name}，身份是村民（好人）。

游戏目标：找出并投出所有狼人
你的任务：认真分析发言，找出狼人

发言策略：
- 保持好人心态，真诚发言
- 分析每个玩家的发言是否合理
- 不要过于激进也不要过于消极
- 必要时可以跳身份`,
    werewolf: `你是${player.name}，身份是狼人。

游戏目标：杀光所有好人（屠边）
你的任务：隐藏身份，引导投票

发言策略：
- 伪装成好人发言
- 可以适当攻击可疑玩家
- 必要时可以悍跳预言家
- 注意不要暴露队友`,
    seer: `你是${player.name}，身份是预言家。

游戏目标：找出所有狼人
你的任务：验人并引导好人获胜

发言策略：
- 积极上警，争取警徽
- 报出查验结果，给好人信息
- 规划警徽流
- 保护自己`,
    guardian: `你是${player.name}，身份是守卫。

游戏目标：保护好人阵营
你的任务：守对关键玩家

发言策略：
- 可以适当跳身份寻求信任
- 记录每晚守护的人
- 不要过度暴露身份
- 关键时刻可以明跳`,
  };

  return rolePrompts[player.role];
}

// 创建游戏
export function createWolfGame(players: WolfPlayer[]): WolfGameState {
  // 分配角色
  const shuffledRoles = shuffleRoles();

  // 为每个玩家分配角色
  const playersWithRoles = players.map((player, index) => {
    const role = shuffledRoles[index];
    return {
      ...player,
      role,
      isAlive: true,
      hasWill: true,
      wasProtected: false,
      systemPrompt: generateSystemPrompt({ ...player, role }),
    };
  });

  // 随机选择第一个发言玩家
  const firstSpeaker = playersWithRoles
    .filter(p => p.isAlive)
    .sort((a, b) => a.playerNumber - b.playerNumber)[0];

  return {
    id: uuidv4(),
    players: playersWithRoles,
    currentRound: 1,
    status: 'waiting',
    nightAction: createInitialNightAction(),
    messages: [],
    votes: [],
    votingResults: {},
    wolfChatMessages: [],
    currentWolfChatPlayerIndex: 0,
    lastProtectedId: null,
    seerChecks: [],
  };
}

// 获取存活玩家
export function getAlivePlayers(state: WolfGameState): WolfPlayer[] {
  return state.players.filter(p => p.isAlive).sort((a, b) => a.playerNumber - b.playerNumber);
}

// 获取狼人玩家
export function getWolfPlayers(state: WolfGameState): WolfPlayer[] {
  return state.players.filter(p => p.role === 'werewolf' && p.isAlive);
}

// 获取预言家
export function getSeer(state: WolfGameState): WolfPlayer | undefined {
  return state.players.find(p => p.role === 'seer' && p.isAlive);
}

// 获取守卫
export function getGuardian(state: WolfGameState): WolfPlayer | undefined {
  return state.players.find(p => p.role === 'guardian' && p.isAlive);
}

// 开始游戏
export function startWolfGame(state: WolfGameState): WolfGameState {
  return {
    ...state,
    status: 'night',
    currentRound: 1,
  };
}

// 进入守卫行动阶段
export function startGuardianNight(state: WolfGameState): WolfGameState {
  return {
    ...state,
    status: 'night_guardian',
    nightAction: createInitialNightAction(),
  };
}

// 进入预言家行动阶段
export function startSeerNight(state: WolfGameState): WolfGameState {
  return {
    ...state,
    status: 'night_seer',
  };
}

// 进入狼人行动阶段
export function startWerewolfNight(state: WolfGameState): WolfGameState {
  return {
    ...state,
    status: 'night_werewolf',
  };
}

// 进入狼人密聊阶段
export function startWerewolfChat(state: WolfGameState): WolfGameState {
  const wolves = getWolfPlayers(state);
  return {
    ...state,
    status: 'werewolf_chat',
    wolfChatMessages: [],
    currentWolfChatPlayerIndex: 0,
  };
}

// 处理守卫守护
export function processGuardianProtect(state: WolfGameState, protectedId: string | null): WolfGameState {
  return {
    ...state,
    nightAction: {
      ...state.nightAction,
      protectedId,
    },
    lastProtectedId: state.nightAction.protectedId,
  };
}

// 处理预言家验人
export function processSeerCheck(state: WolfGameState, checkedId: string, isWolf: boolean): WolfGameState {
  const checkedPlayer = state.players.find(p => p.id === checkedId);
  return {
    ...state,
    nightAction: {
      ...state.nightAction,
      checkedId,
      checkResult: isWolf ? 'evil' : 'good',
    },
    seerChecks: [
      ...state.seerChecks,
      {
        playerId: checkedId,
        playerName: checkedPlayer?.name || '',
        result: isWolf ? 'evil' : 'good',
      },
    ],
  };
}

// 处理狼人刀人
export function processWerewolfKill(state: WolfGameState, killedId: string | null): WolfGameState {
  // 如果有守卫保护，则不死
  const wasProtected = state.nightAction.protectedId === killedId;

  let finalKilledId = killedId;

  // 更新被杀玩家状态
  const updatedPlayers = state.players.map(p => {
    if (p.id === killedId && !wasProtected) {
      return { ...p, isAlive: false };
    }
    return p;
  });

  return {
    ...state,
    players: updatedPlayers,
    nightAction: {
      ...state.nightAction,
      killedId: wasProtected ? null : killedId,
    },
  };
}

// 添加狼人密聊消息
export function addWolfChatMessage(state: WolfGameState, message: WolfMessage): WolfGameState {
  const newMessages = [...state.wolfChatMessages, message];
  const wolves = getWolfPlayers(state);

  // 检查是否是最后一个狼人发言
  const isLastWolf = newMessages.filter(m =>
    wolves.some(w => w.id === m.playerId)
  ).length >= wolves.length;

  return {
    ...state,
    wolfChatMessages: newMessages,
    currentWolfChatPlayerIndex: isLastWolf ? -1 : state.currentWolfChatPlayerIndex,
  };
}

// 获取下一个狼人密聊玩家
export function getNextWolfChatPlayer(state: WolfGameState): WolfPlayer | null {
  const wolves = getWolfPlayers(state);
  if (wolves.length === 0) return null;

  // 已发言的狼人
  const spokenWolfIds = new Set(
    state.wolfChatMessages
      .filter(m => wolves.some(w => w.id === m.playerId))
      .map(m => m.playerId)
  );

  // 找下一个未发言的狼人
  for (const wolf of wolves) {
    if (!spokenWolfIds.has(wolf.id)) {
      return wolf;
    }
  }

  return null;
}

// 统计狼人刀人投票并返回击杀目标
export function resolveWolfKill(state: WolfGameState): string | null {
  const wolves = getWolfPlayers(state);

  // 统计每个目标的票数
  const voteCount: Record<string, number> = {};
  state.wolfChatMessages
    .filter(m => wolves.some(w => w.id === m.playerId))
    .forEach(m => {
      // 从消息内容中提取目标（简化处理：最后一个被提及的玩家编号）
      const content = m.content;
      const numMatch = content.match(/(\d+)[号玩家]/);
      if (numMatch) {
        const playerNum = parseInt(numMatch[1], 10);
        const targetPlayer = state.players.find(p => p.playerNumber === playerNum && p.isAlive);
        if (targetPlayer) {
          voteCount[targetPlayer.id] = (voteCount[targetPlayer.id] || 0) + 1;
        }
      }
    });

  // 简单处理：如果无法从消息提取，使用随机选择
  if (Object.keys(voteCount).length === 0) {
    const aliveOthers = getAlivePlayers(state).filter(p => !wolves.some(w => w.id === p.id));
    if (aliveOthers.length > 0) {
      return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
    }
    return null;
  }

  // 找票数最多的
  let maxVotes = 0;
  let maxTarget: string | null = null;
  for (const [targetId, count] of Object.entries(voteCount)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxTarget = targetId;
    }
  }

  return maxTarget;
}

// 进入白天
export function startDay(state: WolfGameState): WolfGameState {
  return {
    ...state,
    status: 'day',
    currentRound: state.currentRound,
  };
}

// 统计投票结果
export function processVotingResults(
  state: WolfGameState,
  votes: WolfVoteResult[]
): { eliminatedId: string | null; hasTie: boolean; tiedIds: string[] } {
  // Bug fix 1: 过滤掉无效票（空字符串或 null targetId），防止 eliminatePlayer('') 被调用
  const validVotes = votes.filter(v => v.targetId && v.targetId.trim() !== '');

  const voteCount: Record<string, number> = {};
  validVotes.forEach(v => {
    voteCount[v.targetId] = (voteCount[v.targetId] || 0) + 1;
  });

  // Bug fix 2: 无有效投票时无人出局
  if (Object.keys(voteCount).length === 0) {
    return { eliminatedId: null, hasTie: false, tiedIds: [] };
  }

  // 找最高票数
  let maxVotes = 0;
  let maxTargets: string[] = [];
  for (const [targetId, count] of Object.entries(voteCount)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxTargets = [targetId];
    } else if (count === maxVotes) {
      maxTargets.push(targetId);
    }
  }

  const hasTie = maxTargets.length > 1;

  // 如果平票，返回平票玩家列表供 PK 使用
  if (hasTie) {
    return { eliminatedId: null, hasTie: true, tiedIds: maxTargets };
  }

  // Bug fix 3: 移除了 maxVotes <= 1 的错误限制，有明确领先者则直接淘汰
  return { eliminatedId: maxTargets[0], hasTie: false, tiedIds: [] };
}

// 淘汰玩家
export function eliminatePlayer(state: WolfGameState, playerId: string): WolfGameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, isAlive: false } : p
    ),
    eliminatedPlayerId: playerId,
  };
}

// 检查胜利条件
export function checkWinCondition(state: WolfGameState): 'good' | 'evil' | null {
  const alivePlayers = getAlivePlayers(state);
  const wolves = alivePlayers.filter(p => p.role === 'werewolf');
  const seer = alivePlayers.find(p => p.role === 'seer');
  const guardian = alivePlayers.find(p => p.role === 'guardian');
  const hasGod = seer || guardian;

  // 狼人全部死亡 -> 好人胜利
  if (wolves.length === 0) {
    return 'good';
  }

  // 屠边：杀光所有村民 或 杀光所有神职
  const villagers全部死亡 = !alivePlayers.some(p => p.role === 'villager');
  const 神职全部死亡 = !seer && !guardian;

  if (villagers全部死亡 || 神职全部死亡) {
    return 'evil';
  }

  return null;
}

// 进入下一轮
export function startNextRound(state: WolfGameState): WolfGameState {
  return {
    ...state,
    currentRound: state.currentRound + 1,
    status: 'night',
    eliminatedPlayerId: undefined,
    // 保留之前的游戏记录，只清空本轮的投票数据
    votes: [],
    votingResults: {},
  };
}

// 重置游戏
export function resetWolfGame(): WolfGameState | null {
  return null;
}
