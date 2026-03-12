'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Pause, Play, Send } from 'lucide-react';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { AgentForm } from '@/components/agent-form';
import { MessageBubble } from '@/components/message-bubble';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useDebate,
  createDefaultAgent,
  loadAgentsFromStorage,
  saveAgentsToStorage,
} from '@/hooks/useDebate';
import { AgentConfig, Debater, DebaterRole, DEFAULT_SYSTEM_PROMPTS, Stance } from '@/types';
import {
  getTwoPersonComposerState,
  getTwoPersonFooterActionState,
  getTwoPersonFrameSpec,
  getTwoPersonIdleSpec,
  getTwoPersonTurnsLeftLabel,
  isTwoPersonLaunchEnabled,
  validateTwoPersonTurnLimit,
} from '@/lib/debate-stage-layout';
import {
  EIGHT_PERSON_PHASES,
  getEightPersonComposerState,
  getEightPersonFooterActionState,
  getEightPersonFrameSpec,
  getEightPersonPhaseProgress,
  isEightPersonLaunchEnabled,
  createDefaultEightPersonRoster,
  EightPersonPhase,
  EightPersonRosterItem,
} from '@/lib/debate-8p-layout';

const NEXT_TURN_DELAY_MS = 120;
const EIGHT_PERSON_ROSTER_STORAGE_KEY = 'ai-debate-8person-roster';
const EIGHT_PERSON_JUDGE_STORAGE_KEY = 'ai-debate-8person-judge';
const DEFAULT_EIGHT_PERSON_JUDGE_CONFIG: AgentConfig = {
  id: 'judge-8p-config',
  name: '主裁判',
  stance: 'judge',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.judge,
  temperature: 0.7,
  maxTokens: 1600,
  thinkingMode: false,
};

function loadEightPersonRosterFromStorage(): EightPersonRosterItem[] {
  const defaults = createDefaultEightPersonRoster();
  if (typeof window === 'undefined') {
    return defaults;
  }

  const raw = window.localStorage.getItem(EIGHT_PERSON_ROSTER_STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaults;
    }

    return defaults.map((item) => {
      const saved = parsed.find((entry) => entry?.id === item.id);
      if (!saved || typeof saved !== 'object') {
        return item;
      }
      const savedApiKey = typeof saved.apiKey === 'string' ? saved.apiKey : '';
      return {
        ...item,
        name: typeof saved.name === 'string' && saved.name.trim() ? saved.name : item.name,
        model: typeof saved.model === 'string' && saved.model.trim() ? saved.model : item.model,
        apiKey: savedApiKey,
        baseUrl: typeof saved.baseUrl === 'string' ? saved.baseUrl : item.baseUrl,
        hasApiKey: savedApiKey.trim().length > 0,
      };
    });
  } catch {
    return defaults;
  }
}

function loadEightPersonJudgeFromStorage(): AgentConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_EIGHT_PERSON_JUDGE_CONFIG };
  }

  const raw = window.localStorage.getItem(EIGHT_PERSON_JUDGE_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_EIGHT_PERSON_JUDGE_CONFIG };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_EIGHT_PERSON_JUDGE_CONFIG };
    }
    return {
      ...DEFAULT_EIGHT_PERSON_JUDGE_CONFIG,
      ...parsed,
      id: 'judge-8p-config',
      stance: 'judge',
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.name,
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.model,
      baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
        ? parsed.baseUrl
        : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.baseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      systemPrompt: typeof parsed.systemPrompt === 'string' && parsed.systemPrompt.trim()
        ? parsed.systemPrompt
        : DEFAULT_SYSTEM_PROMPTS.judge,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.temperature,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.maxTokens,
      thinkingMode: typeof parsed.thinkingMode === 'boolean'
        ? parsed.thinkingMode
        : DEFAULT_EIGHT_PERSON_JUDGE_CONFIG.thinkingMode,
    };
  } catch {
    return { ...DEFAULT_EIGHT_PERSON_JUDGE_CONFIG };
  }
}

function ensureTwoPersonAgents(saved: AgentConfig[]): AgentConfig[] {
  const items = [...saved];

  if (!items.some((agent) => agent.stance === 'pro')) {
    items.push({ ...createDefaultAgent('pro'), name: '正方一辩', model: 'gpt-4o-mini' });
  }

  if (!items.some((agent) => agent.stance === 'con')) {
    items.push({ ...createDefaultAgent('con'), name: '反方一辩', model: 'gpt-4o-mini' });
  }

  if (!items.some((agent) => agent.stance === 'judge')) {
    items.push({ ...createDefaultAgent('judge'), name: '裁判', model: 'gpt-4o-mini' });
  }

  return items;
}

