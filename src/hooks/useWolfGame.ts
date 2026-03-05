'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  WolfPlayer,
  WolfMessage,
  WolfVote,
} from '@/types';
import {
  WolfGameState,
  createWolfGame,
  startWolfGame,
  startSeerNight,
  startWerewolfNight,
  startWerewolfChat,
  startDay,
  processGuardianProtect,
  processSeerCheck,
  processWerewolfKill,
  eliminatePlayer,
  processVotingResults,
  checkWinCondition,
  startNextRound,
  getAlivePlayers,
  getWolfPlayers,
  getSeer,
  getGuardian,
} from '@/lib/wolf-engine';
import {
  generateGuardianAction,
  generateSeerAction,
  generateWerewolfChat,
  generateDaySpeech,
  generateVoteDecision,
  generateFinalSpeech,
} from '@/lib/wolf-engine/aiClient';

// Local storage keys
const WOLF_PLAYERS_KEY = 'ai-debate-wolf-players';

// 创建默认狼人杀玩家
export function createDefaultWolfPlayer(playerNumber: number): WolfPlayer {
  return {
    id: `wolf-${uuidv4().slice(0, 8)}`,
    name: `玩家${playerNumber}`,
    playerNumber,
    role: 'villager',
    isAlive: true,
    hasWill: true,
    wasProtected: false,
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    systemPrompt: '',
  };
}

// 从 localStorage 加载玩家
export function loadWolfPlayersFromStorage(): WolfPlayer[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(WOLF_PLAYERS_KEY);
  if (saved) {
    try {
      const players = JSON.parse(saved);
      return players.map((p: WolfPlayer, index: number) => ({
        ...p,
        playerNumber: p.playerNumber || index + 1,
      }));
    } catch {
      return [];
    }
  }
  return [];
}

// 保存玩家到 localStorage
export function saveWolfPlayersToStorage(players: WolfPlayer[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WOLF_PLAYERS_KEY, JSON.stringify(players));
}

// 构建夜晚上下文
function buildNightContext(state: WolfGameState) {
  return {
    currentRound: state.currentRound,
    players: state.players,
    alivePlayers: getAlivePlayers(state),
    wolfPlayers: getWolfPlayers(state),
    nightAction: state.nightAction,
    seerChecks: state.seerChecks,
    lastProtectedId: state.lastProtectedId,
  };
}

// 构建白天上下文
function buildDayContext(state: WolfGameState): {
  currentRound: number;
  players: WolfPlayer[];
  alivePlayers: WolfPlayer[];
  nightAction: { protectedId: string | null; checkedId: string | null; checkResult: 'good' | 'evil' | null; killedId: string | null; healedId: string | null };
  seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
  previousSpeeches: WolfMessage[];
} {
  return {
    currentRound: state.currentRound,
    players: state.players,
    alivePlayers: getAlivePlayers(state),
    nightAction: state.nightAction,
    seerChecks: state.seerChecks,
    previousSpeeches: state.messages.filter(m =>
      m.type === 'speech' && m.round === state.currentRound
    ),
  };
}

// Hook 返回类型
export interface UseWolfGameReturn {
  session: WolfGameState | null;
  players: WolfPlayer[];
  isLoading: boolean;
  error: string | null;
  currentStreamingContent: string;
  currentMessageType: 'inner_thought' | 'speech' | 'wolf_chat' | 'guardian_action' | 'seer_action';
  votes: WolfVote[];
  votingResults: Record<string, number>;
  currentSpeakerIndex: number;
  addPlayer: (player: WolfPlayer) => void;
  updatePlayer: (player: WolfPlayer) => void;
  removePlayer: (id: string) => void;
  initGame: () => void;
  startGame: () => void;
  nextAction: () => Promise<void>;
  resetGame: () => void;
  stopGeneration: () => void;
}

