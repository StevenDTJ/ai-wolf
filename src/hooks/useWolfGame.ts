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
  startWitchNight,
  startWerewolfChat,
  startDay,
  processSeerCheck,
  processWitchDecision,
  processWerewolfKill,
  eliminatePlayer,
  processVotingResults,
  checkWinCondition,
  startNextRound,
  getAlivePlayers,
  getWolfPlayers,
  getSeer,
  getWitch,
  getInvariantErrors,
} from '@/lib/wolf-engine';
import { buildContext } from '@/lib/wolf-engine/context';
import { handleHunterElimination } from '@/lib/wolf-engine/hunterIntegration';
import { applyHunterAfterWitch } from '@/lib/wolf-engine/hunterFlow';
import { buildNightBroadcast, buildDayVoteBroadcast } from '@/lib/wolf-engine/broadcasts';
import {
  generateWitchAction,
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

// 构建夜晚上下文（公共 + 当前角色所需最小信息）
export function buildNightContext(state: WolfGameState, role: WolfPlayer['role'], phase: 'night' | 'night_seer' | 'night_werewolf' | 'werewolf_chat' | 'night_witch') {
  const base = buildContext(role, state, phase);
  return {
    ...base,
    players: state.players,
    alivePlayers: getAlivePlayers(state),
    wolfPlayers: getWolfPlayers(state),
    nightAction: state.nightAction,
  };
}

// 构建白天上下文（公共 + 当前角色所需最小信息）
export function buildDayContext(state: WolfGameState, role: WolfPlayer['role'], phase: 'day' | 'day_speech' | 'voting') {
  const base = buildContext(role, state, phase);
  return {
    ...base,
    players: state.players,
    alivePlayers: getAlivePlayers(state),
    nightAction: state.nightAction,
    previousSpeeches: state.messages.filter(m =>
      m.type === 'speech' && m.round === state.currentRound
    ),
  };
}

export function resolveWerewolfTargetId(
  message: string,
  killVote: string | null | undefined,
  aliveVictims: WolfPlayer[]
): string | null {
  if (killVote && aliveVictims.some(player => player.id === killVote)) {
    return killVote;
  }

  const killTarget = message.match(/(\d+)号/)?.[1];
  if (!killTarget) {
    return null;
  }

  const targetNumber = parseInt(killTarget, 10);
  const targetPlayer = aliveVictims.find(player => player.playerNumber === targetNumber);
  return targetPlayer?.id || null;
}

export type WolfPhaseTransition = 'to_day' | 'to_night';

export function ensureTransitionStateValid(state: WolfGameState, transition: WolfPhaseTransition): void {
  const errors = getInvariantErrors(state);
  if (errors.length > 0) {
    throw new Error('[' + transition + '] invariant_violation: ' + errors.join(','));
  }
}

// Hook 返回类型
export interface UseWolfGameReturn {
  session: WolfGameState | null;
  players: WolfPlayer[];
  isLoading: boolean;
  error: string | null;
  currentStreamingContent: string;
  currentMessageType: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action';
  votes: WolfVote[];
  votingResults: Record<string, number>;
  currentSpeakerIndex: number;
  pendingTransition: WolfPhaseTransition | null;
  addPlayer: (player: WolfPlayer) => void;
  updatePlayer: (player: WolfPlayer) => void;
  removePlayer: (id: string) => void;
  initGame: () => void;
  startGame: () => void;
  nextAction: () => Promise<void>;
  continueTransition: () => void;
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
  const [currentMessageType, setCurrentMessageType] = useState<'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action'>('speech');

  // 投票相关
  const [votes, setVotes] = useState<WolfVote[]>([]);
  const [votingResults, setVotingResults] = useState<Record<string, number>>({});
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [pendingTransition, setPendingTransition] = useState<WolfPhaseTransition | null>(null);
  const pendingSessionRef = useRef<WolfGameState | null>(null);

  // 取消控制器
  const abortControllerRef = useRef<AbortController | null>(null);

  // 同步 session 到 ref
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const queueTransition = useCallback((nextState: WolfGameState, transition: WolfPhaseTransition) => {
    pendingSessionRef.current = nextState;
    setSession(nextState);
    setPendingTransition(transition);
  }, []);

  const continueTransition = useCallback(() => {
    if (!pendingSessionRef.current) return;
    setSession(pendingSessionRef.current);
    pendingSessionRef.current = null;
    setPendingTransition(null);
  }, []);

  // 保存玩家
  const savePlayers = useCallback((newPlayers: WolfPlayer[]) => {
    setPlayers(newPlayers);
    saveWolfPlayersToStorage(newPlayers);
  }, []);

  // 添加玩家
  const addPlayer = useCallback((player: WolfPlayer) => {
    if (players.length >= 8) return;
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
    if (players.length !== 8) {
      setError('需要8名玩家才能开始游戏');
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
    if (!currentSession || isLoading || pendingTransition) return;

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

        case 'night': {
          setSession(startWerewolfNight(currentSession));
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

        case 'night_witch': {
          await handleWitchNight(currentSession);
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
  }, [isLoading, pendingTransition]);
  function addNightDeathSummary(state: WolfGameState): WolfGameState {
    const msg = buildNightBroadcast(state);
    return {
      ...state,
      messages: [...state.messages, msg],
    };
  }

  async function handleWitchNight(state: WolfGameState) {
    const witch = getWitch(state);

    if (!witch || !witch.isAlive) {
      const nightState = applyHunterAfterWitch(state);
      const dayState = addNightDeathSummary(startDay(nightState));
      queueTransition(dayState, 'to_day');
      return;
    }

    setCurrentMessageType('witch_action');
    setCurrentStreamingContent('女巫正在决策...');

    const context = {
      ...buildNightContext(state, witch.role, 'night_witch'),
      witchSaveUsed: state.witchSaveUsed,
      witchPoisonUsed: state.witchPoisonUsed,
    };
    const result = await generateWitchAction(witch, context);

    let newState = processWitchDecision(state, result.decision, result.targetId);
    ensureTransitionStateValid(newState, 'to_day');

    const killedPlayer = state.nightAction.killedId
      ? state.players.find(p => p.id === state.nightAction.killedId)
      : null;

    const reasoningMsg: WolfMessage = {
      id: uuidv4(),
      playerId: witch.id,
      playerName: witch.name,
      content: result.reasoning || '（女巫正在思考...）',
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    let decisionText = '选择不用药';
    if (result.decision === 'save') {
      decisionText = `使用解药救了 ${killedPlayer?.name || '被刀玩家'}`;
    } else if (result.decision === 'poison') {
      const poisonTarget = result.targetId ? state.players.find(p => p.id === result.targetId) : null;
      decisionText = `使用毒药毒了 ${poisonTarget?.name || '某人'}`;
    }

    const systemMsg: WolfMessage = {
      id: uuidv4(),
      playerId: 'system',
      playerName: '系统',
      content: `【观众视角】今晚被刀：${killedPlayer?.name || '无人'}；女巫${decisionText}`,
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    newState = {
      ...newState,
      messages: [...newState.messages, reasoningMsg, systemMsg],
    };

    newState = startSeerNight(newState);

    setSession(newState);
    setCurrentStreamingContent('');
  }

  async function handleSeerNight(state: WolfGameState) {
    const seer = getSeer(state);

    if (!seer || !seer.isAlive) {
      const nightState = applyHunterAfterWitch(state);
      const dayState = addNightDeathSummary(startDay(nightState));
      queueTransition(dayState, 'to_day');
      return;
    }

    setCurrentMessageType('seer_action');
    setCurrentStreamingContent('预言家正在选择查验目标...');

    const context = {
      ...buildNightContext(state, seer.role, 'night_seer'),
      seerChecks: state.seerChecks,
    };
    const result = await generateSeerAction(seer, context);

    const checkedPlayer = state.players.find(p => p.id === result.checkedId);
    const isWolf = checkedPlayer?.role === 'werewolf';

    let newState = processSeerCheck(state, result.checkedId, isWolf);

    const seerReasonMsg: WolfMessage = {
      id: uuidv4(),
      playerId: seer.id,
      playerName: seer.name,
      content: result.reasoning || '（预言家正在思考...）',
      type: 'inner_thought',
      round: state.currentRound,
      timestamp: Date.now(),
    };

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

    newState = applyHunterAfterWitch(newState);
    newState = addNightDeathSummary(startDay(newState));

    queueTransition(newState, 'to_day');
    setCurrentStreamingContent('');
  }

  async function handleWerewolfChat(state: WolfGameState) {
    const wolves = getWolfPlayers(state);
    const context = buildNightContext(state, 'werewolf', 'werewolf_chat');

    const MAX_CHAT_ROUNDS = 2;
    const chatMessages: WolfMessage[] = [];
    const allKillVotes: Array<{ playerId: string; targetId: string | null }> = [];
    const aliveVictims = getAlivePlayers(state).filter(player => !wolves.some(wolfPlayer => wolfPlayer.id === player.id));

    for (let round = 0; round < MAX_CHAT_ROUNDS; round++) {
      for (const wolf of wolves) {
        const chatHistoryStr = chatMessages
          .map(m => `${m.playerName}：${m.content.slice(0, 100)}`)
          .join('\n');

        const wolfContext = {
          ...context,
          chatHistory: chatHistoryStr || '暂无',
        };

        setCurrentMessageType('wolf_chat');
        setCurrentStreamingContent(`${wolf.name}正在密聊...（第${round + 1}轮）`);

        const result = await generateWerewolfChat(wolf, wolfContext);

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

        const targetId = resolveWerewolfTargetId(result.message, result.killVote, aliveVictims);

        allKillVotes.push({ playerId: wolf.id, targetId });
      }

      const currentRoundVotes = allKillVotes.slice(-wolves.length);
      const voteTargets = currentRoundVotes
        .map(v => v.targetId)
        .filter((v): v is string => v !== null);

      const voteCount: Record<string, number> = {};
      voteTargets.forEach(t => {
        voteCount[t] = (voteCount[t] || 0) + 1;
      });

      const totalWolves = wolves.length;
      const hasConsensus = Object.values(voteCount).some(count => count > totalWolves / 2);

      if (hasConsensus || round === MAX_CHAT_ROUNDS - 1) {
        break;
      }

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

    const voteCount: Record<string, number> = {};
    allKillVotes.forEach(v => {
      if (v.targetId) {
        voteCount[v.targetId] = (voteCount[v.targetId] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let killTargetId: string | null = null;
    for (const [targetId, count] of Object.entries(voteCount)) {
      if (count > maxVotes) {
        maxVotes = count;
        killTargetId = targetId;
      }
    }

    if (!killTargetId && aliveVictims.length > 0) {
      killTargetId = aliveVictims[Math.floor(Math.random() * aliveVictims.length)].id;
    }

    let newState = processWerewolfKill(state, killTargetId);
    ensureTransitionStateValid(newState, 'to_day');

    newState = {
      ...newState,
      wolfChatMessages: chatMessages,
      messages: [...newState.messages, ...chatMessages],
    };

    const intendedVictim = killTargetId ? state.players.find(p => p.id === killTargetId) : null;
    if (intendedVictim) {
      const killMsg: WolfMessage = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: `【观众视角】狼人决定刀 ${intendedVictim.name}`,
        type: 'inner_thought',
        round: state.currentRound,
        timestamp: Date.now(),
      };
      newState = {
        ...newState,
        messages: [...newState.messages, killMsg],
      };
    }

    newState = startWitchNight(newState);

    setSession(newState);
    setCurrentStreamingContent('');
  }

  async function handleDaySpeech(state: WolfGameState) {
    const alivePlayers = getAlivePlayers(state);
    if (alivePlayers.length === 0) return;

    if (currentSpeakerIndex >= alivePlayers.length) {
      setSession({ ...state, status: 'voting' });
      setCurrentSpeakerIndex(0);
      return;
    }

    const speaker = alivePlayers[currentSpeakerIndex];
    setCurrentMessageType('speech');
    setCurrentStreamingContent(`${speaker.name}正在发言...`);

    const context = buildDayContext(state, speaker.role, 'day_speech');
    const result = await generateDaySpeech(speaker, context);

    const msg: WolfMessage = {
      id: uuidv4(),
      playerId: speaker.id,
      playerName: speaker.name,
      content: result.speech,
      type: 'speech',
      round: state.currentRound,
      timestamp: Date.now(),
    };

    const newState = {
      ...state,
      messages: [...state.messages, msg],
      status: 'day_speech',
    };

    setSession(newState);
    setCurrentSpeakerIndex(currentSpeakerIndex + 1);
    setCurrentStreamingContent('');
  }

  async function handleVoting(state: WolfGameState) {
    const alivePlayers = getAlivePlayers(state);


    const voteResults: WolfVote[] = [];
    const voteSummaries: { voterId: string; voterName: string; targetId: string; targetName: string }[] = [];

    for (const voter of alivePlayers) {
      setCurrentMessageType('inner_thought');
      setCurrentStreamingContent(`${voter.name}正在投票...`);

      const context = buildDayContext(state, voter.role, 'voting');

      const decision = await generateVoteDecision(voter, context);
      const target = alivePlayers.find(p => p.id === decision.targetId) || null;

      voteResults.push({
        voterId: voter.id,
        voterName: voter.name,
        targetId: target?.id || '',
        targetName: target?.name || '弃票',
        round: state.currentRound,
        timestamp: Date.now(),
      });

      voteSummaries.push({
        voterId: voter.id,
        voterName: voter.name,
        targetId: target?.id || '',
        targetName: target?.name || '弃票',
      });
    }

    const voteCount: Record<string, number> = {};
    voteResults.forEach(v => {
      if (v.targetId) {
        voteCount[v.targetId] = (voteCount[v.targetId] || 0) + 1;
      }
    });

    setVotes(voteResults);
    setVotingResults(voteCount);

    let newState: WolfGameState = {
      ...state,
      votes: voteResults,
      votingResults: voteCount,
    };

    const voteOutcome = processVotingResults(newState, voteSummaries);

    let resultMsg: WolfMessage;

    if (voteOutcome.eliminatedId) {
      const eliminatedPlayer = newState.players.find(p => p.id === voteOutcome.eliminatedId);
      newState = eliminatePlayer(newState, voteOutcome.eliminatedId);

      // 猎人被淘汰时，先执行击杀
      newState = await handleHunterElimination(newState);

      const baseMessage = `${eliminatedPlayer?.name || '玩家'}被投票出局。`;
      const resultMsg = buildDayVoteBroadcast(newState, baseMessage);

      newState = {
        ...newState,
        messages: [...newState.messages, resultMsg],
      };

      if (eliminatedPlayer) {
        const finalSpeech = await generateFinalSpeech(eliminatedPlayer, {
          players: newState.players,
          alivePlayers: getAlivePlayers(newState),
          seerChecks: eliminatedPlayer.role === 'seer' ? newState.seerChecks : [],
        });
        const finalMsg: WolfMessage = {
          id: uuidv4(),
          playerId: eliminatedPlayer.id,
          playerName: eliminatedPlayer.name,
          content: finalSpeech.speech,
          type: 'final_speech',
          round: state.currentRound,
          timestamp: Date.now(),
        };
        newState = {
          ...newState,
          messages: [...newState.messages, finalMsg],
        };
      }
    } else if (voteOutcome.hasTie) {
      resultMsg = {
        id: uuidv4(),
        playerId: 'system',
        playerName: '系统',
        content: '投票平票，无人出局。',
        type: 'speech',
        round: state.currentRound,
        timestamp: Date.now(),
      };
      newState = {
        ...newState,
        messages: [...newState.messages, resultMsg],
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
      newState = {
        ...newState,
        messages: [...newState.messages, resultMsg],
      };
    }

    const winner = checkWinCondition(newState);
    if (winner) {
      setSession({
        ...newState,
        status: 'ended',
        winner,
      });
      setCurrentStreamingContent('');
      return;
    }

    newState = {
      ...newState,
      players: newState.players.map(p => ({ ...p, wasProtected: false })),
    };
    newState = startNextRound(newState);
    ensureTransitionStateValid(newState, 'to_night');
    queueTransition(newState, 'to_night');
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
    pendingSessionRef.current = null;
    setPendingTransition(null);
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
    pendingTransition,
    addPlayer,
    updatePlayer,
    removePlayer,
    initGame,
    startGame,
    nextAction,
    continueTransition,
    resetGame,
    stopGeneration,
  };
}






