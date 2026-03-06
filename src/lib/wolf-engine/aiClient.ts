// 狼人杀 AI 调用封装
import { WolfPlayer, WolfMessage } from '@/types';
import { NightContext, DaySpeechContext } from './types';
import {
  getSeerPrompt,
  getWitchPrompt,
  getDaySpeechPrompt,
  getWolfChatPrompt,
  getVotePrompt,
  getFinalSpeechPrompt,
} from './prompts';

// ==================== 类型定义 ====================

// 夜晚行动结果
export interface NightActionResult {
  type: 'witch' | 'seer' | 'werewolf_kill' | 'werewolf_chat';
  playerId: string;
  content: string;
  targetId?: string;
  checkResult?: 'good' | 'evil';
  chatMessage?: string;
  killVote?: string;
}

// 白天发言结果（简化为只有发言）
export interface DaySpeechResult {
  speech: string;
}

// 投票结果
export interface VoteDecisionResult {
  innerThought: string;
  targetId: string;
  reason?: string;
}

const PUBLIC_ROLE_SETUP = '村民、狼人、预言家、女巫、猎人';

type StrategyModule = {
  loadStrategyById: (id: string) => {
    wolf: { promptSuffix?: string };
    good: { promptSuffix?: string };
  };
};

type RuntimeModule = {
  getProductionStrategyId: () => string;
};

let cachedStrategyModules: { strategy: StrategyModule; runtime: RuntimeModule } | null = null;

async function loadStrategyModulesInNode(): Promise<{ strategy: StrategyModule; runtime: RuntimeModule } | null> {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (cachedStrategyModules) {
    return cachedStrategyModules;
  }

  try {
    const [strategy, runtime] = await Promise.all([
      import('./strategy/registry') as Promise<StrategyModule>,
      import('./strategy/runtime') as Promise<RuntimeModule>,
    ]);
    cachedStrategyModules = { strategy, runtime };
    return cachedStrategyModules;
  } catch {
    return null;
  }
}

async function resolveSystemPrompt(player: WolfPlayer): Promise<string> {
  const basePrompt = player.systemPrompt;

  try {
    const modules = await loadStrategyModulesInNode();
    if (!modules) {
      return basePrompt;
    }

    const strategy = modules.strategy.loadStrategyById(
      modules.runtime.getProductionStrategyId()
    );
    const suffix = player.role === 'werewolf' ? strategy.wolf.promptSuffix : strategy.good.promptSuffix;
    if (!suffix) {
      return basePrompt;
    }
    return `${basePrompt}\n${suffix}`.trim();
  } catch {
    return basePrompt;
  }
}

// ==================== 辅助函数 ====================

