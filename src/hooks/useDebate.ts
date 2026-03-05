import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentConfig,
  DebateMessage,
  DebateSession,
  Stance,
  DEFAULT_SYSTEM_PROMPTS,
  Debater,
  DebateStage,
  DEBATE_FLOW,
  DebaterRole,
  TeamSide,
  SpeechType,
  isCrossExaminationStage,
  getCrossExamTarget,
  CrossExamGroup,
  CrossExamMessage,
  isAudienceQAStage,
  getAudienceQATarget,
  AudienceQuestion,
  isFreeDebateStage,
} from '@/types';

// Local storage keys
const AGENTS_STORAGE_KEY = 'ai-debate-agents';
const API_CONFIGS_KEY = 'ai-debate-api-configs';
const PRO_DEBATERS_KEY = 'ai-debate-pro-debaters';
const CON_DEBATERS_KEY = 'ai-debate-con-debaters';

// 检查模型是否支持思考模式参数
function supportsThinkingParam(baseUrl: string): boolean {
  return baseUrl.includes('dashscope.aliyuncs.com') ||
         baseUrl.includes('api.deepseek.com');
}

// 检查模型是否为 Anthropic
function isAnthropicModel(baseUrl: string): boolean {
  return baseUrl.includes('api.anthropic.com');
}

// 修复 URL 末尾斜杠问题
function getApiUrl(baseUrl: string, endpoint: string): string {
  // 移除 baseUrl 末尾的斜杠
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  // 如果 baseUrl 不包含 /v1，添加 /v1 前缀（标准 OpenAI 兼容 API 需要）
  let finalBaseUrl = cleanBaseUrl;
  if (!cleanBaseUrl.includes('/v1') && !cleanBaseUrl.includes('/v1/')) {
    finalBaseUrl = `${cleanBaseUrl}/v1`;
  }

  return `${finalBaseUrl}${endpoint}`;
}

// 从不同格式的响应中提取内容
function extractContentFromResponse(parsed: Record<string, unknown>): string | undefined {
  // 标准 OpenAI 格式: choices[0].delta.content
  const choices = parsed.choices as Array<{ delta?: { content?: string }; message?: { content?: string } }> | undefined;
  const deltaContent = choices?.[0]?.delta?.content;
  if (deltaContent) return deltaContent;

  // 非流式响应格式: choices[0].message.content
  const messageContent = choices?.[0]?.message?.content;
  if (messageContent) return messageContent;

  // Gemini 格式: candidates[0].content.parts[0].text
  const candidates = parsed.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
  const parts = candidates?.[0]?.content?.parts;
  if (Array.isArray(parts) && parts[0]?.text) {
    return parts[0].text;
  }

  // 直接 text 字段
  if (parsed.text) return parsed.text as string;

  return undefined;
}

// 构建思考模式参数
function buildThinkingParams(baseUrl: string, thinkingMode: boolean): Record<string, unknown> {
  if (!thinkingMode) return {};

  // Anthropic 使用 thinking 对象
  if (isAnthropicModel(baseUrl)) {
    return {
      thinking: {
        type: 'enabled',
        budget_tokens: 1024,
      },
    };
  }

  // DeepSeek 和阿里云使用 enable_thinking
  if (supportsThinkingParam(baseUrl)) {
    return {
      enable_thinking: true,
    };
  }

  return {};
}