export function useWolfGame(): UseWolfGameReturn {
  // 玩家列表
  const [players, setPlayers] = useState<WolfPlayer[]>(() => loadWolfPlayersFromStorage());

  // 游戏会话
  const [session, setSession] = useState<WolfGameState | null>(null);
  const sessionRef = useRef<WolfGameState | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 流式输出
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [currentMessageType, setCurrentMessageType] = useState<'inner_thought' | 'speech' | 'wolf_chat' | 'guardian_action' | 'seer_action'>('speech');

  // 投票相关
  const [votes, setVotes] = useState<WolfVote[]>([]);
  const [votingResults, setVotingResults] = useState<Record<string, number>>({});
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);

  // 取消控制器
  const abortControllerRef = useRef<AbortController | null>(null);

  // 同步 session 到 ref
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 保存玩家
  const savePlayers = useCallback((newPlayers: WolfPlayer[]) => {
    setPlayers(newPlayers);
    saveWolfPlayersToStorage(newPlayers);
  }, []);

  // 添加玩家
  const addPlayer = useCallback((player: WolfPlayer) => {
    if (players.length >= 6) return;
    const newPlayer = { ...player, playerNumber: players.length + 1 };
    savePlayers([...players, newPlayer]);
  }, [players, savePlayers]);

  // 更新玩家
  const updatePlayer = useCallback((player: WolfPlayer) => {
    savePlayers(players.map(p => p.id === player.id ? player : p));
  }, [players, savePlayers]);

  // 删除玩家
  const removePlayer = useCallback((id: string) => {
    const filtered = players.filter(p => p.id !== id);
    const renumbered = filtered.map((p, idx) => ({ ...p, playerNumber: idx + 1 }));
    savePlayers(renumbered);
  }, [players, savePlayers]);

  // 初始化游戏
  const initGame = useCallback(() => {
    if (players.length !== 6) {
      setError('需要6名玩家才能开始游戏');
      return;
    }
    const game = createWolfGame(players);
    setSession(game);
    setVotes([]);
    setVotingResults({});
    setCurrentSpeakerIndex(0);
    setError(null);
  }, [players]);

  // 开始游戏
  const startGame = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    if (players.filter(p => p.apiKey.trim()).length === 0) {
      setError('请至少为一名玩家配置 API Key');
      return;
    }
    setSession(startWolfGame(currentSession));
  }, [players]);

  // 下一行动（状态机核心）
  const nextAction = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession || isLoading) return;

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      switch (currentSession.status) {
        case 'waiting': {
          // 开始第一晚
          setSession(startWolfGame(currentSession));
          break;
        }

        case 'night':
        case 'night_guardian': {
          // 守卫行动
          await handleGuardianNight(currentSession);
          break;
        }

        case 'night_seer': {
          // 预言家行动
          await handleSeerNight(currentSession);
          break;
        }

        case 'night_werewolf': {
          // 进入狼人密聊
          setSession(startWerewolfChat(currentSession));
          break;
        }

        case 'werewolf_chat': {
          // 狼人密聊
          await handleWerewolfChat(currentSession);
          break;
        }

        case 'day':
        case 'day_speech': {
          // 白天发言
          await handleDaySpeech(currentSession);
          break;
        }

        case 'voting': {
          // 投票
          await handleVoting(currentSession);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('操作已取消');
      } else {
        setError(err instanceof Error ? err.message : '发生错误');
      }
    } finally {
      setIsLoading(false);
      setCurrentStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [isLoading]);

  // 守卫夜晚（添加系统反馈）
  async function handleGuardianNight(state: WolfGameState) {
    const guardian = getGuardian(state);

    if (!guardian || !guardian.isAlive) {
      // 守卫已死，跳过
      setSession(startSeerNight(state));
      return;
    }

    setCurrentMessageType('guardian_action');
    setCurrentStreamingContent('守卫正在选择守护目标...');

    const context = buildNightContext(state);
    const result = await generateGuardianAction(guardian, context);

    let newState = processGuardianProtect(state, result.protectedId);

    // 更新被守护玩家的 wasProtected 状态
    if (result.protectedId) {
      newState = {
        ...newState,
        players: newState.players.map(p =>
          p.id === result.protectedId
            ? { ...p, wasProtected: true }
            : p
        ),
      };
    }

    // 添加守卫的决策理由（仅观众可见）
    const guardReasonMsg: WolfMessage = {
      id: uuidv4(),
      playerId: guardian.id,
      playerName: guardian.name,
      content: result.reasoning || '（守卫正在思考...）',
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    // 添加系统反馈（仅观众可见）
    const protectedPlayer = result.protectedId
      ? state.players.find(p => p.id === result.protectedId)
      : null;
    const guardMsg: WolfMessage = {
      id: uuidv4(),
      playerId: 'system',
      playerName: '系统',
      content: protectedPlayer
        ? `【观众视角】守卫守护了 ${protectedPlayer.name}`
        : '【观众视角】守卫选择不守护任何人',
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    newState = {
      ...newState,
      messages: [...newState.messages, guardReasonMsg, guardMsg],
    };

    newState = startSeerNight(newState);

    setSession(newState);
    setCurrentStreamingContent('');
  }

  // 预言家夜晚（添加验人反馈）
  async function handleSeerNight(state: WolfGameState) {
    const seer = getSeer(state);

    if (!seer || !seer.isAlive) {
      setSession(startWerewolfNight(state));
      return;
    }

    setCurrentMessageType('seer_action');
    setCurrentStreamingContent('预言家正在选择查验目标...');

    const context = buildNightContext(state);
    const result = await generateSeerAction(seer, context);

    const checkedPlayer = state.players.find(p => p.id === result.checkedId);
    const isWolf = checkedPlayer?.role === 'werewolf';

    let newState = processSeerCheck(state, result.checkedId, isWolf);

    // 添加预言家的决策理由（仅观众可见）
    const seerReasonMsg: WolfMessage = {
      id: uuidv4(),
      playerId: seer.id,
      playerName: seer.name,
      content: result.reasoning || '（预言家正在思考...）',
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    // 添加系统反馈（仅观众可见）
    const seerMsg: WolfMessage = {
      id: uuidv4(),
      playerId: 'system',
      playerName: '系统',
      content: `【观众视角】预言家查验了 ${checkedPlayer?.name || '某人'}，结果是 ${isWolf ? '狼人' : '好人'}`,
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    newState = {
      ...newState,
      messages: [...newState.messages, seerReasonMsg, seerMsg],
    };

    newState = startWerewolfNight(newState);

    setSession(newState);
    setCurrentStreamingContent('');
  }

  // 狼人密聊
  async function handleWerewolfChat(state: WolfGameState) {
    const wolves = getWolfPlayers(state);
    const context = buildNightContext(state);

    // 狼人密聊最大轮数
    const MAX_CHAT_ROUNDS = 2;
    let chatMessages: WolfMessage[] = [];
    let allKillVotes: Array<{ playerId: string; targetId: string | null }> = [];

    // 狼人密聊多轮讨论
    for (let round = 0; round < MAX_CHAT_ROUNDS; round++) {
      // 构建包含之前讨论历史的上下文
      const chatHistoryStr = chatMessages
        .map(m => `${m.playerName}：${m.content.slice(0, 100)}`)
        .join('\n');

      const roundContext = {
        ...context,
        chatHistory: chatHistoryStr,
      };

      // 让每个狼人发言
      for (const wolf of wolves) {
        setCurrentMessageType('wolf_chat');
        setCurrentStreamingContent(`${wolf.name}正在密聊...（第${round + 1}轮）`);

        const result = await generateWerewolfChat(wolf, roundContext);

        const msg: WolfMessage = {
          id: uuidv4(),
          playerId: wolf.id,
          playerName: wolf.name,
          content: result.message,
          type: 'wolf_chat',
          round: state.currentRound,
          timestamp: Date.now(),
        };

        chatMessages.push(msg);

        // 提取刀人目标
        const killTarget = result.message.match(/(\d+)号/)?.[1];
        let targetId: string | null = null;

        if (killTarget) {
          const targetNum = parseInt(killTarget, 10);
          const targetPlayer = state.players.find(
            p => p.playerNumber === targetNum && !wolves.some(w => w.id === p.id)
          );
          targetId = targetPlayer?.id || null;
        }

        allKillVotes.push({ playerId: wolf.id, targetId });
      }

      // 检查当前轮次的投票情况
      const currentRoundVotes = allKillVotes.slice(-wolves.length);
      const voteTargets = currentRoundVotes
        .map(v => v.targetId)
        .filter((v): v is string => v !== null);

      // 统计票数
      const voteCount: Record<string, number> = {};
      voteTargets.forEach(t => {
        voteCount[t] = (voteCount[t] || 0) + 1;
      });

      // 检查是否达成共识（某一目标超过半数）
      const totalWolves = wolves.length;
      const hasConsensus = Object.values(voteCount).some(count => count > totalWolves / 2);

      if (hasConsensus || round === MAX_CHAT_ROUNDS - 1) {
        // 达成共识或已达最大轮数，结束讨论
        break;
      }

      // 添加系统提示，引导下一轮讨论
      const disagreementMsg: WolfMessage = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: `【狼人阵营】本轮讨论结束，意见不统一，继续讨论...`,
        type: 'wolf_chat',
        round: state.currentRound,
        timestamp: Date.now(),
      };
      chatMessages.push(disagreementMsg);
    }

    // 统计最终刀人目标（使用所有轮次的投票）
    const voteCount: Record<string, number> = {};
    allKillVotes.forEach(v => {
      if (v.targetId) {
        voteCount[v.targetId] = (voteCount[v.targetId] || 0) + 1;
      }
    });

    // 找票数最多的
    let maxVotes = 0;
    let killTargetId: string | null = null;
    for (const [targetId, count] of Object.entries(voteCount)) {
      if (count > maxVotes) {
        maxVotes = count;
        killTargetId = targetId;
      }
    }

    // 如果没有有效目标，随机选择
    if (!killTargetId) {
      const validTargets = getAlivePlayers(state).filter(
        p => !wolves.some(w => w.id === p.id)
      );
      if (validTargets.length > 0) {
        killTargetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
      }
    }

    let newState = processWerewolfKill(state, killTargetId);

    // 添加所有密聊消息
    newState = {
      ...newState,
      wolfChatMessages: chatMessages,
      messages: [...newState.messages, ...chatMessages],
    };

    // 从 newState 获取实际的击杀结果（考虑守卫保护）
    const actualKilledId = newState.nightAction.killedId;
    const victim = actualKilledId ? newState.players.find(p => p.id === actualKilledId) : null;

    // 添加刀人目标反馈（仅观众可见）
    const intendedVictim = killTargetId ? state.players.find(p => p.id === killTargetId) : null;
    if (intendedVictim) {
      const isProtected = actualKilledId === null && killTargetId !== null;
      const killMsg: WolfMessage = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: isProtected
          ? `【观众视角】狼人决定刀 ${intendedVictim.name}，但被守卫守护`
          : `【观众视角】狼人决定刀 ${intendedVictim.name}`,
        type: 'inner_thought',
        round: state.currentRound,
        timestamp: Date.now(),
      };
      newState = {
        ...newState,
        messages: [...newState.messages, killMsg],
      };
    }

    // 进入白天
    newState = startDay(newState);

    // 添加死亡信息（使用实际的击杀结果）
    const deathMsg: WolfMessage = {
      id: uuidv4(),
      playerId: 'system',
      playerName: '系统',
      content: victim ? `昨晚${victim.name}倒牌。` : '昨晚是平安夜。',
      type: 'speech',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    const finalState = {
      ...newState,
      messages: [...newState.messages, deathMsg],
    };

    // 检查胜利条件
    const winner = checkWinCondition(finalState);
    if (winner) {
      setSession({
        ...finalState,
        status: 'ended',
        winner,
      });
      return;
    }

    setSession(finalState);
    setCurrentStreamingContent('');
    setCurrentSpeakerIndex(0);
  }

  // 白天发言（简化版，只输出发言）
  async function handleDaySpeech(state: WolfGameState) {
    const alivePlayers = getAlivePlayers(state);

    if (currentSpeakerIndex >= alivePlayers.length) {
      // 发言结束，进入投票
      setSession(prev => prev ? { ...prev, status: 'voting' } : null);
      setCurrentSpeakerIndex(0);
      return;
    }

    const speaker = alivePlayers[currentSpeakerIndex];

    setCurrentMessageType('speech');
    setCurrentStreamingContent(`${speaker.name}正在发言...`);

    const context = buildDayContext(state);

    // 生成发言
    const result = await generateDaySpeech(speaker, context);

    // 只添加发言消息 - 使用函数式更新确保状态正确
    const speechMsg: WolfMessage = {
      id: uuidv4(),
      playerId: speaker.id,
      playerName: speaker.name,
      content: result.speech,
      type: 'speech',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, speechMsg],
      };
    });

    setCurrentSpeakerIndex(prev => prev + 1);
    setCurrentStreamingContent('');
  }

  // 投票
  async function handleVoting(state: WolfGameState) {
    const alivePlayers = getAlivePlayers(state);
    const context = buildDayContext(state);

    const newVotes: WolfVote[] = [];
    const results: Record<string, number> = {};

    for (const player of alivePlayers) {
      setCurrentMessageType('inner_thought');
      setCurrentStreamingContent(`${player.name}正在投票...`);

      const decision = await generateVoteDecision(player, context);

      const vote: WolfVote = {
        voterId: player.id,
        voterName: player.name,
        targetId: decision.targetId,
        targetName: state.players.find(p => p.id === decision.targetId)?.name || '未知',
        round: state.currentRound,
        timestamp: Date.now(),
      };

      newVotes.push(vote);
      results[decision.targetId] = (results[decision.targetId] || 0) + 1;

      // 添加投票消息
      const voteMsg: WolfMessage = {
        id: uuidv4(),
        playerId: player.id,
        playerName: player.name,
        content: `投票给 ${vote.targetName}（${decision.reason || '基于判断'}）`,
        type: 'inner_thought',
        round: state.currentRound,
        timestamp: Date.now(),
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, voteMsg],
      } : null);

      // 短暂延迟以便UI显示
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setVotes(newVotes);
    setVotingResults(results);

    // 处理投票结果
    const { eliminatedId, hasTie } = processVotingResults(state, newVotes);

    let newState = state;
    let resultMsg: WolfMessage;

    if (eliminatedId && !hasTie) {
      newState = eliminatePlayer(state, eliminatedId);
      const eliminatedPlayer = state.players.find(p => p.id === eliminatedId);

      // 生成遗言
      if (eliminatedPlayer) {
        const finalSpeechContext = {
          players: newState.players,
          alivePlayers: getAlivePlayers(newState),
          seerChecks: newState.seerChecks,
        };
        const finalSpeechResult = await generateFinalSpeech(eliminatedPlayer, finalSpeechContext);

        // 添加遗言消息
        const finalSpeechMsg: WolfMessage = {
          id: uuidv4(),
          playerId: eliminatedPlayer.id,
          playerName: eliminatedPlayer.name,
          content: finalSpeechResult.speech,
          type: 'final_speech',
          round: state.currentRound,
          timestamp: Date.now(),
        };
        newState = {
          ...newState,
          messages: [...newState.messages, finalSpeechMsg],
        };
      }

      resultMsg = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: `${eliminatedPlayer?.name}被投票出局。`,
        type: 'speech',
        round: state.currentRound,
        timestamp: Date.now(),
      };
    } else if (hasTie) {
      resultMsg = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: '投票平票，无人出局。',
        type: 'speech',
        round: state.currentRound,
        timestamp: Date.now(),
      };
    } else {
      resultMsg = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: '无人获得足够票数，无人出局。',
        type: 'speech',
        round: state.currentRound,
        timestamp: Date.now(),
      };
    }

    newState = {
      ...newState,
      messages: [...newState.messages, resultMsg],
    };

    // 检查胜利条件
    const winner = checkWinCondition(newState);
    if (winner) {
      setSession({
        ...newState,
        status: 'ended',
        winner,
      });
      return;
    }

    // 进入下一轮夜晚
    // 重置所有玩家的 wasProtected 状态
    newState = {
      ...newState,
      players: newState.players.map(p => ({ ...p, wasProtected: false })),
    };
    newState = startNextRound(newState);
    setSession(newState);
    setCurrentSpeakerIndex(0);
    setCurrentStreamingContent('');
  }

  // 重置游戏
  const resetGame = useCallback(() => {
    abortControllerRef.current?.abort();
    setSession(null);
    setVotes([]);
    setVotingResults({});
    setError(null);
    setCurrentStreamingContent('');
    setCurrentSpeakerIndex(0);
    setIsLoading(false);
  }, []);

  // 停止生成
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setCurrentStreamingContent('');
  }, []);

  return {
    session,
    players,
    isLoading,
    error,
    currentStreamingContent,
    currentMessageType,
    votes,
    votingResults,
    currentSpeakerIndex,
    addPlayer,
    updatePlayer,
    removePlayer,
    initGame,
    startGame,
    nextAction,
    resetGame,
    stopGeneration,
  };
}
