/**
 * AI Debate Arena - TypeScript Type Definitions
 */

// Debate stance types
export type Stance = 'pro' | 'con' | 'judge';

// 8-Person Debate Types
export type DebaterRole = 'first' | 'second' | 'third' | 'fourth';
export type TeamSide = 'pro' | 'con' | 'judge';
export type SpeechType = 'opening' | 'argumentation' | 'cross_examination' | 'rebuttal' | 'closing' | 'summary' | 'audience_question';
export type StagePhase = 'opening' | 'argumentation' | 'audience_qa' | 'rebuttal' | 'free_debate' | 'closing' | '';

// Debater interface for 8-person format
export interface Debater {
  id: string;
  name: string;
  role: DebaterRole;
  team: TeamSide;
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  thinkingMode?: boolean; // 是否开启思考模式
}

// Debate team
export interface DebateTeam {
  side: TeamSide;
  debaters: Debater[];
}

// Single debate stage
export interface DebateStage {
  id: number;
  phase: StagePhase;
  phaseLabel: string;
  speakerTeam: TeamSide;
  speakerRole?: DebaterRole;
  speechType: SpeechType;
  speechTypeLabel: string;
  duration?: number;
  description: string;
  // 攻辩环节特殊字段
  isCrossExamination?: boolean;
  targetRole?: DebaterRole; // 攻辩目标角色
  // 观众提问环节特殊字段
  targetTeam?: TeamSide; // 被提问的队伍
}

// 攻辩消息类型
export type CrossExamMessageType = 'attack' | 'defend' | 'followup';

// 攻辩消息组
export interface CrossExamGroup {
  id: string;
  stageId: number;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  messages: CrossExamMessage[];
  round: number;
  maxRounds: number;
}

