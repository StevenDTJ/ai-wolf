// 狼人杀游戏引擎 - 内部类型
import { WolfPlayer, WolfMessage, WolfVote, WolfGameStatus } from '@/types';

// 游戏状态
export interface WolfGameState {
  id: string;
  players: WolfPlayer[];
  currentRound: number;
  status: WolfGameStatus;
  winner?: 'good' | 'evil';
  eliminatedPlayerId?: string;
  nightAction: WolfNightAction;
  messages: WolfMessage[];
  votes: WolfVote[];
  votingResults: Record<string, number>;
  // 狼人密聊
  wolfChatMessages: WolfMessage[];
  currentWolfChatPlayerIndex: number;
  // 守卫
  lastProtectedId: string | null;
  // 预言家
  seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
}

// 夜晚行动结果
export interface WolfNightAction {
  protectedId: string | null;
  checkedId: string | null;
  checkResult: 'good' | 'evil' | null;
  killedId: string | null;
  healedId: string | null;
}

// 投票结果
export interface WolfVoteResult {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
}

// 夜晚上下文
export interface NightContext {
  currentRound: number;
  players: WolfPlayer[];
  alivePlayers: WolfPlayer[];
  wolfPlayers: WolfPlayer[];
  nightAction: WolfNightAction;
  seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
  lastProtectedId: string | null;
}

// 白天发言上下文
export interface DaySpeechContext {
  currentRound: number;
  players: WolfPlayer[];
  alivePlayers: WolfPlayer[];
  nightAction: WolfNightAction;
  seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
  previousSpeeches: WolfMessage[];
}