export default function Home() {
  type EditingTarget = '2person' | '8person' | '8person-judge';
  const roleByPosition: Record<number, DebaterRole> = {
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
  };
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    const saved = ensureTwoPersonAgents(loadAgentsFromStorage());
    if (saved.length > 0) return saved;
    return ensureTwoPersonAgents([
      { ...createDefaultAgent('pro'), name: '正方一辩', model: 'gpt-4o-mini' },
      { ...createDefaultAgent('con'), name: '反方一辩', model: 'gpt-4o-mini' },
    ]);
  });
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditingTarget>('2person');
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [turnLimitInput, setTurnLimitInput] = useState('20');
  const [turnLimitValue, setTurnLimitValue] = useState(20);
  const [turnLimitError, setTurnLimitError] = useState<string | null>(null);
  const [isEditingTurnLimit, setIsEditingTurnLimit] = useState(false);
  const [debateMode, setDebateMode] = useState<'2person' | '8person'>('2person');
  const [modeTransition, setModeTransition] = useState<'idle' | 'to8' | 'to2'>('idle');
  const [eightPersonRoster, setEightPersonRoster] = useState(() => loadEightPersonRosterFromStorage());
  const [eightPersonJudgeConfig, setEightPersonJudgeConfig] = useState<AgentConfig>(() => loadEightPersonJudgeFromStorage());
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('https://api.openai.com/v1');
  const [defaultApiKey, setDefaultApiKey] = useState('');
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const turnLimitInputRef = useRef<HTMLInputElement | null>(null);
  const modeSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudRafRef = useRef<number | null>(null);

  const debate2p = useDebate();
  const debate8p = useDebate();

  const activeDebate = debateMode === '2person' ? debate2p : debate8p;
  const activeSession = activeDebate.session;
  const activeIsLoading = activeDebate.isLoading;
  const activeError = activeDebate.error;
  const activeStreamingContent = activeDebate.currentStreamingContent;
  const activePausedStreamingMessage = activeDebate.pausedStreamingMessage;
  const displaySession = modeTransition === 'idle' ? activeSession : null;
  const displayStreamingContent = modeTransition === 'idle' ? activeStreamingContent : '';
  const displayIsLoading = modeTransition === 'idle' ? activeIsLoading : false;
  const displayPausedStreamingMessage = modeTransition === 'idle' ? activePausedStreamingMessage : null;

  useEffect(() => {
    if (agents.length > 0) {
      saveAgentsToStorage(agents);
    }
  }, [agents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(EIGHT_PERSON_ROSTER_STORAGE_KEY, JSON.stringify(eightPersonRoster));
  }, [eightPersonRoster]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(EIGHT_PERSON_JUDGE_STORAGE_KEY, JSON.stringify(eightPersonJudgeConfig));
  }, [eightPersonJudgeConfig]);

  useEffect(() => {
    if (activeError) {
      toast.error(activeError);
    }
  }, [activeError]);

  useEffect(() => {
    if (modeTransition !== 'idle') return;
    if (activeSession?.isRunning && !activeIsLoading && !activeStreamingContent && activeSession.agents.length > 0) {
      const timer = setTimeout(() => {
        if (debateMode === '8person') {
          debate8p.generateNextStage();
          return;
        }
        debate2p.generateNextTurn();
      }, NEXT_TURN_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [
    activeSession?.isRunning,
    activeSession?.currentTurn,
    activeSession?.agents.length,
    debate8p.currentStageId,
    debateMode,
    activeIsLoading,
    activeStreamingContent,
    modeTransition,
    debate2p.generateNextTurn,
    debate8p.generateNextStage,
  ]);

  useEffect(() => {
    const viewport = messageViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [displaySession?.messages.length, displayStreamingContent, displayIsLoading, displayPausedStreamingMessage]);

  useEffect(() => {
    if (isEditingTurnLimit && !activeSession) {
      turnLimitInputRef.current?.focus();
      turnLimitInputRef.current?.select();
    }
  }, [isEditingTurnLimit, activeSession]);

  const clearTransitionMotion = useCallback(() => {
    if (cloudRafRef.current !== null) {
      cancelAnimationFrame(cloudRafRef.current);
      cloudRafRef.current = null;
    }

    const scene = sceneRef.current;
    if (!scene) return;

    scene.querySelectorAll<HTMLElement>('.debate-stage-cloud-origin').forEach((el) => {
      el.style.transform = '';
      el.style.willChange = '';
    });
    scene.querySelectorAll<HTMLElement>('.debate-stage-cloud-wrap').forEach((el) => {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.willChange = '';
    });
  }, []);

  const startTransitionMotion = useCallback((direction: 'up' | 'down') => {
    clearTransitionMotion();

    const scene = sceneRef.current;
    if (!scene) return;

    const originClouds = Array.from(scene.querySelectorAll<HTMLElement>('.debate-stage-cloud-origin'));
    const wrapClouds = Array.from(scene.querySelectorAll<HTMLElement>('.debate-stage-cloud-wrap'));
    if (originClouds.length === 0 || wrapClouds.length === 0) return;

    const cloudDuration = direction === 'up' ? 1280 : 1320;
    const span = Math.max(window.innerHeight * 2.2, 1200);

    originClouds.forEach((el) => {
      el.style.willChange = 'transform';
    });
    wrapClouds.forEach((el) => {
      el.style.willChange = 'transform, opacity';
      el.style.opacity = '1';
    });

    let start: number | null = null;
    const easeOutQuart = (t: number) => 1 - (1 - t) ** 4; // fast -> slow -> stop
    const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // slow -> fast -> slow

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const cloudT = Math.max(0, Math.min(1, elapsed / cloudDuration));
      const cloudProgress = direction === 'up' ? easeOutQuart(cloudT) : smootherstep(cloudT);
      const shift = direction === 'up' ? -span * cloudProgress : span * cloudProgress;
      const wrapShift = direction === 'up' ? shift + span : shift - span;

      const originTransform = `translate3d(0, ${shift.toFixed(3)}px, 0)`;
      const wrapTransform = `translate3d(0, ${wrapShift.toFixed(3)}px, 0)`;

      originClouds.forEach((el) => {
        el.style.transform = originTransform;
      });
      wrapClouds.forEach((el) => {
        el.style.transform = wrapTransform;
      });

      if (cloudT < 1) {
        cloudRafRef.current = requestAnimationFrame(tick);
        return;
      }

      cloudRafRef.current = null;
      originClouds.forEach((el) => {
        el.style.transform = '';
        el.style.willChange = '';
      });
      wrapClouds.forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.willChange = '';
      });
    };

    cloudRafRef.current = requestAnimationFrame(tick);
  }, [clearTransitionMotion]);

  useEffect(() => {
    return () => {
      if (modeSwitchTimerRef.current) {
        clearTimeout(modeSwitchTimerRef.current);
      }
      if (modeTransitionTimerRef.current) {
        clearTimeout(modeTransitionTimerRef.current);
      }
      clearTransitionMotion();
    };
  }, [clearTransitionMotion]);

  const hasConfiguredPro = agents.some((agent) => agent.stance === 'pro' && agent.apiKey.trim().length > 0);
  const hasConfiguredCon = agents.some((agent) => agent.stance === 'con' && agent.apiKey.trim().length > 0);
  const canLaunch = isTwoPersonLaunchEnabled(topic, hasConfiguredPro, hasConfiguredCon);
  const composerState = getTwoPersonComposerState(Boolean(activeSession));
  const frameSpec = getTwoPersonFrameSpec(Boolean(activeSession?.isRunning));
  const idleSpec = getTwoPersonIdleSpec();
  const currentSpeaker = debateMode === '8person'
    ? debate8p.getCurrentSpeaker()
    : activeSession?.agents[activeSession.currentAgentIndex];
  const proAgent = agents.find((agent) => agent.stance === 'pro');
  const conAgent = agents.find((agent) => agent.stance === 'con');
  const judgeAgent = agents.find((agent) => agent.stance === 'judge');

  const turnsLeftLabel = getTwoPersonTurnsLeftLabel({
    proTurns: activeSession?.proTurns,
    conTurns: activeSession?.conTurns,
    maxTurnsPerSide: activeSession?.maxTurnsPerSide,
    maxTurnsTotal: activeSession?.maxTurnsTotal ?? turnLimitValue,
  });
  const footerActionState = getTwoPersonFooterActionState({
    hasSessionStarted: Boolean(activeSession),
    isRunning: Boolean(activeSession?.isRunning),
    canLaunch,
    isBusy: modeTransition !== 'idle' || activeIsLoading || activeStreamingContent.length > 0,
  });

  const eightPersonProCount = eightPersonRoster.filter(
    (r) => r.stance === 'pro' && r.hasApiKey
  ).length;
  const eightPersonConCount = eightPersonRoster.filter(
    (r) => r.stance === 'con' && r.hasApiKey
  ).length;
  const eightPersonCanLaunch = isEightPersonLaunchEnabled(
    topic,
    eightPersonProCount,
    eightPersonConCount
  );
  const eightPersonComposerState = getEightPersonComposerState(Boolean(activeSession));
  const eightPersonFrameSpec = getEightPersonFrameSpec();
  const eightPersonFooterActionState = getEightPersonFooterActionState({
    hasSessionStarted: Boolean(activeSession),
    isRunning: Boolean(activeSession?.isRunning),
    canLaunch: eightPersonCanLaunch,
    isBusy: modeTransition !== 'idle' || activeIsLoading || activeStreamingContent.length > 0,
  });
  const eightPersonPhaseInfo = (() => {
    const stageId = debate8p.currentStageId || 1;
    if (stageId <= 4) return { phase: 'opening' as EightPersonPhase, step: stageId };
    if (stageId <= 8) return { phase: 'attack' as EightPersonPhase, step: stageId - 4 };
    if (stageId <= 9) return { phase: 'free' as EightPersonPhase, step: stageId - 8 };
    if (stageId <= 13) return { phase: 'audience' as EightPersonPhase, step: stageId - 9 };
    return { phase: 'summary' as EightPersonPhase, step: Math.max(1, Math.min(stageId - 13, 3)) };
  })();
  const eightPersonPhaseProgress = getEightPersonPhaseProgress(eightPersonPhaseInfo.phase);
  const currentEightPersonPhase = EIGHT_PERSON_PHASES.find((phase) => phase.id === eightPersonPhaseInfo.phase);
  const currentEightPersonPhaseSteps = currentEightPersonPhase?.steps ?? 1;
  const currentEightPersonStep = Math.max(1, Math.min(eightPersonPhaseInfo.step, currentEightPersonPhaseSteps));
  const eightPersonPhaseLabel = `${currentEightPersonPhase?.label ?? '开篇'} ${currentEightPersonStep}/${currentEightPersonPhaseSteps}`;
  const turnLimitDisplayValue = activeSession
    ? (debateMode === '8person' ? eightPersonPhaseLabel : turnsLeftLabel)
    : debateMode === '8person'
      ? eightPersonPhaseLabel
      : isEditingTurnLimit
        ? turnLimitInput
        : turnsLeftLabel;
  const activeComposerState = debateMode === '2person' ? composerState : eightPersonComposerState;
  const activeFooterActionState = debateMode === '2person' ? footerActionState : eightPersonFooterActionState;
  const eightPersonJudgeModel = eightPersonJudgeConfig.model || 'gpt-4o-mini';
  const eightPersonJudgeConfigured = eightPersonJudgeConfig.apiKey.trim().length > 0;

  const clearModeTimers = () => {
    if (modeSwitchTimerRef.current) {
      clearTimeout(modeSwitchTimerRef.current);
      modeSwitchTimerRef.current = null;
    }
    if (modeTransitionTimerRef.current) {
      clearTimeout(modeTransitionTimerRef.current);
      modeTransitionTimerRef.current = null;
    }
    clearTransitionMotion();
  };

  const handleModeSwitch = (nextMode: '2person' | '8person') => {
    if (nextMode === debateMode && modeTransition === 'idle') {
      return;
    }

    clearModeTimers();

    if (nextMode === '8person') {
      setDebateMode('8person');
      setModeTransition('to8');
      modeTransitionTimerRef.current = setTimeout(() => {
        setModeTransition('idle');
        modeTransitionTimerRef.current = null;
      }, 1320);
      return;
    }

    // 8 -> 2: keep 8-person cards briefly for retract animation
    setModeTransition('to2');
    modeSwitchTimerRef.current = setTimeout(() => {
      setDebateMode('2person');
      modeSwitchTimerRef.current = null;
    }, 1300);
    modeTransitionTimerRef.current = setTimeout(() => {
      setModeTransition('idle');
      modeTransitionTimerRef.current = null;
    }, 1360);
  };

  useEffect(() => {
    if (modeTransition === 'to8') {
      startTransitionMotion('up');
      return;
    }

    if (modeTransition === 'to2') {
      startTransitionMotion('down');
    }
  }, [modeTransition, startTransitionMotion]);

  const getStanceAccent = (agent?: AgentConfig | null) => {
    switch (agent?.stance) {
      case 'pro':
        return '#53dbc9';
      case 'con':
        return '#ff7169';
      case 'judge':
        return '#ff9538';
      default:
        return '#ede7e1';
    }
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingTarget('2person');
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleEditEightPersonMember = (memberId: string) => {
    const rosterMember = eightPersonRoster.find((item) => item.id === memberId);
    if (!rosterMember) return;

    setEditingTarget('8person');
    setEditingAgent({
      id: rosterMember.id,
      name: rosterMember.name,
      stance: rosterMember.stance,
      model: rosterMember.model,
      apiKey: rosterMember.apiKey ?? '',
      baseUrl: rosterMember.baseUrl ?? defaultBaseUrl,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
    });
    setIsAgentDialogOpen(true);
  };

  const handleEditEightPersonJudge = () => {
    setEditingTarget('8person-judge');
    setEditingAgent({
      ...eightPersonJudgeConfig,
      stance: 'judge',
    });
    setIsAgentDialogOpen(true);
  };

  const handleSaveAgent = (agent: AgentConfig) => {
    if (editingTarget === '8person-judge') {
      setEightPersonJudgeConfig({
        ...agent,
        id: 'judge-8p-config',
        stance: 'judge',
        systemPrompt: agent.systemPrompt || DEFAULT_SYSTEM_PROMPTS.judge,
      });
      setEditingAgent(null);
      setIsAgentDialogOpen(false);
      toast.success('8人制裁判已更新');
      return;
    }

    if (editingTarget === '8person') {
      setEightPersonRoster((prev) =>
        prev.map((item) =>
          item.id === agent.id
            ? {
                ...item,
                name: agent.name,
                model: agent.model,
                stance: item.stance,
                apiKey: agent.apiKey,
                baseUrl: agent.baseUrl,
                hasApiKey: agent.apiKey.trim().length > 0,
              }
            : item
        )
      );
      setEditingAgent(null);
      setIsAgentDialogOpen(false);
      toast.success('8人辩手已更新');
      return;
    }

    let isUpdate = false;
    setAgents((prev) => {
      const exists = prev.find((item) => item.id === agent.id);
      if (exists) {
        isUpdate = true;
        return prev.map((item) => (item.id === agent.id ? agent : item));
      }
      return [...prev, agent];
    });
    setEditingAgent(null);
    setIsAgentDialogOpen(false);
    toast.success(isUpdate ? '辩手已更新' : '辩手已添加');
  };

  const judgeCardLayoutMode: '2person' | '8person' =
    modeTransition === 'to8' ? '8person' : modeTransition === 'to2' ? '2person' : debateMode;
  const judgeCardIsEightLayout = judgeCardLayoutMode === '8person';
  const judgeCardModel = judgeCardIsEightLayout
    ? eightPersonJudgeModel
    : (judgeAgent?.model || 'gpt-4o-mini');
  const judgeCardConfigured = judgeCardIsEightLayout
    ? eightPersonJudgeConfigured
    : Boolean(judgeAgent?.apiKey.trim().length);
  const judgeCardName = judgeCardIsEightLayout
    ? (eightPersonJudgeConfig.name || '主裁判')
    : (judgeAgent?.name || '裁判');

  const handleSharedJudgeEdit = () => {
    if (modeTransition !== 'idle') return;
    if (judgeCardIsEightLayout) {
      handleEditEightPersonJudge();
      return;
    }
    if (judgeAgent) {
      handleEditAgent(judgeAgent);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeSession) return;

    const stanceLabel = (stance: string) => {
      switch (stance) {
        case 'pro':
          return '正方';
        case 'con':
          return '反方';
        case 'judge':
          return '裁判';
        default:
          return '未知';
      }
    };

    const mdContent = activeSession.messages
      .map((msg) => `### ${msg.agentName} (${stanceLabel(msg.stance)})\n\n${msg.content}\n\n---\n`)
      .join('\n');

    const fullContent = `# 辩论主题: ${activeSession.topic}\n\n**辩论时间:** ${new Date().toLocaleString(
      'zh-CN'
    )}\n\n**参与辩手:** ${activeSession.agents.map((agent) => agent.name).join('、')}\n\n---\n\n${mdContent}`;

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `辩论记录_${activeSession.topic.substring(0, 10)}_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('辩论记录已导出');
  };

  const getMessageViewport = () =>
    messageViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;

  const scrollMessagesToTop = () => {
    const viewport = getMessageViewport();
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollMessagesToBottom = () => {
    const viewport = getMessageViewport();
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleStageAction = () => {
    const currentFooterState =
      debateMode === '2person' ? footerActionState : eightPersonFooterActionState;

    if (currentFooterState.mode === 'pause') {
      activeDebate.pauseDebate();
      return;
    }

    if (currentFooterState.mode === 'resume') {
      activeDebate.resumeDebate();
      return;
    }

    if (debateMode === '2person') {
      if (!canLaunch) {
        toast.error('请填写主题并完成正反方配置');
        return;
      }
      const validation = validateTwoPersonTurnLimit(turnLimitInput);
      if (!validation.isValid || validation.normalizedValue === undefined) {
        const message = validation.errorMessage ?? '请输入有效回合数。';
        setTurnLimitError(message);
        toast.error(message);
        return;
      }
      setTurnLimitError(null);
      setTurnLimitInput(String(validation.normalizedValue));
      setTurnLimitValue(validation.normalizedValue);
      setIsEditingTurnLimit(false);
      const validAgents = agents.filter((agent) => agent.apiKey.trim().length > 0);
      debate2p.startDebate(topic, validAgents, validation.normalizedValue);
      toast.success('辩论开始！');
    } else {
      if (!eightPersonCanLaunch) {
        toast.error('请填写主题并完成 4 位正方 + 4 位反方辩手配置');
        return;
      }
      const toDebater = (stance: 'pro' | 'con') =>
        eightPersonRoster
          .filter((r) => r.stance === stance)
          .sort((a, b) => a.position - b.position)
          .map((r): Debater => ({
            id: r.id,
            name: r.name,
            role: roleByPosition[r.position] ?? 'first',
            team: stance,
            model: r.model,
            baseUrl: r.baseUrl || defaultBaseUrl,
            apiKey: r.apiKey ?? '',
            systemPrompt: DEFAULT_SYSTEM_PROMPTS[stance],
            temperature: 0.7,
            maxTokens: 2000,
          }));

      const proDebaters = toDebater('pro');
      const conDebaters = toDebater('con');
      const judgeDebater: Debater = {
        id: eightPersonJudgeConfig.id,
        name: eightPersonJudgeConfig.name || '主裁判',
        role: 'first',
        team: 'judge',
        model: eightPersonJudgeConfig.model || 'gpt-4o-mini',
        baseUrl: eightPersonJudgeConfig.baseUrl || defaultBaseUrl,
        apiKey: eightPersonJudgeConfig.apiKey || '',
        systemPrompt: eightPersonJudgeConfig.systemPrompt || DEFAULT_SYSTEM_PROMPTS.judge,
        temperature: eightPersonJudgeConfig.temperature ?? 0.7,
        maxTokens: eightPersonJudgeConfig.maxTokens ?? 1600,
        thinkingMode: eightPersonJudgeConfig.thinkingMode ?? false,
      };

      const validAgents = eightPersonRoster
        .filter((r) => r.hasApiKey)
        .map((r) => ({
          id: r.id,
          name: r.name,
          stance: r.stance,
          model: r.model,
          apiKey: r.apiKey ?? '',
          baseUrl: r.baseUrl ?? defaultBaseUrl,
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: '',
        }));
      if (validAgents.length !== 8) {
        toast.error('8人模式需要全部 8 位辩手完成 API 配置');
        return;
      }

      debate8p.startEightPersonDebate(topic, proDebaters, conDebaters, judgeDebater);
      toast.success('8人制辩论开始！');
    }
  };

  useEffect(() => {
    const handleEnterShortcut = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) {
        return;
      }

      if (isAgentDialogOpen || isSettingsOpen) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (target.isContentEditable || tag === 'textarea' || tag === 'select' || tag === 'button') {
          return;
        }
        if (tag === 'input') {
          const input = target as HTMLInputElement;
          if (input.id !== 'debate-topic-input') {
            return;
          }
        }
      }

      if (activeFooterActionState.disabled) {
        return;
      }

      event.preventDefault();
      handleStageAction();
    };

    window.addEventListener('keydown', handleEnterShortcut);
    return () => window.removeEventListener('keydown', handleEnterShortcut);
  }, [activeFooterActionState.disabled, handleStageAction, isAgentDialogOpen, isSettingsOpen]);

  const validateTurnLimitInput = () => {
    const validation = validateTwoPersonTurnLimit(turnLimitInput);
    if (!validation.isValid || validation.normalizedValue === undefined) {
      const message = validation.errorMessage ?? '请输入有效回合数。';
      setTurnLimitError(message);
      toast.error(message);
      return false;
    }

    setTurnLimitError(null);
    setTurnLimitValue(validation.normalizedValue);
    setTurnLimitInput(String(validation.normalizedValue));
    setIsEditingTurnLimit(false);
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--wolf-paper, #f4efea)' }}>
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="flex-1 p-4">
        <div
          ref={sceneRef}
          className="debate-stage-scene"
          data-running={displaySession ? 'true' : 'false'}
          data-mode={debateMode}
          data-mode-transition={modeTransition}
        >
          <svg className="debate-stage-cloud debate-stage-cloud-left debate-stage-cloud-origin" viewBox="0 0 180 100" aria-hidden="true">
            <path d="M22 84c-12 0-20-8-20-20 0-11 8-20 19-20 4-20 23-34 45-34 17 0 31 7 40 20 5-2 10-3 15-3 19 0 34 15 34 34 0 14-10 23-26 23H22Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left debate-stage-cloud-wrap" viewBox="0 0 180 100" aria-hidden="true">
            <path d="M22 84c-12 0-20-8-20-20 0-11 8-20 19-20 4-20 23-34 45-34 17 0 31 7 40 20 5-2 10-3 15-3 19 0 34 15 34 34 0 14-10 23-26 23H22Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left-mid debate-stage-cloud-origin" viewBox="0 0 160 92" aria-hidden="true">
            <path d="M20 78c-11 0-18-8-18-18 0-10 7-18 18-18 4-18 20-30 40-30 15 0 27 6 35 18 4-2 8-3 13-3 17 0 30 13 30 30 0 13-9 21-23 21H20Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left-mid debate-stage-cloud-wrap" viewBox="0 0 160 92" aria-hidden="true">
            <path d="M20 78c-11 0-18-8-18-18 0-10 7-18 18-18 4-18 20-30 40-30 15 0 27 6 35 18 4-2 8-3 13-3 17 0 30 13 30 30 0 13-9 21-23 21H20Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left-top debate-stage-cloud-origin" viewBox="0 0 170 100" aria-hidden="true">
            <path d="M24 84c-12 0-21-8-21-20 0-11 8-20 20-20 4-21 23-35 46-35 16 0 30 7 39 20 5-2 10-3 14-3 19 0 34 15 34 34 0 14-10 24-25 24H24Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left-top debate-stage-cloud-wrap" viewBox="0 0 170 100" aria-hidden="true">
            <path d="M24 84c-12 0-21-8-21-20 0-11 8-20 20-20 4-21 23-35 46-35 16 0 30 7 39 20 5-2 10-3 14-3 19 0 34 15 34 34 0 14-10 24-25 24H24Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-right debate-stage-cloud-origin" viewBox="0 0 220 122" aria-hidden="true">
            <path d="M28 104c-15 0-26-10-26-25 0-14 10-24 24-24 5-26 29-45 58-45 21 0 40 9 52 26 6-3 12-4 19-4 24 0 42 18 42 42 0 18-13 30-33 30H28Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-right debate-stage-cloud-wrap" viewBox="0 0 220 122" aria-hidden="true">
            <path d="M28 104c-15 0-26-10-26-25 0-14 10-24 24-24 5-26 29-45 58-45 21 0 40 9 52 26 6-3 12-4 19-4 24 0 42 18 42 42 0 18-13 30-33 30H28Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-right-top debate-stage-cloud-origin" viewBox="0 0 190 108" aria-hidden="true">
            <path d="M25 90c-13 0-22-9-22-22 0-12 8-21 20-21 4-22 24-38 48-38 18 0 33 8 43 22 5-2 10-3 15-3 20 0 35 15 35 35 0 15-10 25-27 25H25Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-right-top debate-stage-cloud-wrap" viewBox="0 0 190 108" aria-hidden="true">
            <path d="M25 90c-13 0-22-9-22-22 0-12 8-21 20-21 4-22 24-38 48-38 18 0 33 8 43 22 5-2 10-3 15-3 20 0 35 15 35 35 0 15-10 25-27 25H25Z" />
          </svg>
          <div
            className={`debate-stage-float debate-stage-float-judge-shared ${judgeCardIsEightLayout ? 'debate-stage-float-judge-8p' : 'debate-stage-float-judge-2p'} ${judgeCardIsEightLayout ? 'debate-stage-float-8p' : ''}`}
          >
            <button
              type="button"
              className="debate-stage-float-card debate-stage-float-card-8p debate-stage-float-card-judge"
              onClick={handleSharedJudgeEdit}
              disabled={modeTransition !== 'idle'}
              style={{
                backgroundColor: '#ff9538',
                color: '#3e3d3c',
                border: '2px solid #454341',
                borderRadius: 0,
              }}
            >
              <div className="debate-stage-float-card-label">裁判</div>
              <div className="debate-stage-float-card-name">{judgeCardName}</div>
              <div className="debate-stage-float-card-meta">
                <span className="debate-stage-float-card-key">MODEL</span>
                <span className="debate-stage-float-card-value" title={judgeCardModel}>
                  {judgeCardModel}
                </span>
              </div>
              <div className="debate-stage-float-card-meta">
                <span className="debate-stage-float-card-key">STATUS</span>
                <span className="debate-stage-float-card-value">
                  {judgeCardConfigured ? '已配置' : '未配置'}
                </span>
              </div>
            </button>
          </div>
          {debateMode === '2person' && proAgent && (
            <div className="debate-stage-float debate-stage-float-pro">
              <AgentCard
                agent={proAgent}
                index={0}
                variant="stage"
                onEdit={handleEditAgent}
              />
            </div>
          )}
          {debateMode === '2person' && conAgent && (
            <div className="debate-stage-float debate-stage-float-con">
              <AgentCard
                agent={conAgent}
                index={0}
                variant="stage"
                onEdit={handleEditAgent}
              />
            </div>
          )}
          {debateMode === '8person' && (
            <>
              {eightPersonRoster
                .filter((member) => member.stance === 'pro')
                .slice(0, 4)
                .map((member, index) => (
                  <div
                    key={member.id}
                    className={`debate-stage-float debate-stage-float-8p debate-stage-float-8p-left-${index + 1} ${index === 3 ? 'debate-stage-float-8p-anchor' : 'debate-stage-float-8p-extra'}`}
                  >
                    <button
                      type="button"
                      className="debate-stage-float-card debate-stage-float-card-8p debate-stage-float-card-pro"
                      onClick={() => handleEditEightPersonMember(member.id)}
                      style={{
                        backgroundColor: '#53dbc9',
                        color: '#3e3d3c',
                        border: '2px solid #454341',
                        borderRadius: 0,
                      }}
                    >
                      <div className="debate-stage-float-card-label">正方</div>
                      <div className="debate-stage-float-card-name">{member.name}</div>
                      <div className="debate-stage-float-card-meta">
                        <span className="debate-stage-float-card-key">MODEL</span>
                        <span className="debate-stage-float-card-value" title={member.model}>
                          {member.model}
                        </span>
                      </div>
                      <div className="debate-stage-float-card-meta">
                        <span className="debate-stage-float-card-key">STATUS</span>
                        <span className="debate-stage-float-card-value">
                          {member.hasApiKey ? '已配置' : '未配置'}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              {eightPersonRoster
                .filter((member) => member.stance === 'con')
                .slice(0, 4)
                .map((member, index) => (
                  <div
                    key={member.id}
                    className={`debate-stage-float debate-stage-float-8p debate-stage-float-8p-right-${index + 1} ${index === 3 ? 'debate-stage-float-8p-anchor' : 'debate-stage-float-8p-extra'}`}
                  >
                    <button
                      type="button"
                      className="debate-stage-float-card debate-stage-float-card-8p debate-stage-float-card-con"
                      onClick={() => handleEditEightPersonMember(member.id)}
                      style={{
                        backgroundColor: '#ff7169',
                        color: '#3e3d3c',
                        border: '2px solid #454341',
                        borderRadius: 0,
                      }}
                    >
                      <div className="debate-stage-float-card-label">反方</div>
                      <div className="debate-stage-float-card-name">{member.name}</div>
                      <div className="debate-stage-float-card-meta">
                        <span className="debate-stage-float-card-key">MODEL</span>
                        <span className="debate-stage-float-card-value" title={member.model}>
                          {member.model}
                        </span>
                      </div>
                      <div className="debate-stage-float-card-meta">
                        <span className="debate-stage-float-card-key">STATUS</span>
                        <span className="debate-stage-float-card-value">
                          {member.hasApiKey ? '已配置' : '未配置'}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
            </>
          )}
          <div className="debate-stage-shell-motion">
            <section className="debate-stage-shell">
            <header className="debate-stage-header">
              <div className="debate-stage-header-main">
                <div className="debate-stage-title-group">
                  <span className="debate-stage-title">
                    {debateMode === '2person' ? frameSpec.stageTitle : eightPersonFrameSpec.stageTitle}
                  </span>
                  <span className="debate-stage-status-text">{displaySession?.isRunning ? '进行中' : '准备中'}</span>
                </div>
                <div className="wolf-debate-mode-toggle debate-stage-mode-toggle" data-placement={frameSpec.modeTogglePlacement}>
                  <button
                    onClick={() => handleModeSwitch('2person')}
                    className="wolf-debate-mode-toggle-button debate-stage-mode-toggle-button"
                    data-active={debateMode === '2person'}
                    disabled={modeTransition !== 'idle'}
                  >
                    2 人
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('8person')}
                    className="wolf-debate-mode-toggle-button debate-stage-mode-toggle-button"
                    data-active={debateMode === '8person'}
                    title="8人制辩论模式"
                    disabled={modeTransition !== 'idle'}
                  >
                    8 人
                  </button>
                </div>
              </div>
              <div className="debate-stage-header-actions">
                <div className="debate-stage-turns-control">
                  <label htmlFor="debate-turn-limit" className="sr-only">
                    辩论回合数
                  </label>
                  <input
                    id="debate-turn-limit"
                    ref={turnLimitInputRef}
                    type="text"
                    inputMode={debateMode === '8person' || displaySession ? 'text' : 'numeric'}
                    value={turnLimitDisplayValue}
                    readOnly={debateMode === '8person' || Boolean(displaySession) || !isEditingTurnLimit}
                    onChange={(event) => {
                      if (debateMode !== '2person') return;
                      if (displaySession || !isEditingTurnLimit) return;
                      const nextValue = event.target.value.replace(/[^\d]/g, '');
                      setTurnLimitInput(nextValue);
                      if (turnLimitError) {
                        setTurnLimitError(null);
                      }
                    }}
                    onClick={() => {
                      if (debateMode !== '2person') return;
                      if (!displaySession && !isEditingTurnLimit) {
                        setTurnLimitInput(String(turnLimitValue));
                        setIsEditingTurnLimit(true);
                      }
                    }}
                    onBlur={() => {
                      if (debateMode !== '2person') return;
                      if (!displaySession && isEditingTurnLimit) {
                        validateTurnLimitInput();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (debateMode !== '2person') return;
                      if (!displaySession && isEditingTurnLimit && event.key === 'Enter') {
                        event.preventDefault();
                        validateTurnLimitInput();
                      }
                      if (!displaySession && isEditingTurnLimit && event.key === 'Escape') {
                        event.preventDefault();
                        setTurnLimitError(null);
                        setTurnLimitInput(String(turnLimitValue));
                        setIsEditingTurnLimit(false);
                      }
                    }}
                    className="debate-stage-turns-input"
                    aria-invalid={turnLimitError ? 'true' : 'false'}
                    aria-describedby={turnLimitError ? 'debate-turn-limit-error' : undefined}
                    aria-label="辩论回合数"
                  />
                  {turnLimitError && !displaySession && debateMode === '2person' && (
                    <span id="debate-turn-limit-error" className="debate-stage-turns-error">
                      {turnLimitError}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={displaySession ? activeDebate.resetDebate : () => {}}
                  disabled={!displaySession}
                  className="debate-stage-reset-button"
                >
                  重置
                </Button>
              </div>
            </header>

            <div className="debate-stage-body">
              <div
                className={`debate-stage-phase-track debate-stage-phase-track-body ${displaySession ? 'debate-stage-phase-track-running' : ''} ${(debateMode === '8person' && modeTransition === 'idle') ? '' : 'debate-stage-phase-track-hidden'}`}
                aria-hidden={(debateMode === '8person' && modeTransition === 'idle') ? 'false' : 'true'}
              >
                {debateMode === '8person' && modeTransition === 'idle' && EIGHT_PERSON_PHASES.map((phase, index) => {
                  const isCompleted = eightPersonPhaseProgress.completed.includes(phase.id);
                  const isCurrent = eightPersonPhaseProgress.current === phase.id;
                  return (
                    <div key={phase.id} className="debate-phase-flow-item">
                      {index > 0 && <span className="debate-phase-arrow" aria-hidden="true">→</span>}
                      <div
                        className={`debate-phase-segment ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                        title={`${phase.label} (${phase.steps}轮)`}
                      >
                        <span className="debate-phase-segment-label">{phase.label}</span>
                        {displaySession && isCurrent && (
                          <span className="debate-phase-segment-step">{eightPersonPhaseInfo.step}/{phase.steps}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="debate-stage-content">
                {!displaySession && debateMode === '2person' && idleSpec.showMatchupPreview && (
                  <div className="debate-idle-preview">
                    <p className="debate-idle-guidance">在下方输入主题并发起辩论。</p>
                  </div>
                )}
                {!displaySession && debateMode === '8person' && (
                  <div className="debate-idle-preview debate-idle-preview-8p">
                    <p className="debate-idle-guidance debate-idle-guidance-8p">
                      点击左右信息卡编辑辩手配置，在下方输入主题后发起辩论。
                    </p>
                  </div>
                )}

                {displaySession && (
                  <div className="debate-message-shell">
                    <ScrollArea className="debate-message-viewport" ref={messageViewportRef}>
                      <div className="space-y-3 p-4" id="debate-messages">
                        {displaySession.messages.map((message) => (
                          <MessageBubble key={message.id} message={message} onExport={handleExportMarkdown} />
                        ))}
                        {(displayIsLoading || displayStreamingContent) && (
                          <MessageBubble
                            message={{
                              id: 'streaming',
                              agentId: currentSpeaker?.id ?? 'streaming',
                              agentName: currentSpeaker?.name ?? '匿名辩手',
                              stance: debateMode === '8person'
                                ? ((currentSpeaker as Debater | null)?.team as Stance) ?? 'pro'
                                : (currentSpeaker as AgentConfig | undefined)?.stance ?? 'pro',
                              content: displayStreamingContent,
                              timestamp: displaySession.messages[displaySession.messages.length - 1]?.timestamp ?? 0,
                            }}
                            isStreaming={true}
                          />
                        )}
                        {!displayIsLoading && !displayStreamingContent && displayPausedStreamingMessage && (
                          <MessageBubble
                            message={displayPausedStreamingMessage}
                            isStreaming={true}
                          />
                        )}
                      </div>
                    </ScrollArea>
                    <div className="debate-scroll-controls" aria-label="消息滚动控制">
                      <button
                        type="button"
                        className="debate-scroll-button"
                        onClick={scrollMessagesToTop}
                        aria-label="滚动到顶部"
                        title="到顶"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="debate-scroll-button"
                        onClick={scrollMessagesToBottom}
                        aria-label="滚动到底部"
                        title="到底"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="debate-stage-footer" data-placement={frameSpec.composerPlacement}>
              <div className="debate-stage-composer-row">
                <label htmlFor="debate-topic-input" className="sr-only">
                  辩论主题
                </label>
                <input
                  id="debate-topic-input"
                  type="text"
                  value={topic}
                  readOnly={activeComposerState.mode === 'readonly'}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="例如：AI 是否会取代人类？"
                  className="wolf-debate-topic-input debate-stage-composer-input"
                  aria-label="辩论主题"
                />
                <Button
                  size="icon"
                  onClick={handleStageAction}
                  disabled={activeFooterActionState.disabled}
                  className="wolf-hard-shadow-button debate-stage-send-button"
                  data-tone={activeFooterActionState.tone}
                  style={{ border: '2px solid #454341', borderRadius: 0 }}
                  aria-label={
                    activeFooterActionState.mode === 'pause'
                      ? '暂停辩论'
                      : activeFooterActionState.mode === 'resume'
                        ? '继续辩论'
                        : '开始辩论'
                  }
                  title={
                    activeFooterActionState.mode === 'pause'
                      ? '暂停辩论'
                      : activeFooterActionState.mode === 'resume'
                        ? '继续辩论'
                        : '开始辩论'
                  }
                >
                  {activeFooterActionState.mode === 'pause' ? (
                    <Pause className="w-4 h-4" />
                  ) : activeFooterActionState.mode === 'resume' ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </footer>
            </section>
          </div>
        </div>
      </main>

      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent
          className="max-w-lg overflow-hidden p-0"
          style={{ backgroundColor: '#fbf7f2', border: '2px solid #454341', borderRadius: 0, maxHeight: 'calc(100vh - 48px)' }}
        >
          <DialogHeader
            style={{
              borderBottom: '2px solid #454341',
              padding: '0.75rem 1rem',
              backgroundColor: getStanceAccent(editingAgent),
            }}
          >
            <DialogTitle className="font-mono uppercase text-sm tracking-wider" style={{ color: '#3e3d3c' }}>
              编辑辩手
            </DialogTitle>
          </DialogHeader>
          {editingAgent && (
            <AgentForm
              agent={editingAgent}
              showStance={false}
              onSave={handleSaveAgent}
              onCancel={() => {
                setEditingAgent(null);
                setIsAgentDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent
          className="max-w-md"
          style={{ backgroundColor: '#fbf7f2', border: '2px solid #454341', borderRadius: 0 }}
        >
          <DialogHeader style={{ borderBottom: '2px solid #454341', padding: '0.75rem 1rem' }}>
            <DialogTitle className="font-mono uppercase text-sm tracking-wider" style={{ color: '#3e3d3c' }}>
              默认 API 设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                Base URL
              </label>
              <input
                type="text"
                value={defaultBaseUrl}
                onChange={(event) => setDefaultBaseUrl(event.target.value)}
                className="wolf-debate-input w-full h-9 px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                API Key
              </label>
              <input
                type="password"
                value={defaultApiKey}
                onChange={(event) => setDefaultApiKey(event.target.value)}
                placeholder="sk-..."
                className="wolf-debate-input w-full h-9 px-3 text-sm"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