// Load agents from localStorage
export function loadAgentsFromStorage(): AgentConfig[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save agents to localStorage
export function saveAgentsToStorage(agents: AgentConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
}

// Create a new debater for 8-person debate
export function createDefaultDebater(role: DebaterRole, team: TeamSide): Debater {
  return {
    id: uuidv4(),
    name: '',
    role,
    team,
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000,
  };
}

// Load API configs from localStorage
export function loadApiConfigsFromStorage(): { baseUrl: string; apiKey: string }[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(API_CONFIGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save API configs to localStorage
export function saveApiConfigsToStorage(configs: { baseUrl: string; apiKey: string }[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_CONFIGS_KEY, JSON.stringify(configs));
}

// Load 8-person debaters from localStorage
export function loadProDebatersFromStorage(): Debater[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PRO_DEBATERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function loadConDebatersFromStorage(): Debater[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CON_DEBATERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save 8-person debaters to localStorage
export function saveProDebatersToStorage(debaters: Debater[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRO_DEBATERS_KEY, JSON.stringify(debaters));
}

export function saveConDebatersToStorage(debaters: Debater[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CON_DEBATERS_KEY, JSON.stringify(debaters));
}

// Create a new agent with defaults
export function createDefaultAgent(stance: Stance = 'pro'): AgentConfig {
  return {
    id: uuidv4(),
    name: '',
    stance,
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    systemPrompt: DEFAULT_SYSTEM_PROMPTS[stance],
    temperature: 0.7,
    maxTokens: 1000,
  };
}

// Streaming callback type
type StreamingCallback = (content: string, done: boolean) => void;

// Use debate hook
export function useDebate() {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingContent, setCurrentStreamingContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(false);

  // 8-Person Debate State
  const [currentStageId, setCurrentStageId] = useState<number>(1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [stageStartTime, setStageStartTime] = useState<number | null>(null);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [proDebaters, setProDebaters] = useState<Debater[]>([]);
  const [conDebaters, setConDebaters] = useState<Debater[]>([]);

  // 攻辩环节状态
  const [crossExamState, setCrossExamState] = useState<{
    isActive: boolean;
    currentGroup: CrossExamGroup | null;
    attackContent: string; // 攻方的问题
    waitingForDefender: boolean;
  }>({
    isActive: false,
    currentGroup: null,
    attackContent: '',
    waitingForDefender: false,
  });

  // 观众提问环节状态
  const [audienceQAState, setAudienceQAState] = useState<{
    isActive: boolean;
    currentQuestion: AudienceQuestion | null;
    questionSource: 'ai' | 'user';
    waitingForAnswer: boolean;
  }>({
    isActive: false,
    currentQuestion: null,
    questionSource: 'ai',
    waitingForAnswer: false,
  });

  // 自由辩论环节状态
  const [freeDebateState, setFreeDebateState] = useState<{
    isActive: boolean;
    currentRound: number;
    maxRounds: number;
    currentTeam: 'pro' | 'con';
    messages: {
      id: string;
      round: number;
      team: 'pro' | 'con';
      speakerId: string;
      speakerName: string;
      content: string;
      timestamp: number;
    }[];
    isWaitingForResponse: boolean;
  }>({
    isActive: false,
    currentRound: 1,
    maxRounds: 4,
    currentTeam: 'pro',
    messages: [],
    isWaitingForResponse: false,
  });

  // 设置用户输入的观众问题
  const setAudienceQuestion = useCallback((content: string) => {
    if (!audienceQAState.currentQuestion) return;

    setAudienceQAState(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion ? {
        ...prev.currentQuestion,
        content,
        type: 'user_input',
      } : null,
      questionSource: 'user',
    }));
  }, [audienceQAState.currentQuestion]);

  // 提交用户问题并触发回答生成
  const submitUserQuestion = useCallback(async (questionContent: string) => {
    if (!questionContent || !session) return;

    const stage = getCurrentStage();
    if (!stage) return;

    // 获取被提问的辩手
    const target = getAudienceQATarget(stage.id, proDebaters, conDebaters);
    if (!target) {
      setError('未找到被提问的辩手');
      return;
    }

    // 设置为等待回答状态
    setAudienceQAState(prev => ({
      ...prev,
      waitingForAnswer: true,
    }));

    // 直接调用回答生成逻辑
    await processAudienceAnswer(
      {
        id: uuidv4(),
        stageId: stage.id,
        type: 'user_input',
        content: questionContent,
        targetTeam: target.team,
        timestamp: Date.now(),
      },
      target,
      stage
    );
  }, [session, proDebaters, conDebaters]);

  // 开始生成AI问题
  const startGenerateAIQuestion = useCallback(async () => {
    if (!audienceQAState.currentQuestion || !session) return;

    setAudienceQAState(prev => ({
      ...prev,
      questionSource: 'ai',
    }));

    // 触发generateNextStage来生成问题
    await generateNextStage();
  }, [audienceQAState.currentQuestion, session]);

  // 提交回答（用户确认后继续辩论）
  const submitAudienceAnswer = useCallback(async () => {
    // 继续下一阶段
    if (session) {
      const stage = getCurrentStage();
      if (stage && stage.id < DEBATE_FLOW.length) {
        setCurrentStageId(stage.id + 1);
      }
    }
  }, [session]);

  // Start debate
  const startDebate = useCallback((topic: string, agents: AgentConfig[]) => {
    if (agents.length === 0) {
      setError('请至少添加一个辩论智能体');
      return;
    }

    // Filter out agents without API key
    const validAgents = agents.filter((a) => a.apiKey.trim());
    if (validAgents.length === 0) {
      setError('请为至少一个智能体配置 API Key');
      return;
    }

    isRunningRef.current = true;
    setCurrentStreamingContent('');
    setSession({
      topic,
      agents: validAgents,
      messages: [],
      isRunning: true,
      currentTurn: 1,
      currentAgentIndex: 0,
      proTurns: 0,
      conTurns: 0,
      maxTurnsPerSide: 10, // 2人制辩论：每方发言10轮
    });
    setError(null);
  }, []);

  // Pause debate
  const pauseDebate = useCallback(() => {
    isRunningRef.current = false;
    setSession((prev) =>
      prev ? { ...prev, isRunning: false } : null
    );
  }, []);

  // Resume debate
  const resumeDebate = useCallback(() => {
    isRunningRef.current = true;
    setSession((prev) =>
      prev ? { ...prev, isRunning: true } : null
    );
  }, []);

  // Reset debate
  const resetDebate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isRunningRef.current = false;
    setCurrentStreamingContent('');
    setSession(null);
    setIsLoading(false);
    setError(null);
    // Reset 8-person debate state
    setCurrentStageId(1);
    setCompletedStages([]);
    setStageStartTime(null);
    setCurrentSpeakerId(null);
    setProDebaters([]);
    setConDebaters([]);
    // Reset cross-exam state
    setCrossExamState({
      isActive: false,
      currentGroup: null,
      attackContent: '',
      waitingForDefender: false,
    });
    // Reset free debate state
    setFreeDebateState({
      isActive: false,
      currentRound: 1,
      maxRounds: 4,
      currentTeam: 'pro',
      messages: [],
      isWaitingForResponse: false,
    });
    // Reset audience QA state
    setAudienceQAState({
      isActive: false,
      currentQuestion: null,
      waitingForAnswer: false,
      questionSource: 'ai',
    });
  }, []);

  // Stop debate (abort current generation)
  const stopDebate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRunningRef.current = false;
    setCurrentStreamingContent('');
    setIsLoading(false);
    setSession((prev) =>
      prev ? { ...prev, isRunning: false } : null
    );
  }, []);

  // Add message to session
  const addMessage = useCallback((message: DebateMessage) => {
    setSession((prev) => {
      if (!prev) return null;

      const maxTurnsPerSide = prev.maxTurnsPerSide ?? 10;
      const currentProTurns = prev.proTurns ?? 0;
      const currentConTurns = prev.conTurns ?? 0;

      // 计算下一个发言者索引
      let nextAgentIndex = prev.currentAgentIndex;
      let nextProTurns = currentProTurns;
      let nextConTurns = currentConTurns;

      // 获取当前发言者的立场
      const currentAgent = prev.agents[prev.currentAgentIndex];
      const currentStance = message.stance || currentAgent?.stance;

      // 根据发言者立场更新计数
      if (currentStance === 'pro') {
        nextProTurns = currentProTurns + 1;
      } else if (currentStance === 'con') {
        nextConTurns = currentConTurns + 1;
      }

      // 检查是否需要结束辩论（裁判发言后结束）
      if (currentStance === 'judge') {
        // 裁判发言后结束辩论
        return {
          ...prev,
          messages: [...prev.messages, message],
          currentTurn: prev.currentTurn + 1,
          isRunning: false, // 结束辩论
        };
      }

      // 检查辩论是否应该继续
      // 规则：正反方各发言10轮后，裁判发言
      const proDone = nextProTurns >= maxTurnsPerSide;
      const conDone = nextConTurns >= maxTurnsPerSide;

      // 寻找下一个发言者
      // 如果双方都完成了10轮，下一个应该是裁判
      if (proDone && conDone) {
        // 查找裁判的索引（需要同时满足：有裁判、有API Key）
        const judgeIndex = prev.agents.findIndex(a => a.stance === 'judge' && a.apiKey.trim());
        if (judgeIndex !== -1) {
          // 裁判存在且有API Key，让裁判发言
          nextAgentIndex = judgeIndex;
        } else {
          // 没有裁判或裁判没有API Key，结束辩论
          return {
            ...prev,
            messages: [...prev.messages, message],
            currentTurn: prev.currentTurn + 1,
            isRunning: false,
          };
        }
      } else {
        // 轮流发言：先正方后反方
        // 找出下一个应该发言的一方
        const proHasTurnsLeft = nextProTurns < maxTurnsPerSide;
        const conHasTurnsLeft = nextConTurns < maxTurnsPerSide;

        // 当前是正方发言，下一个应该是反方
        if (currentStance === 'pro' && conHasTurnsLeft) {
          const conIndex = prev.agents.findIndex(a => a.stance === 'con');
          if (conIndex !== -1) nextAgentIndex = conIndex;
        }
        // 当前是反方发言，下一个应该是正方
        else if (currentStance === 'con' && proHasTurnsLeft) {
          const proIndex = prev.agents.findIndex(a => a.stance === 'pro');
          if (proIndex !== -1) nextAgentIndex = proIndex;
        }
        // 如果一方已完成10轮但另一方还没有，继续另一方
        else if (proHasTurnsLeft && !conHasTurnsLeft) {
          const proIndex = prev.agents.findIndex(a => a.stance === 'pro');
          if (proIndex !== -1) nextAgentIndex = proIndex;
        }
        else if (conHasTurnsLeft && !proHasTurnsLeft) {
          const conIndex = prev.agents.findIndex(a => a.stance === 'con');
          if (conIndex !== -1) nextAgentIndex = conIndex;
        }
      }

      return {
        ...prev,
        messages: [...prev.messages, message],
        currentTurn: prev.currentTurn + 1,
        currentAgentIndex: nextAgentIndex,
        proTurns: nextProTurns,
        conTurns: nextConTurns,
      };
    });
  }, []);

  // Update streaming content
  const updateStreamingContent = useCallback((content: string) => {
    setCurrentStreamingContent(content);
  }, []);

  // Call AI API with streaming
  const callAI = useCallback(async (
    agent: AgentConfig,
    topic: string,
    history: DebateMessage[],
    onChunk?: StreamingCallback
  ): Promise<string> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build conversation history with better context
    const historyContent = history.length > 0
      ? history.map((m) => `${m.agentName} (${m.stance === 'pro' ? '正方' : m.stance === 'con' ? '反方' : '裁判'}): ${m.content}`).join('\n\n')
      : '';

    const systemPrompt = `${agent.systemPrompt}

当前辩论主题: "${topic}"
${historyContent ? `辩论历史:\n${historyContent}` : ''}

请基于以上背景，发表你的观点。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `辩论主题: "${topic}"\n\n请发表你的观点。`,
      },
    ];

    try {
      // 构建请求体，添加思考模式参数
      const requestBody: Record<string, unknown> = {
        model: agent.model,
        messages,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.maxTokens ?? 1000,
        stream: true,
      };

      // 添加思考模式参数
      const thinkingParams = buildThinkingParams(agent.baseUrl, agent.thinkingMode ?? false);
      Object.assign(requestBody, thinkingParams);

      // 添加调试日志
      const apiUrl = getApiUrl(agent.baseUrl, '/chat/completions');
      console.log('[API Request]', { url: apiUrl, model: agent.model });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          Authorization: `Bearer ${agent.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log('[API Response Status]', response.status, response.statusText);

      if (!response.ok) {
        console.log('[API Error] Response not ok');
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API错误: ${response.status}`;

        // 常见错误处理
        if (response.status === 401) {
          throw new Error('API Key 无效或已过期，请检查配置');
        } else if (response.status === 403) {
          throw new Error('API Key 没有访问权限');
        } else if (response.status === 429) {
          throw new Error('API 请求过于频繁，请稍后再试');
        } else if (response.status === 500) {
          throw new Error('API 服务器错误，请稍后再试');
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        console.log('[API Error] No response body');
        throw new Error('无响应内容');
      }

      console.log('[API Response] Has body, creating reader...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      console.log('[API Response] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 检查是否被中止
        if (controller.signal.aborted) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('[API Raw Chunk]:', chunk.substring(0, 500));
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[API] Received [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(parsed).substring(0, 500));
              const delta = extractContentFromResponse(parsed);
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              if (delta) {
                content += delta;
                onChunk?.(content, false);
              }
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }

      onChunk?.(content, true);
      return content;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  // Generate next turn with streaming
  const generateNextTurn = useCallback(async () => {
    if (!session || !isRunningRef.current) return;

    const agent = session.agents[session.currentAgentIndex];
    setIsLoading(true);
    setError(null);
    setCurrentStreamingContent('');

    try {
      const content = await callAI(
        agent,
        session.topic,
        session.messages,
        (chunk, done) => {
          if (isRunningRef.current || done) {
            setCurrentStreamingContent(chunk);
          }
        }
      );

      // 检查是否仍然在运行
      if (!isRunningRef.current) {
        setCurrentStreamingContent('');
        setIsLoading(false);
        return;
      }

      // 只有在非中止状态下才添加消息
      const message: DebateMessage = {
        id: uuidv4(),
        agentId: agent.id,
        agentName: agent.name || '匿名辩手',
        stance: agent.stance,
        content,
        timestamp: Date.now(),
      };

      addMessage(message);
      setCurrentStreamingContent('');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // 用户中止，不报错
          setCurrentStreamingContent('');
        } else {
          setError(err.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, callAI, addMessage]);

  // Stop generation (abort current API call)
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentStreamingContent('');
    setIsLoading(false);
  }, []);

  // ============================================
  // 8-Person Debate Functions
  // ============================================

  // Get current debate stage
  const getCurrentStage = useCallback((): DebateStage | null => {
    return DEBATE_FLOW.find((s) => s.id === currentStageId) || null;
  }, [currentStageId]);

  // Get current speaker for 8-person debate
  const getCurrentSpeaker = useCallback((): Debater | null => {
    const stage = getCurrentStage();
    if (!stage) return null;
    if (stage.speakerTeam === 'judge') return null;

    const debaters = stage.speakerTeam === 'pro' ? proDebaters : conDebaters;
    const role = stage.speakerRole || 'first';
    return debaters.find((d) => d.role === role) || null;
  }, [getCurrentStage, proDebaters, conDebaters]);

  // Start 8-person debate
  const startEightPersonDebate = useCallback((
    topic: string,
    pro: Debater[],
    con: Debater[]
  ) => {
    // Filter out debaters without API key
    const validPro = pro.filter((d) => d.apiKey.trim());
    const validCon = con.filter((d) => d.apiKey.trim());

    if (validPro.length === 0 || validCon.length === 0) {
      setError('请为正反双方各配置至少一个辩手');
      return;
    }

    isRunningRef.current = true;
    setCurrentStageId(1);
    setCompletedStages([]);
    setStageStartTime(null);
    setCurrentSpeakerId(null);
    setProDebaters(validPro);
    setConDebaters(validCon);
    setCurrentStreamingContent('');

    // Convert debaters to agents for session
    const allDebaters: AgentConfig[] = [
      ...validPro.map((d) => ({
        id: d.id,
        name: d.name,
        stance: d.team as Stance,
        model: d.model,
        baseUrl: d.baseUrl,
        apiKey: d.apiKey,
        systemPrompt: d.systemPrompt,
        temperature: d.temperature,
        maxTokens: d.maxTokens,
      })),
      ...validCon.map((d) => ({
        id: d.id,
        name: d.name,
        stance: d.team as Stance,
        model: d.model,
        baseUrl: d.baseUrl,
        apiKey: d.apiKey,
        systemPrompt: d.systemPrompt,
        temperature: d.temperature,
        maxTokens: d.maxTokens,
      })),
    ];

    setSession({
      topic,
      agents: allDebaters,
      messages: [],
      isRunning: true,
      currentTurn: 1,
      currentAgentIndex: 0,
    });
    setError(null);
  }, []);

  // Call AI for 8-person debate with stage-specific prompts
  const callAIForStage = useCallback(async (
    debaters: Debater[],
    topic: string,
    history: DebateMessage[],
    stage: DebateStage,
    onChunk?: StreamingCallback
  ): Promise<string> => {
    const role = stage.speakerRole || 'first';
    const speaker = debaters.find((d) => d.role === role);
    if (!speaker) {
      throw new Error('未找到当前发言辩手');
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Get role-specific prompt
    const teamSide = stage.speakerTeam as 'pro' | 'con';
    const rolePrompts = {
      first: { pro: DEFAULT_SYSTEM_PROMPTS.pro, con: DEFAULT_SYSTEM_PROMPTS.con },
      second: { pro: DEFAULT_SYSTEM_PROMPTS.pro, con: DEFAULT_SYSTEM_PROMPTS.con },
      third: { pro: DEFAULT_SYSTEM_PROMPTS.pro, con: DEFAULT_SYSTEM_PROMPTS.con },
      fourth: { pro: DEFAULT_SYSTEM_PROMPTS.pro, con: DEFAULT_SYSTEM_PROMPTS.con },
    };
    const basePrompt = rolePrompts[role][teamSide];

    // Build conversation history with stage info
    const historyContent = history.length > 0
      ? history.map((m) => `${m.agentName}: ${m.content}`).join('\n\n')
      : '';

    const systemPrompt = `${speaker.systemPrompt}

当前辩论阶段: ${stage.phaseLabel} - ${stage.speechTypeLabel}
阶段说明: ${stage.description}

当前辩论主题: "${topic}"
${historyContent ? `辩论历史:\n${historyContent}` : ''}

请根据当前阶段要求发表你的发言。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `辩论主题: "${topic}"\n\n当前阶段: ${stage.speechTypeLabel}\n\n请发表你的观点。`,
      },
    ];

    try {
      // 构建请求体，添加思考模式参数
      const requestBody: Record<string, unknown> = {
        model: speaker.model,
        messages,
        temperature: speaker.temperature ?? 0.7,
        max_tokens: speaker.maxTokens ?? 1000,
        stream: true,
      };

      // 添加思考模式参数
      const thinkingParams = buildThinkingParams(speaker.baseUrl, speaker.thinkingMode ?? false);
      Object.assign(requestBody, thinkingParams);

      // 添加调试日志
      const speakerApiUrl = getApiUrl(speaker.baseUrl, '/chat/completions');
      console.log('[API Request]', { url: speakerApiUrl, model: speaker.model });

      const response = await fetch(speakerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          Authorization: `Bearer ${speaker.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API错误: ${response.status}`;

        if (response.status === 401) {
          throw new Error('API Key 无效或已过期，请检查配置');
        } else if (response.status === 403) {
          throw new Error('API Key 没有访问权限');
        } else if (response.status === 429) {
          throw new Error('API 请求过于频繁，请稍后再试');
        } else if (response.status === 500) {
          throw new Error('API 服务器错误，请稍后再试');
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('无响应内容');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      console.log('[API Response] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (controller.signal.aborted) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('[API Raw Chunk]:', chunk.substring(0, 500));
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[API] Received [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(parsed).substring(0, 500));
              const delta = extractContentFromResponse(parsed);
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              if (delta) {
                content += delta;
                onChunk?.(content, false);
              }
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }

      onChunk?.(content, true);
      return content;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  // Generate next turn for 8-person debate
  const generateNextStage = useCallback(async () => {
    if (!session) return;

    const stage = getCurrentStage();
    if (!stage) return;

    // 自由辩论环节特殊处理
    const isFreeDebate = isFreeDebateStage(stage.id);
    if (isFreeDebate) {
      // 自由辩论不需要检查isRunningRef.current
      await handleFreeDebateStage(stage);
      return;
    }

    // 观众提问环节特殊处理：即使辩论暂停也可以生成问题和回答
    const isAudienceQA = isAudienceQAStage(stage.id);
    if (isAudienceQA) {
      // 确保辩论在运行状态，以便生成问题
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        setSession(prev => prev ? { ...prev, isRunning: true } : null);
      }
      await handleAudienceQAStage(stage);
      return;
    }

    // 其他环节需要检查辩论是否在运行
    if (!isRunningRef.current) return;

    // 检查是否是攻辩环节 (stages 5-8)
    const isCrossExam = isCrossExaminationStage(stage.id);

    // 攻辩环节特殊处理
    if (isCrossExam) {
      // 阶段5: 正方三辩提问
      // 阶段6: 反方三辩提问
      // 阶段7/8: 四辩小结 (普通处理)
      if (stage.id === 7 || stage.id === 8) {
        // 四辩小结 - 普通处理
        await handleNormalStage(stage);
        return;
      }

      // 攻辩环节：阶段5或6
      await handleCrossExaminationStage(stage);
      return;
    }

    // 普通阶段处理
    await handleNormalStage(stage);
  }, [session, proDebaters, conDebaters, getCurrentStage]);

  // 处理普通阶段
  const handleNormalStage = async (stage: DebateStage) => {
    if (!session) return;

    // 设置当前阶段的开始时间和发言者
    const startTime = Date.now();
    if (!stageStartTime) {
      setStageStartTime(startTime);
    }

    // 设置当前发言者
    const speaker = getCurrentSpeaker();
    if (speaker) {
      setCurrentSpeakerId(speaker.id);
    }

    setIsLoading(true);
    setError(null);
    setCurrentStreamingContent('');

    try {
      const debaters = stage.speakerTeam === 'pro' ? proDebaters : conDebaters;

      const content = await callAIForStage(
        debaters,
        session.topic,
        session.messages,
        stage,
        (chunk, done) => {
          if (isRunningRef.current || done) {
            setCurrentStreamingContent(chunk);
          }
        }
      );

      const endTime = Date.now();

      if (!isRunningRef.current) {
        setCurrentStreamingContent('');
        setIsLoading(false);
        return;
      }

      const currentSpeaker = getCurrentSpeaker();
      const message: DebateMessage = {
        id: uuidv4(),
        agentId: currentSpeaker?.id || 'unknown',
        agentName: currentSpeaker?.name || '匿名辩手',
        stance: stage.speakerTeam as Stance,
        content,
        timestamp: Date.now(),
        stageId: stage.id,
        speechType: stage.speechType,
        role: stage.speakerRole,
        startTime,
        endTime,
      };

      addMessage(message);

      // 标记当前阶段为已完成
      if (!completedStages.includes(stage.id)) {
        setCompletedStages(prev => [...prev, stage.id]);
      }

      // 重置当前发言者
      setCurrentSpeakerId(null);

      // Move to next stage
      if (stage.id < DEBATE_FLOW.length) {
        setCurrentStageId(stage.id + 1);
        setStageStartTime(null); // 重置下一阶段的开始时间
      } else {
        // Debate finished
        isRunningRef.current = false;
        setSession((prev) => prev ? { ...prev, isRunning: false } : null);
      }

      setCurrentStreamingContent('');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setCurrentStreamingContent('');
        } else {
          setError(err.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理攻辩环节
  const handleCrossExaminationStage = async (stage: DebateStage) => {
    if (!session) return;

    const target = getCrossExamTarget(stage.id, proDebaters, conDebaters);
    if (!target) {
      setError('未找到攻辩辩手');
      setIsLoading(false);
      return;
    }

    const { attacker, defender } = target;
    const maxRounds = 2;

    // 初始化攻辩状态
    const groupId = uuidv4();
    const crossExamGroup: CrossExamGroup = {
      id: groupId,
      stageId: stage.id,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      messages: [],
      round: 1,
      maxRounds,
    };

    setCrossExamState({
      isActive: true,
      currentGroup: crossExamGroup,
      attackContent: '',
      waitingForDefender: false,
    });

    setIsLoading(true);
    setError(null);

    try {
      // 第一轮：攻方提问
      await processAttackRound(
        attacker,
        defender,
        session.topic,
        session.messages,
        stage,
        crossExamGroup
      );

      // 如果辩论已停止，退出
      if (!isRunningRef.current) {
        setIsLoading(false);
        return;
      }

      // 守方回答
      await processDefendRound(
        attacker,
        defender,
        session.topic,
        session.messages,
        stage,
        crossExamGroup
      );

      // 可以选择继续追问 (最多2轮)
      // 这里简化处理：直接进入下一阶段
      // 如果需要追问功能，可以添加UI按钮让用户选择

      // 完成该阶段，添加到会话消息
      if (crossExamGroup.messages.length > 0) {
        const combinedContent = crossExamGroup.messages
          .map(m => `${m.senderName}: ${m.content}`)
          .join('\n\n');

        const message: DebateMessage = {
          id: uuidv4(),
          agentId: attacker.id,
          agentName: `${attacker.name} vs ${defender.name}`,
          stance: stage.speakerTeam as Stance,
          content: combinedContent,
          timestamp: Date.now(),
          stageId: stage.id,
          speechType: stage.speechType,
          role: stage.speakerRole,
        };

        addMessage(message);
      }

      // 重置攻辩状态
      setCrossExamState({
        isActive: false,
        currentGroup: null,
        attackContent: '',
        waitingForDefender: false,
      });

      // Move to next stage
      if (stage.id < DEBATE_FLOW.length) {
        setCurrentStageId(stage.id + 1);
      } else {
        isRunningRef.current = false;
        setSession((prev) => prev ? { ...prev, isRunning: false } : null);
      }

    } catch (err) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      }
      // 重置状态
      setCrossExamState({
        isActive: false,
        currentGroup: null,
        attackContent: '',
        waitingForDefender: false,
      });
    } finally {
      setIsLoading(false);
      setCurrentStreamingContent('');
    }
  };

  // 处理观众提问环节 (stages 10-13)
  const handleAudienceQAStage = async (stage: DebateStage) => {
    if (!session) return;

    const target = getAudienceQATarget(stage.id, proDebaters, conDebaters);
    if (!target) {
      setError('未找到被提问的辩手');
      setIsLoading(false);
      return;
    }

    const targetTeam = stage.targetTeam || stage.speakerTeam;

    // 检查是否已有观众问题（用户可能已输入）
    const existingQuestion = audienceQAState.currentQuestion;

    if (!existingQuestion) {
      // 需要生成问题 - 暂停辩论等待问题输入
      // 这里先创建一个空的问题对象，触发UI让用户输入或AI生成
      const question: AudienceQuestion = {
        id: uuidv4(),
        stageId: stage.id,
        type: 'ai_generated', // 默认AI生成
        content: '',
        targetTeam,
        timestamp: Date.now(),
      };

      setAudienceQAState({
        isActive: true,
        currentQuestion: question,
        questionSource: 'ai',
        waitingForAnswer: false,
      });

      // 设置为暂停状态，等待问题生成/输入
      setIsLoading(false);
      return;
    }

    // 已有问题，等待回答
    if (!existingQuestion.content) {
      // 问题内容为空，需要生成
      setIsLoading(true);
      setError(null);
      setCurrentStreamingContent('');

      try {
        // 调用AI生成观众问题
        const questionContent = await generateAudienceQuestion(
          session.topic,
          targetTeam,
          session.messages,
          (chunk, done) => {
            // 观众提问环节即使辩论暂停也允许生成问题
            setCurrentStreamingContent(chunk);
          }
        );

        // 无论辩论是否暂停，都继续处理生成的问题
        setCurrentStreamingContent('');
        const updatedQuestion = { ...existingQuestion, content: questionContent };

        // 等待回答
        setAudienceQAState({
          isActive: true,
          currentQuestion: updatedQuestion,
          questionSource: audienceQAState.questionSource,
          waitingForAnswer: true,
        });

        setCurrentStreamingContent('');
        setIsLoading(false);

        // 自动调用被提问方回答
        await processAudienceAnswer(updatedQuestion, target, stage);

      } catch (err) {
        if (err instanceof Error) {
          if (err.name !== 'AbortError') {
            setError(err.message);
          }
        }
        // 重置状态
        setAudienceQAState({
          isActive: false,
          currentQuestion: null,
          questionSource: 'ai',
          waitingForAnswer: false,
        });
      } finally {
        setIsLoading(false);
        setCurrentStreamingContent('');
      }
    } else {
      // 已有问题内容，等待回答
      setAudienceQAState({
        isActive: true,
        currentQuestion: existingQuestion,
        questionSource: audienceQAState.questionSource,
        waitingForAnswer: true,
      });

      setIsLoading(false);

      // 调用被提问方回答
      await processAudienceAnswer(existingQuestion, target, stage);
    }
  };

  // 处理自由辩论环节
  const handleFreeDebateStage = async (stage: DebateStage) => {
    if (!session) return;

    // 初始化自由辩论状态（如果尚未激活）
    if (!freeDebateState.isActive) {
      setFreeDebateState({
        isActive: true,
        currentRound: 1,
        maxRounds: 4,
        currentTeam: 'pro', // 正方先发言
        messages: [],
        isWaitingForResponse: false,
      });
      setIsLoading(false);
      return;
    }

    // 如果正在等待响应，跳过
    if (freeDebateState.isWaitingForResponse) {
      return;
    }
  };

  // 生成自由辩论发言
  const generateFreeDebateSpeech = async () => {
    if (!session || !freeDebateState.isActive || freeDebateState.isWaitingForResponse) return;

    const currentTeam = freeDebateState.currentTeam;
    const debaters = currentTeam === 'pro' ? proDebaters : conDebaters;
    const availableDebaters = debaters.filter(d => d.apiKey.trim());

    if (availableDebaters.length === 0) {
      setError('没有可用的API配置');
      return;
    }

    // 随机选择一名辩手进行自由辩论
    const randomIndex = Math.floor(Math.random() * availableDebaters.length);
    const speaker = availableDebaters[randomIndex];

    // 构建上下文消息：优先使用自由辩论阶段的消息，其次使用其他阶段的消息
    // 使用 freeDebateState.messages 获取本阶段的对话历史
    const freeDebateMessages = freeDebateState.messages;
    const recentMessages = freeDebateMessages.slice(-10).map(m => ({
      role: 'user' as const,
      content: `${m.speakerName}: ${m.content}`,
    }));

    const teamLabel = currentTeam === 'pro' ? '正方' : '反方';
    const prompt = `你是${speaker.name}，代表${teamLabel}立场，正在参加自由辩论环节。

辩题：${session.topic}

你的立场：${teamLabel}

自由辩论要求：
1. 发言要简短有力，针对对方观点进行反驳或补充己方论点
2. 每次发言控制在50-100字
3. 紧扣辩题，逻辑清晰
4. 可以质疑对方论点或强化己方观点

${recentMessages.length > 0 ? `以下是辩论历史：\n${recentMessages.map(m => m.content).join('\n')}` : ''}

请直接输出你的发言内容，不要有开场白或总结。注意：你代表${teamLabel}，请始终保持${teamLabel}的立场！`;

    setFreeDebateState(prev => ({ ...prev, isWaitingForResponse: true }));
    setIsLoading(true);
    setError(null);
    setCurrentStreamingContent('');

    try {
      // 构建请求体，添加思考模式参数
      const requestBody: Record<string, unknown> = {
        model: speaker.model,
        messages: [
          { role: 'system', content: prompt },
        ],
        temperature: speaker.temperature ?? 0.7,
        max_tokens: speaker.maxTokens ?? 300,
        stream: true,
      };

      // 添加思考模式参数
      const thinkingParams = buildThinkingParams(speaker.baseUrl, speaker.thinkingMode ?? false);
      Object.assign(requestBody, thinkingParams);

      const speakerApiUrl = getApiUrl(speaker.baseUrl, '/chat/completions');
      const response = await fetch(speakerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${speaker.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('API响应为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log('[API Raw Chunk]:', chunk.substring(0, 500));
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[API] Received [DONE]');
              setCurrentStreamingContent(content);
              await processFreeDebateResponse(content, speaker);
              return;
            }
            try {
              const json = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(json).substring(0, 500));
              const delta = extractContentFromResponse(json) || '';
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              content += delta;
              setCurrentStreamingContent(content);
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setFreeDebateState(prev => ({ ...prev, isWaitingForResponse: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理自由辩论响应
  const processFreeDebateResponse = async (content: string, speaker: Debater) => {
    if (!content.trim()) {
      // 如果内容为空，视为放弃发言
      await handleFreeDebateSkip();
      return;
    }

    const currentTeam = freeDebateState.currentTeam;
    const currentRound = freeDebateState.currentRound;

    // 添加消息到自由辩论记录
    const newMessage = {
      id: uuidv4(),
      round: currentRound,
      team: currentTeam,
      speakerId: speaker.id,
      speakerName: speaker.name,
      content: content.trim(),
      timestamp: Date.now(),
    };

    // 同时也将消息添加到辩论记录中
    const debateMessage: DebateMessage = {
      id: newMessage.id,
      agentId: speaker.id,
      agentName: speaker.name,
      stance: currentTeam as Stance,
      content: content.trim(),
      timestamp: Date.now(),
      stageId: 9,
      speechType: 'rebuttal',
      role: speaker.role,
    };
    addMessage(debateMessage);

    // 决定下一轮发言方
    let nextTeam: 'pro' | 'con';
    let nextRound = currentRound;

    if (currentTeam === 'pro') {
      nextTeam = 'con';
    } else {
      nextTeam = 'pro';
      nextRound = currentRound + 1;
    }

    // 检查是否结束自由辩论（每方4次，共8次）
    if (nextRound > freeDebateState.maxRounds) {
      // 自由辩论结束，进入下一阶段
      setFreeDebateState(prev => ({
        ...prev,
        isActive: false,
        messages: [...prev.messages, newMessage],
        isWaitingForResponse: false,
      }));

      // 结束加载状态
      setIsLoading(false);
      setCurrentStreamingContent('');

      // 移动到下一阶段
      if (session) {
        setCurrentStageId(10); // 进入观众提问环节
        // 暂停辩论，等待观众提问
        isRunningRef.current = false;
        setSession(prev => prev ? { ...prev, isRunning: false } : null);
      }
      return;
    }

    // 继续自由辩论
    setFreeDebateState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      currentTeam: nextTeam,
      currentRound: nextRound,
      isWaitingForResponse: false,
    }));

    setCurrentStreamingContent('');
  };

  // 跳过/放弃发言
  const handleFreeDebateSkip = async () => {
    const currentTeam = freeDebateState.currentTeam;
    const currentRound = freeDebateState.currentRound;

    // 添加放弃发言的记录
    const skipMessage = {
      id: uuidv4(),
      round: currentRound,
      team: currentTeam,
      speakerId: '',
      speakerName: currentTeam === 'pro' ? '正方' : '反方',
      content: '【放弃发言】',
      timestamp: Date.now(),
    };

    // 决定下一轮
    let nextTeam: 'pro' | 'con';
    let nextRound = currentRound;

    if (currentTeam === 'pro') {
      nextTeam = 'con';
    } else {
      nextTeam = 'pro';
      nextRound = currentRound + 1;
    }

    // 检查是否结束自由辩论（任意一方放弃就算结束）
    if (nextRound > freeDebateState.maxRounds * 2 || freeDebateState.messages.length >= 2) {
      // 自由辩论结束，进入下一阶段
      setFreeDebateState(prev => ({
        ...prev,
        isActive: false,
        messages: [...prev.messages, skipMessage],
        isWaitingForResponse: false,
      }));

      // 结束加载状态
      setIsLoading(false);
      setCurrentStreamingContent('');

      if (session) {
        setCurrentStageId(10); // 进入观众提问环节
        // 暂停辩论，等待观众提问
        isRunningRef.current = false;
        setSession(prev => prev ? { ...prev, isRunning: false } : null);
      }
      return;
    }

    // 继续自由辩论
    setFreeDebateState(prev => ({
      ...prev,
      messages: [...prev.messages, skipMessage],
      currentTeam: nextTeam,
      currentRound: nextRound,
      isWaitingForResponse: false,
    }));
  };

  // 开始下一轮自由辩论
  const startNextFreeDebateRound = async () => {
    await generateFreeDebateSpeech();
  };

  // 生成观众问题（AI生成）
  const generateAudienceQuestion = async (
    topic: string,
    targetTeam: TeamSide,
    history: DebateMessage[],
    onChunk: (content: string, done: boolean) => void
  ): Promise<string> => {
    const teamLabel = targetTeam === 'pro' ? '正方' : '反方';

    // 使用任意可用的debater API
    const allDebaters = [...proDebaters, ...conDebaters];
    const availableDebater = allDebaters.find(d => d.apiKey.trim());
    if (!availableDebater) {
      throw new Error('没有可用的API配置');
    }

    const prompt = `你是观众，正在观看一场辩论赛。辩题是："${topic}"。

请基于辩论内容，提出一个尖锐的、有挑战性的问题来质询${teamLabel}。

要求：
1. 问题要与辩题直接相关
2. 要能挑战${teamLabel}的论点
3. 问题要简洁明了，不超过100字
4. 只需要输出问题，不要有其他内容

`;

    // 构建请求体，添加思考模式参数
    const requestBody: Record<string, unknown> = {
      model: availableDebater.model,
      messages: [
        { role: 'system', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
      stream: true,
    };

    // 添加思考模式参数
    const thinkingParams = buildThinkingParams(availableDebater.baseUrl, availableDebater.thinkingMode ?? false);
    Object.assign(requestBody, thinkingParams);

    const freeDebateApiUrl = getApiUrl(availableDebater.baseUrl, '/chat/completions');
    const response = await fetch(freeDebateApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${availableDebater.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('API响应为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let content = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk(content, true);
              return content;
            }
            try {
              const json = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(json).substring(0, 500));
              const delta = extractContentFromResponse(json) || '';
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              content += delta;
              onChunk(content, false);
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onChunk(content, true);
    return content;
  };

  // 处理被提问方回答
  const processAudienceAnswer = async (
    question: AudienceQuestion,
    target: Debater,
    stage: DebateStage
  ) => {
    if (!session) return;

    // 根据target的team获取对应的debaters数组
    const targetDebaters = target.team === 'pro' ? proDebaters : conDebaters;

    setIsLoading(true);
    setError(null);
    setCurrentStreamingContent('');

    try {
      const answerContent = await callAIForAudienceAnswer(
        targetDebaters,
        session.topic,
        question.content,
        session.messages,
        stage,
        target, // 传入target辩手信息
        (chunk, done) => {
          // 观众提问环节即使辩论暂停也允许显示回答
          setCurrentStreamingContent(chunk);
        }
      );

      // 无论辩论是否暂停，都继续处理回答
      setCurrentStreamingContent('');

      // 添加观众问题和回答作为消息
      const message: DebateMessage = {
        id: uuidv4(),
        agentId: target.id,
        agentName: `观众 → ${target.name}`,
        stance: target.team as Stance,
        content: `【观众提问】${question.content}\n\n【${target.name}回答】${answerContent}`,
        timestamp: Date.now(),
        stageId: stage.id,
        speechType: stage.speechType,
        role: target.role,
      };

      addMessage(message);

      // 重置观众提问状态
      setAudienceQAState({
        isActive: false,
        currentQuestion: null,
        questionSource: 'ai',
        waitingForAnswer: false,
      });

      // Move to next stage
      if (stage.id < DEBATE_FLOW.length) {
        setCurrentStageId(stage.id + 1);
      } else {
        isRunningRef.current = false;
        setSession((prev) => prev ? { ...prev, isRunning: false } : null);
      }

    } catch (err) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      }
      // 重置状态
      setAudienceQAState({
        isActive: false,
        currentQuestion: null,
        questionSource: 'ai',
        waitingForAnswer: false,
      });
    } finally {
      setIsLoading(false);
      setCurrentStreamingContent('');
    }
  };

  // 调用AI回答观众问题
  const callAIForAudienceAnswer = async (
    debaters: Debater[],
    topic: string,
    question: string,
    history: DebateMessage[],
    stage: DebateStage,
    target: Debater,
    onChunk: (content: string, done: boolean) => void
  ): Promise<string> => {
    // 使用传入的target作为回答者（二辩或三辩）
    const responder = target;
    if (!responder) {
      throw new Error('未找到回答者');
    }

    // 根据角色生成合适的prompt
    const roleLabel = {
      first: '一辩',
      second: '二辩',
      third: '三辩',
      fourth: '四辩',
    }[responder.role] || '辩手';

    const prompt = `你是${responder.name}（${roleLabel}），正在参加一场辩论赛。现在是观众提问环节，你需要回答观众提出的问题。

辩题：${topic}

观众提问：${question}

请作为${responder.name}，用专业、简洁的方式回答观众的问题。回答要求：
1. 直接回应问题，不要重复问题
2. 保持自信但谦逊的态度
3. 可以引用之前的论证来支撑回答
4. 回答控制在100-200字
5. 只输出回答内容，不要输出辩论稿或开场白

`;

    // 构建请求体，添加思考模式参数
    const requestBody: Record<string, unknown> = {
      model: responder.model,
      messages: [
        { role: 'system', content: prompt },
      ],
      temperature: responder.temperature ?? 0.7,
      max_tokens: responder.maxTokens ?? 500,
      stream: true,
    };

    // 添加思考模式参数
    const thinkingParams = buildThinkingParams(responder.baseUrl, responder.thinkingMode ?? false);
    Object.assign(requestBody, thinkingParams);

    const audienceApiUrl = getApiUrl(responder.baseUrl, '/chat/completions');
    const response = await fetch(audienceApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${responder.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('API响应为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let content = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log('[API Raw Chunk]:', chunk.substring(0, 500));
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[API] Received [DONE]');
              onChunk(content, true);
              return content;
            }
            try {
              const json = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(json).substring(0, 500));
              const delta = extractContentFromResponse(json) || '';
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              content += delta;
              onChunk(content, false);
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onChunk(content, true);
    return content;
  };

  // 处理攻方提问轮次
  const processAttackRound = async (
    attacker: Debater,
    defender: Debater,
    topic: string,
    history: DebateMessage[],
    stage: DebateStage,
    group: CrossExamGroup
  ) => {
    setCurrentStreamingContent('');

    // 构建攻方系统提示
    const attackPrompt = `你是${attacker.name}，现在是攻辩环节。你需要向${defender.name}提出尖锐的质询问题。

要求：
1. 问题要有针对性和攻击性
2. 找出对方论证的漏洞
3. 预设陷阱，引导对方犯错
4. 问题控制在50-100字
5. 只需要提出问题，不需要长篇大论`;

    const content = await callAIWithCustomPrompt(
      attacker,
      topic,
      history,
      attackPrompt,
      (chunk, done) => {
        if (isRunningRef.current || done) {
          setCurrentStreamingContent(chunk);
        }
      }
    );

    if (!isRunningRef.current) return;

    // 保存攻方问题
    const attackMessage: CrossExamMessage = {
      id: uuidv4(),
      type: 'attack',
      senderId: attacker.id,
      senderName: attacker.name,
      content,
      timestamp: Date.now(),
    };

    group.messages.push(attackMessage);

    // 更新状态
    setCrossExamState(prev => ({
      ...prev,
      attackContent: content,
      waitingForDefender: true,
      currentGroup: group,
    }));

    setCurrentStreamingContent('');
  };

  // 处理守方回答轮次
  const processDefendRound = async (
    attacker: Debater,
    defender: Debater,
    topic: string,
    history: DebateMessage[],
    stage: DebateStage,
    group: CrossExamGroup
  ) => {
    setIsLoading(true);
    setCurrentStreamingContent('');

    // 获取攻方的问题
    const attackQuestion = group.messages
      .filter(m => m.type === 'attack')
      .map(m => m.content)
      .join('\n');

    // 构建守方系统提示
    const defendPrompt = `你是${defender.name}，现在是攻辩环节。${attacker.name}向你提出了以下问题：

"${attackQuestion}"

要求：
1. 冷静回应对方的问题
2. 用逻辑和事实反驳
3. 维护己方立场
4. 回答控制在100-200字`;

    const content = await callAIWithCustomPrompt(
      defender,
      topic,
      history,
      defendPrompt,
      (chunk, done) => {
        if (isRunningRef.current || done) {
          setCurrentStreamingContent(chunk);
        }
      }
    );

    if (!isRunningRef.current) return;

    // 保存守方回答
    const defendMessage: CrossExamMessage = {
      id: uuidv4(),
      type: 'defend',
      senderId: defender.id,
      senderName: defender.name,
      content,
      timestamp: Date.now(),
    };

    group.messages.push(defendMessage);
    group.round = 2;

    setCrossExamState(prev => ({
      ...prev,
      currentGroup: group,
    }));

    setIsLoading(false);
    setCurrentStreamingContent('');
  };

  // 使用自定义提示调用AI
  const callAIWithCustomPrompt = async (
    agent: Debater,
    topic: string,
    history: DebateMessage[],
    customSystemPrompt: string,
    onChunk?: StreamingCallback
  ): Promise<string> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 构建历史
    const historyContent = history.length > 0
      ? history.map((m) => `${m.agentName}: ${m.content}`).join('\n\n')
      : '';

    const systemPrompt = `${customSystemPrompt}

当前辩论主题: "${topic}"
${historyContent ? `辩论历史:\n${historyContent}` : ''}

请根据以上要求发表你的观点。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `辩论主题: "${topic}"\n\n请开始你的发言。`,
      },
    ];

    try {
      // 构建请求体，添加思考模式参数
      const requestBody: Record<string, unknown> = {
        model: agent.model,
        messages,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.maxTokens ?? 1000,
        stream: true,
      };

      // 添加思考模式参数
      const thinkingParams = buildThinkingParams(agent.baseUrl, agent.thinkingMode ?? false);
      Object.assign(requestBody, thinkingParams);

      // 添加调试日志
      const apiUrl = getApiUrl(agent.baseUrl, '/chat/completions');
      console.log('[API Request]', { url: apiUrl, model: agent.model });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          Authorization: `Bearer ${agent.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log('[API Response Status]', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API错误: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('无响应内容');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      console.log('[API Response] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log('[API Raw Chunk]:', chunk.substring(0, 500));
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[API] Received [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('[API Parsed JSON]:', JSON.stringify(parsed).substring(0, 500));
              const delta = extractContentFromResponse(parsed);
              console.log('[API Extracted delta]:', delta ? delta.substring(0, 200) : 'undefined/null');
              if (delta) {
                content += delta;
                onChunk?.(content, false);
              }
            } catch (e) {
              console.log('[API Parse error]:', e);
            }
          }
        }
      }

      onChunk?.(content, true);
      return content;
    } finally {
      abortControllerRef.current = null;
    }
  };

  return {
    session,
    isLoading,
    error,
    currentStreamingContent,
    startDebate,
    pauseDebate,
    resumeDebate,
    resetDebate,
    stopDebate,
    generateNextTurn,
    stopGeneration,
    addMessage,
    updateStreamingContent,
    // 8-person debate exports
    currentStageId,
    completedStages,
    stageStartTime,
    currentSpeakerId,
    setCurrentSpeakerId,
    getCurrentStage,
    getCurrentSpeaker,
    startEightPersonDebate,
    generateNextStage,
    proDebaters,
    conDebaters,
    crossExamState,
    audienceQAState,
    freeDebateState,
    setAudienceQuestion,
    startGenerateAIQuestion,
    submitAudienceAnswer,
    submitUserQuestion,
    startNextFreeDebateRound,
    handleFreeDebateSkip,
  };
}