// API URL 处理
function getApiUrl(baseUrl: string, endpoint: string): string {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanUrl}/${cleanEndpoint}`;
}

// 从流式响应提取内容
function extractContentFromResponse(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.choices) && d.choices.length > 0) {
    const choice = d.choices[0] as Record<string, unknown>;
    if (choice.delta && typeof choice.delta === 'object') {
      return ((choice.delta as Record<string, unknown>).content as string) || '';
    }
    if (choice.message && typeof choice.message === 'object') {
      return ((choice.message as Record<string, unknown>).content as string) || '';
    }
  }
  return '';
}

// 调用 AI（非流式）
async function callAI(
  player: WolfPlayer,
  prompt: string,
  temperature: number
): Promise<string> {
  const url = getApiUrl(player.baseUrl, '/chat/completions');

  const body = {
    model: player.model,
    messages: [
      { role: 'system', content: await resolveSystemPrompt(player) },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: 800,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${player.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return extractContentFromResponse(data);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 流式调用 AI
async function callAIStream(
  player: WolfPlayer,
  prompt: string,
  temperature: number,
  onChunk: (content: string) => void
): Promise<string> {
  const url = getApiUrl(player.baseUrl, '/chat/completions');

  const body = {
    model: player.model,
    messages: [
      { role: 'system', content: await resolveSystemPrompt(player) },
      { role: 'user', content: prompt },
    ],
    stream: true,
    temperature,
    max_tokens: 800,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${player.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应');

  const decoder = new TextDecoder();
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim() && l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const content = extractContentFromResponse(parsed);
          if (content) {
            fullContent += content;
            onChunk(fullContent);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  } finally {
    reader.cancel();
  }

  return fullContent;
}

// 解析发言内容（简化版，直接返回发言）
function parseSpeechContent(content: string): DaySpeechResult {
  return {
    speech: content.trim(),
  };
}

// 从文本中提取玩家ID
function extractPlayerId(
  text: string,
  players: WolfPlayer[],
  excludeSelf?: WolfPlayer
): string | null {
  // 1. 尝试匹配 ID 格式
  const idMatch = text.match(/(?:player-|wolf-)?[a-f0-9]{8}/i);
  if (idMatch) {
    const matchedId = idMatch[0].toLowerCase();
    const player = players.find(p => p.id.toLowerCase().includes(matchedId));
    if (player && player.id !== excludeSelf?.id) {
      return player.id;
    }
  }

  // 2. 尝试匹配 "X号" 格式
  const numMatch = text.match(/(\d+)\s*号?/);
  if (numMatch) {
    const playerNum = parseInt(numMatch[1], 10);
    const player = players.find(p => p.playerNumber === playerNum);
    if (player && player.id !== excludeSelf?.id) {
      return player.id;
    }
  }

  // 3. 尝试匹配玩家名称
  for (const player of players) {
    if (text.includes(player.name) && player.id !== excludeSelf?.id) {
      return player.id;
    }
  }

  return null;
}

// ==================== 夜晚行动 AI ====================

// 女巫行动
export async function generateWitchAction(
  witch: WolfPlayer,
  context: NightContext
): Promise<{ decision: 'save' | 'poison' | 'none'; targetId: string | null; reasoning: string }> {
  const alivePlayersStr = context.alivePlayers
    .map(p => `${p.playerNumber}号 ${p.name} (ID: ${p.id})`)
    .join('\n');

  const killedPlayer = context.nightAction.killedId
    ? context.players.find(p => p.id === context.nightAction.killedId)
    : null;

  const prompt = getWitchPrompt(
    { name: witch.name, playerNumber: witch.playerNumber },
    {
      alivePlayers: alivePlayersStr,
      killedPlayer: killedPlayer ? `${killedPlayer.playerNumber}号 ${killedPlayer.name}` : '无人',
      saveUsed: !!context.witchSaveUsed,
      poisonUsed: !!context.witchPoisonUsed,
      night: context.currentRound,
    }
  );

  try {
    const response = await callAI(witch, prompt, 0.7);

    const reasoningMatch = response.match(/理由[：:]\s*(.+?)(?:\n|$)/i);
    const choiceMatch = response.match(/选择[：:]\s*(.+?)(?:\n|$)/i);
    const targetMatch = response.match(/目标[：:]\s*(.+?)(?:\n|$)/i);

    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
    const choiceText = (choiceMatch ? choiceMatch[1] : response).trim();
    const targetText = targetMatch ? targetMatch[1].trim() : '';

    let decision: 'save' | 'poison' | 'none' = 'none';
    if (/救|解药/i.test(choiceText)) {
      decision = 'save';
    } else if (/毒/i.test(choiceText)) {
      decision = 'poison';
    }

    let targetId: string | null = null;
    if (decision === 'save') {
      targetId = context.nightAction.killedId || null;
    } else if (decision === 'poison') {
      targetId = extractPlayerId(targetText || choiceText, context.alivePlayers, witch);
    }

    if (decision === 'save' && (!!context.witchSaveUsed || !context.nightAction.killedId)) {
      decision = 'none';
      targetId = null;
    }

    if (decision === 'poison' && (!!context.witchPoisonUsed || !targetId)) {
      decision = 'none';
      targetId = null;
    }

    return { decision, targetId, reasoning };
  } catch (err) {
    console.error('女巫AI调用失败:', err);
    return { decision: 'none', targetId: null, reasoning: '' };
  }
}
// 预言家验人
export async function generateSeerAction(
  seer: WolfPlayer,
  context: NightContext
): Promise<{ checkedId: string; reasoning: string }> {
  const alivePlayersStr = context.alivePlayers
    .filter(p => p.id !== seer.id)
    .map(p => `${p.playerNumber}号 ${p.name} (ID: ${p.id})`)
    .join('\n');

  const checkHistoryStr = (context.seerChecks ?? [])
    .map(c => `${c.playerName}: ${c.result === 'good' ? '好人' : '狼人'}`)
    .join('\n') || '暂无';

  const prompt = getSeerPrompt(
    { name: seer.name, playerNumber: seer.playerNumber },
    {
      alivePlayers: alivePlayersStr,
      checkHistory: checkHistoryStr,
      night: context.currentRound,
    }
  );

  try {
    const response = await callAI(seer, prompt, 0.7);

    // 解析响应 - 提取理由和选择
    const reasoningMatch = response.match(/理由[：:]\s*(.+?)(?:\n|$)/i);
    const choiceMatch = response.match(/选择[：:]\s*(.+?)(?:\n|$)/i);

    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : response.slice(0, 100);
    const choiceText = choiceMatch ? choiceMatch[1].trim() : response;

    let checkedId = extractPlayerId(choiceText, context.alivePlayers.filter(p => p.id !== seer.id));

    // 默认选择第一个可查验的玩家
    if (!checkedId) {
      const validTargets = context.alivePlayers.filter(p => p.id !== seer.id);
      if (validTargets.length > 0) {
        checkedId = validTargets[0].id;
      }
    }

    const checkedPlayerName = checkedId
      ? context.players.find(p => p.id === checkedId)?.name || '某人'
      : '某人';

    return {
      checkedId: checkedId || '',
      reasoning: reasoning || `查验了 ${checkedPlayerName}`,
    };
  } catch (err) {
    console.error('预言家AI调用失败:', err);
    const validTargets = context.alivePlayers.filter(p => p.id !== seer.id);
    return {
      checkedId: validTargets.length > 0
        ? validTargets[Math.floor(Math.random() * validTargets.length)].id
        : '',
      reasoning: 'AI调用失败，随机选择',
    };
  }
}

// 狼人密聊
export async function generateWerewolfChat(
  werewolf: WolfPlayer,
  context: NightContext
): Promise<{ message: string; killVote: string }> {
  const teammatesStr = context.wolfPlayers
    .filter(w => w.id !== werewolf.id)
    .map(w => `${w.playerNumber}号 ${w.name}`)
    .join('、') || '无（你是唯一存活的狼人）';

  const victimsStr = context.alivePlayers
    .filter(p => !context.wolfPlayers.some(w => w.id === p.id))
    .map(p => `${p.playerNumber}号 ${p.name} (ID: ${p.id})`)
    .join('\n');

  const latestNightBroadcast = [...context.publicInfo.systemBroadcasts]
    .reverse()
    .find(message => message.content.includes('昨夜'));
  const previousWolfKill = (context.privateInfo.wolfKills ?? [])
    .slice()
    .reverse()
    .find(item => item.round === context.currentRound - 1);
  const previousWolfTargetName = previousWolfKill
    ? context.players.find(player => player.id === previousWolfKill.targetId)?.name || '某人'
    : null;
  const nightInfo = latestNightBroadcast?.content
    || (previousWolfTargetName ? `昨夜狼人目标：${previousWolfTargetName}` : '暂无昨夜信息');

  const chatHistoryStr = context.chatHistory || '暂无';

  const prompt = getWolfChatPrompt(
    { name: werewolf.name },
    {
      teammates: teammatesStr,
      alivePlayers: victimsStr,
      nightInfo,
      chatHistory: chatHistoryStr,
      night: context.currentRound,
    }
  );

  try {
    const response = await callAI(werewolf, prompt, 0.9);

    // 从响应中提取刀人目标
    const killVote = extractPlayerId(
      response,
      context.alivePlayers.filter(p => !context.wolfPlayers.some(w => w.id === p.id))
    );

    return {
      message: response.slice(0, 300),
      killVote: killVote || '',
    };
  } catch (err) {
    console.error('狼人密聊AI调用失败:', err);
    const validTargets = context.alivePlayers.filter(
      p => !context.wolfPlayers.some(w => w.id === p.id)
    );
    return {
      message: '我觉得应该刀那个看起来最像神职的',
      killVote: validTargets.length > 0
        ? validTargets[Math.floor(Math.random() * validTargets.length)].id
        : '',
    };
  }
}

// ==================== 白天发言与投票 ====================

// 白天发言（简化版，直接返回发言内容）
export async function generateDaySpeech(
  player: WolfPlayer,
  context: DaySpeechContext
): Promise<DaySpeechResult> {
  const alivePlayersStr = context.alivePlayers
    .map(p => `${p.playerNumber}号 ${p.name}`)
    .join('、');

      const deadIds = [context.nightAction.killedId, context.nightAction.poisonedId]
      .filter((id): id is string => !!id);
    const lastKilled = deadIds.length > 0
      ? deadIds.map(id => context.players.find(p => p.id === id)?.name || '某人').join('、')
      : '无人';
  // 获取狼人队友信息（用于提示词）
  let teammatesStr = '无';
  if (player.role === 'werewolf') {
    const teammates = context.players.filter(p => p.role === 'werewolf' && p.id !== player.id);
    if (teammates.length > 0) {
      teammatesStr = teammates.map(t => t.name).join('、');
    }
  }

  // 为预言家添加查验信息
  let systemPrompt = player.systemPrompt;
  if (player.role === 'seer' && context.nightAction.checkResult) {
    const checkedPlayer = context.players.find(p => p.id === context.nightAction.checkedId);
    systemPrompt += `\n【重要】你昨晚查验了${checkedPlayer?.name || '某人'}，结果是${context.nightAction.checkResult === 'good' ? '好人' : '狼人'}。`;
  }
const prompt = getDaySpeechPrompt(
    { name: player.name, role: player.role, teammates: teammatesStr },
    {
      alivePlayers: alivePlayersStr,
      aliveRoleTypes: PUBLIC_ROLE_SETUP,
      lastKilled,
      round: context.currentRound,
    }
  );

  // 修改玩家对象以使用增强的系统提示词
  const enhancedPlayer = { ...player, systemPrompt };

  try {
    // 使用非流式调用
    const content = await callAI(enhancedPlayer, prompt, 0.9);
    return parseSpeechContent(content);
  } catch (err) {
    console.error('白天发言AI调用失败:', err);
    return {
      speech: `我是${player.name}，我觉得需要好好分析现在的局势。`,
    };
  }
}

// 投票决策
export async function generateVoteDecision(
  player: WolfPlayer,
  context: DaySpeechContext
): Promise<VoteDecisionResult> {
  const alivePlayersStr = context.alivePlayers
    .filter(p => p.id !== player.id)
    .map(p => `${p.playerNumber}号 ${p.name} (ID: ${p.id})`)
    .join('\n');

  const speechesStr = context.previousSpeeches
    .map(m => `${m.playerName}：${m.content.slice(0, 100)}...`)
    .join('\n') || '暂无';

  const prompt = getVotePrompt(
    { name: player.name, role: player.role },
    {
      alivePlayers: alivePlayersStr,
      aliveRoleTypes: PUBLIC_ROLE_SETUP,
      speeches: speechesStr,
    }
  );

  try {
    const response = await callAI(player, prompt, 0.7);

    // 检查是否弃票
    if (/弃票|不确定|再想想|观望/i.test(response)) {
      // 随机选择一个（模拟弃票时的心理）
      const validTargets = context.alivePlayers.filter(p => p.id !== player.id);
      return {
        innerThought: response,
        targetId: validTargets.length > 0
          ? validTargets[Math.floor(Math.random() * validTargets.length)].id
          : '',
        reason: '犹豫后做出的选择',
      };
    }

    const targetId = extractPlayerId(
      response,
      context.alivePlayers.filter(p => p.id !== player.id)
    );

    if (targetId) {
      return {
        innerThought: response,
        targetId,
        reason: '基于分析和判断',
      };
    }

    // 默认随机选择
    const validTargets = context.alivePlayers.filter(p => p.id !== player.id);
    return {
      innerThought: response,
      targetId: validTargets.length > 0
        ? validTargets[Math.floor(Math.random() * validTargets.length)].id
        : '',
      reason: '无法确定目标，随机选择',
    };
  } catch (err) {
    console.error('投票AI调用失败:', err);
    const validTargets = context.alivePlayers.filter(p => p.id !== player.id);
    return {
      innerThought: 'AI调用失败',
      targetId: validTargets.length > 0
        ? validTargets[Math.floor(Math.random() * validTargets.length)].id
        : '',
      reason: '随机选择',
    };
  }
}

// 遗言生成
export async function generateFinalSpeech(
  player: WolfPlayer,
  context: {
    players: WolfPlayer[];
    alivePlayers: WolfPlayer[];
    seerChecks: Array<{ playerId: string; playerName: string; result: 'good' | 'evil' }>;
  }
): Promise<{ speech: string }> {
  const alivePlayersStr = context.alivePlayers
    .map(p => `${p.playerNumber}号 ${p.name}`)
    .join('、');

  const seerChecksStr = context.seerChecks
    .map(c => `${c.playerName}: ${c.result === 'good' ? '好人' : '狼人'}`)
    .join('\n') || '暂无';

  const seerSummary = player.role === 'seer'
    ? `\n预言家查验：${seerChecksStr}`
    : '';
  const gameSituation = `存活玩家：${alivePlayersStr}${seerSummary}`;
  const prompt = getFinalSpeechPrompt(
    { name: player.name, role: player.role },
    { gameSituation }
  );

  try {
    const content = await callAI(player, prompt, 0.8);
    return { speech: content.trim() };
  } catch (err) {
    console.error('遗言AI调用失败:', err);
    return {
      speech: `我是${player.name}，${player.role === 'werewolf' ? '狼人' : '好人'}，希望好人能获胜。`,
    };
  }
}

// ==================== 导出 ====================
export {
  getApiUrl,
  extractContentFromResponse,
  callAI,
  callAIStream,
};