// 攻辩消息
export interface CrossExamMessage {
  id: string;
  type: CrossExamMessageType;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

// Agent configuration
export interface AgentConfig {
  id: string;
  name: string;
  stance: Stance;
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  thinkingMode?: boolean;
}

// Single debate message (extended with stage info)
export interface DebateMessage {
  id: string;
  agentId: string;
  agentName: string;
  stance: Stance;
  content: string;
  timestamp: number;
  stageId?: number;
  speechType?: SpeechType;
  role?: DebaterRole;
  // 时间追踪
  startTime?: number;
  endTime?: number;
}

// Debate session state
export interface DebateSession {
  topic: string;
  agents: AgentConfig[];
  messages: DebateMessage[];
  isRunning: boolean;
  currentTurn: number;
  currentAgentIndex: number;
  // 2人制辩论专用：追踪各方发言次数
  proTurns?: number;  // 正方发言轮数
  conTurns?: number;  // 反方发言轮数
  maxTurnsPerSide?: number; // 每方最大发言轮数，默认10
}

// Application global state
export interface AppState {
  agents: AgentConfig[];
  session: DebateSession | null;
}

// API configuration for storage
export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

// Streaming response chunk
export interface StreamChunk {
  content: string;
  done: boolean;
}

// Debate round info
export interface DebateRound {
  roundNumber: number;
  agentIndex: number;
  agentId: string;
  agentName: string;
}

// UI State
export interface UIState {
  isAgentFormOpen: boolean;
  editingAgent: AgentConfig | null;
  isSettingsOpen: boolean;
}

// Stance display info
export const STANCE_INFO: Record<Stance, { label: string; color: string; bgColor: string }> = {
  pro: {
    label: '正方',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
  },
  con: {
    label: '反方',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
  },
  judge: {
    label: '裁判',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
};

// Default prompts
export const DEFAULT_SYSTEM_PROMPTS: Record<Stance, string> = {
  pro: `你是一位专业的辩论选手，持有正方立场。请用逻辑严密、论据充分的方式表达你的观点。

要求：
1. 保持理性、专业、说服力强
2. 用数据和事实支撑你的观点
3. 适当反驳对方观点
4. 发言控制在200-400字之间`,

  con: `你是一位专业的辩论选手，持有反方立场。请用逻辑严密、论据充分的方式表达你的观点。

要求：
1. 保持理性、专业、说服力强
2. 用数据和事实支撑你的观点
3. 适当反驳对方观点
4. 发言控制在200-400字之间`,

  judge: `你是一位公正的裁判，需要对辩论进行客观点评。

要求：
1. 公平对待双方观点
2. 指出双方的优缺点
3. 给出专业的评价和建议
4. 发言控制在150-300字之间`,
};

// Default models
export const DEFAULT_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'qwen3.5-plus',
  'qwen-turbo',
  'deepseek-chat',
  'deepseek-reasoner',
];

// 8-Person Debate Flow (15 stages)
export const DEBATE_FLOW: DebateStage[] = [
  // 阶段1-4: 开篇立论 (每方4人)
  { id: 1, phase: 'opening', phaseLabel: '开篇立论', speakerTeam: 'pro', speakerRole: 'first', speechType: 'opening', speechTypeLabel: '正方一辩开篇立论', description: '陈述正方核心观点和论证框架' },
  { id: 2, phase: 'opening', phaseLabel: '开篇立论', speakerTeam: 'con', speakerRole: 'first', speechType: 'opening', speechTypeLabel: '反方一辩开篇立论', description: '陈述反方核心观点和论证框架' },
  { id: 3, phase: 'opening', phaseLabel: '开篇立论', speakerTeam: 'pro', speakerRole: 'second', speechType: 'argumentation', speechTypeLabel: '正方二辩补充立论', description: '补充正方论证细节' },
  { id: 4, phase: 'opening', phaseLabel: '开篇立论', speakerTeam: 'con', speakerRole: 'second', speechType: 'argumentation', speechTypeLabel: '反方二辩补充立论', description: '补充反方论证细节' },
  // 阶段5-8: 攻辩环节
  { id: 5, phase: 'argumentation', phaseLabel: '攻辩环节', speakerTeam: 'pro', speakerRole: 'third', speechType: 'argumentation', speechTypeLabel: '正方三辩提问', description: '向反方提出质询问题' },
  { id: 6, phase: 'argumentation', phaseLabel: '攻辩环节', speakerTeam: 'con', speakerRole: 'third', speechType: 'argumentation', speechTypeLabel: '反方三辩提问', description: '向正方提出质询问题' },
  { id: 7, phase: 'argumentation', phaseLabel: '攻辩环节', speakerTeam: 'pro', speakerRole: 'fourth', speechType: 'argumentation', speechTypeLabel: '正方四辩攻辩小结', description: '总结攻辩环节的优势' },
  { id: 8, phase: 'argumentation', phaseLabel: '攻辩环节', speakerTeam: 'con', speakerRole: 'fourth', speechType: 'argumentation', speechTypeLabel: '反方四辩攻辩小结', description: '总结攻辩环节的优势' },
  // 阶段9: 自由辩论
  { id: 9, phase: 'free_debate', phaseLabel: '自由辩论', speakerTeam: 'pro', speechType: 'rebuttal', speechTypeLabel: '正方自由辩论', description: '正方四辩依次发言' },
  // 阶段10-13: 观众提问
  { id: 10, phase: 'audience_qa', phaseLabel: '观众提问', speakerTeam: 'pro', speechType: 'audience_question', speechTypeLabel: '观众向正方提问', description: '观众向正方提出问题', targetTeam: 'pro' },
  { id: 11, phase: 'audience_qa', phaseLabel: '观众提问', speakerTeam: 'con', speechType: 'audience_question', speechTypeLabel: '观众向反方提问', description: '观众向反方提出问题', targetTeam: 'con' },
  { id: 12, phase: 'audience_qa', phaseLabel: '观众提问', speakerTeam: 'pro', speechType: 'audience_question', speechTypeLabel: '观众向正方提问', description: '观众向正方提出问题', targetTeam: 'pro' },
  { id: 13, phase: 'audience_qa', phaseLabel: '观众提问', speakerTeam: 'con', speechType: 'audience_question', speechTypeLabel: '观众向反方提问', description: '观众向反方提出问题', targetTeam: 'con' },
  // 阶段13-14: 总结陈词
  { id: 14, phase: 'closing', phaseLabel: '总结陈词', speakerTeam: 'pro', speakerRole: 'fourth', speechType: 'closing', speechTypeLabel: '正方四辩总结陈词', description: '正方总结核心观点' },
  { id: 15, phase: 'closing', phaseLabel: '总结陈词', speakerTeam: 'con', speakerRole: 'fourth', speechType: 'closing', speechTypeLabel: '反方四辩总结陈词', description: '反方总结核心观点' },
  // 阶段15: 裁判点评
  { id: 16, phase: 'closing', phaseLabel: '裁判点评', speakerTeam: 'judge', speechType: 'summary', speechTypeLabel: '裁判总结点评', description: '裁判对整场辩论进行点评' },
];

// Role-specific prompts for 8-person debate
export const DEBATER_PROMPTS: Record<DebaterRole, { pro: string; con: string; judge: string }> = {
  first: {
    pro: `你是正方一辩，开篇立论是你的主要任务。请用严密的逻辑和充分的论据阐述正方核心观点。

要求：
1. 开篇明义，阐明正方立场
2. 提出2-3个核心论点
3. 用事实或数据支撑论点
4. 为后续队友留下论证空间
5. 发言控制在300-400字`,
    con: `你是反方一辩，开篇立论是你的主要任务。请用严密的逻辑和充分的论据阐述反方核心观点。

要求：
1. 开篇明义，阐明反方立场
2. 提出2-3个核心论点
3. 用事实或数据支撑论点
4. 为后续队友留下论证空间
5. 发言控制在300-400字`,
    judge: `你是裁判，需要公正点评。

要求：
1. 公平对待双方观点
2. 指出双方的优缺点
3. 给出专业的评价和建议
4. 发言控制在150-300字`,
  },
  second: {
    pro: `你是正方二辩，补充立论是你的主要任务。请在一辩的基础上进一步深化论证。

要求：
1. 补充一辩的核心论点
2. 回应可能的质疑
3. 用新的论据加强论证
4. 与队友论证形成呼应
5. 发言控制在250-350字`,
    con: `你是反方二辩，补充立论是你的主要任务。请在一辩的基础上进一步深化论证。

要求：
1. 补充一辩的核心论点
2. 回应可能的质疑
3. 用新的论据加强论证
4. 与队友论证形成呼应
5. 发言控制在250-350字`,
    judge: `你是裁判，需要公正点评。

要求：
1. 公平对待双方观点
2. 指出双方的优缺点
3. 给出专业的评价和建议
4. 发言控制在150-300字`,
  },
  third: {
    pro: `你是正方三辩，攻辩环节是你的舞台。请向反方提出尖锐的质询问题。

要求：
1. 找出反方论证的漏洞
2. 提出让对方难以回答的问题
3. 预设陷阱，引导对方犯错
4. 保持攻击性但不失风度
5. 发言控制在200-300字`,
    con: `你是反方三辩，攻辩环节是你的舞台。请向正方提出尖锐的质询问题。

要求：
1. 找出正方论证的漏洞
2. 提出让对方难以回答的问题
3. 预设陷阱，引导对方犯错
4. 保持攻击性但不失风度
5. 发言控制在200-300字`,
    judge: `你是裁判，需要公正点评。

要求：
1. 公平对待双方观点
2. 指出双方的优缺点
3. 给出专业的评价和建议
4. 发言控制在150-300字`,
  },
  fourth: {
    pro: `你是正方四辩，多重角色：攻辩小结、自由辩论、总结陈词。

作为攻辩小结，请总结正方在攻辩环节的优势。

作为自由辩论，请积极发言反击对手。

作为总结陈词，请：
1. 总结正方核心论点
2. 指出反方论证的致命缺陷
3. 升华主题，彰显正方价值
4. 发言控制在300-500字`,
    con: `你是反方四辩，多重角色：攻辩小结、自由辩论、总结陈词。

作为攻辩小结，请总结反方在攻辩环节的优势。

作为自由辩论，请积极发言反击对手。

作为总结陈词，请：
1. 总结反方核心论点
2. 指出正方论证的致命缺陷
3. 升华主题，彰显反方价值
4. 发言控制在300-500字`,
    judge: `你是裁判，需要做最终点评。

要求：
1. 公平对待双方观点
2. 总结整场辩论的亮点
3. 给出最终裁决建议
4. 发言控制在200-400字`,
  },
};

// 自由辩论消息
export interface FreeDebateMessage {
  id: string;
  round: number;
  team: TeamSide;
  speakerId: string;
  speakerName: string;
  content: string;
  timestamp: number;
}

// 自由辩论状态
export interface FreeDebateState {
  isActive: boolean;
  currentRound: number;
  maxRounds: number; // 每方发言次数，默认4
  currentTeam: TeamSide; // 当前发言方
  messages: FreeDebateMessage[];
  isWaitingForResponse: boolean;
}

// 检查是否是自由辩论环节 (stage 9)
export function isFreeDebateStage(stageId: number): boolean {
  return stageId === 9;
}

// Helper function to get debaters by role
export function getDebaterByRole(debaters: Debater[], role: DebaterRole, team: TeamSide): Debater | undefined {
  return debaters.find((d) => d.role === role && d.team === team);
}

// Helper function to get current speaker from debate flow
export function getCurrentSpeaker(stageId: number, proDebaters: Debater[], conDebaters: Debater[]): Debater | null {
  const stage = DEBATE_FLOW.find((s) => s.id === stageId);
  if (!stage) return null;

  if (stage.speakerTeam === 'judge') return null;

  const debaters = stage.speakerTeam === 'pro' ? proDebaters : conDebaters;
  const role = stage.speakerRole || 'first';

  return debaters.find((d) => d.role === role) || null;
}

// 检查是否是攻辩环节 (stages 5-8)
export function isCrossExaminationStage(stageId: number): boolean {
  return stageId >= 5 && stageId <= 8;
}

// 获取攻辩环节的目标辩手
export function getCrossExamTarget(stageId: number, proDebaters: Debater[], conDebaters: Debater[]): { attacker: Debater; defender: Debater } | null {
  const stage = DEBATE_FLOW.find((s) => s.id === stageId);
  if (!stage || !isCrossExaminationStage(stageId)) return null;

  // 阶段5: 正方三辩攻 -> 反方三辩守
  // 阶段6: 反方三辩攻 -> 正方三辩守
  // 阶段7: 正方四辩小结
  // 阶段8: 反方四辩小结

  const isProAttack = stageId === 5;
  const attacker = isProAttack
    ? proDebaters.find(d => d.role === 'third')
    : conDebaters.find(d => d.role === 'third');
  const defender = isProAttack
    ? conDebaters.find(d => d.role === 'third')
    : proDebaters.find(d => d.role === 'third');

  if (!attacker || !defender) return null;

  return { attacker, defender };
}

// 获取守方辩手（用于攻辩回答）
export function getCrossExamDefender(stageId: number, proDebaters: Debater[], conDebaters: Debater[]): Debater | null {
  const target = getCrossExamTarget(stageId, proDebaters, conDebaters);
  return target?.defender || null;
}

// 检查是否是观众提问环节 (stages 10-13)
export function isAudienceQAStage(stageId: number): boolean {
  return stageId >= 10 && stageId <= 13;
}

// 获取观众提问环节的目标辩手（二辩或三辩）
export function getAudienceQATarget(stageId: number, proDebaters: Debater[], conDebaters: Debater[]): Debater | null {
  if (!isAudienceQAStage(stageId)) return null;

  const stage = DEBATE_FLOW.find((s) => s.id === stageId);
  if (!stage || !stage.targetTeam) return null;

  const targetDebaters = stage.targetTeam === 'pro' ? proDebaters : conDebaters;
  // 优先使用二辩，如果没有二辩则用三辩
  const second = targetDebaters.find(d => d.role === 'second');
  const third = targetDebaters.find(d => d.role === 'third');
  return second || third || targetDebaters[0] || null;
}

// 游戏模式枚举
export enum GameMode {
  DEBATE_2 = 'debate-2',
  DEBATE_8 = 'debate-8',
}

// ============================================
// 狼人杀游戏类型（8人女巫猎人局）
// ============================================

// 狼人杀角色
export type WolfRole = 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter';

// 狼人杀游戏状态
export type WolfGameStatus =
  | 'waiting'           // 等待开始
  | 'night'             // 夜晚
  | 'night_witch'        // 女巫行动
  | 'night_seer'        // 预言家行动
  | 'night_werewolf'    // 狼人行动
  | 'werewolf_chat'     // 狼人密聊中
  | 'day'               // 白天
  | 'day_speech'        // 白天发言中
  | 'voting'            // 投票中
  | 'ended';            // 已结束

// 狼人杀玩家
export interface WolfPlayer {
  id: string;
  name: string;
  playerNumber: number;
  role: WolfRole;
  isAlive: boolean;
  hasWill: boolean;        // 猎人是否有技能
  wasProtected: boolean;   // 当晚是否被守护
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
}

// 狼人杀消息类型
export type WolfMessageType = 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action' | 'final_speech';

// 狼人杀消息
export interface WolfMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  type: WolfMessageType;
  round: number;
  timestamp: number;
}

// 夜晚行动结果
export interface WolfNightAction {
  protectedId: string | null;     // 被守护玩家ID
  checkedId: string | null;        // 被查验玩家ID
  checkResult: 'good' | 'evil' | null;  // 查验结果
  killedId: string | null;         // 被刀玩家ID
  healedId: string | null;         // 被救玩家ID（女巫解药）
}

// 狼人杀投票
export interface WolfVote {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
  round: number;
  timestamp: number;
}

// 狼人杀游戏会话
export interface WolfSession {
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
  // 狼人密聊相关
  wolfChatMessages: WolfMessage[];
  currentWolfChatPlayerIndex: number;
  // 旧守卫字段（当前未使用）
  lastProtectedId: string | null;  // 上一晚被守护的玩家ID
  // 预言家相关
  seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
}

// 观众提问消息类型
export type AudienceQuestionType = 'ai_generated' | 'user_input';

// 观众提问消息
export interface AudienceQuestion {
  id: string;
  stageId: number;
  type: AudienceQuestionType;
  content: string;
  targetTeam: TeamSide;
  answer?: string;
  answerAgentId?: string;
  answerAgentName?: string;
  timestamp: number;
}



