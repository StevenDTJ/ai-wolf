'use client';

import { useEffect, useRef, useState } from 'react';
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
import { AgentConfig } from '@/types';
import {
  getTwoPersonComposerState,
  getTwoPersonFooterActionState,
  getTwoPersonFrameSpec,
  getTwoPersonIdleSpec,
  getTwoPersonTurnsLeftLabel,
  isTwoPersonLaunchEnabled,
  validateTwoPersonTurnLimit,
} from '@/lib/debate-stage-layout';

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
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    const saved = ensureTwoPersonAgents(loadAgentsFromStorage());
    if (saved.length > 0) return saved;
    return ensureTwoPersonAgents([
      { ...createDefaultAgent('pro'), name: '正方一辩', model: 'gpt-4o-mini' },
      { ...createDefaultAgent('con'), name: '反方一辩', model: 'gpt-4o-mini' },
    ]);
  });
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [turnLimitInput, setTurnLimitInput] = useState('20');
  const [turnLimitValue, setTurnLimitValue] = useState(20);
  const [turnLimitError, setTurnLimitError] = useState<string | null>(null);
  const [isEditingTurnLimit, setIsEditingTurnLimit] = useState(false);
  const [debateMode, setDebateMode] = useState<'2person' | '8person'>('2person');
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('https://api.openai.com/v1');
  const [defaultApiKey, setDefaultApiKey] = useState('');
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const turnLimitInputRef = useRef<HTMLInputElement | null>(null);

  const {
    session,
    isLoading,
    error,
    currentStreamingContent,
    startDebate,
    pauseDebate,
    resumeDebate,
    resetDebate,
    generateNextTurn,
  } = useDebate();

  useEffect(() => {
    if (agents.length > 0) {
      saveAgentsToStorage(agents);
    }
  }, [agents]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (session?.isRunning && !isLoading && !currentStreamingContent && session.agents.length > 0) {
      const timer = setTimeout(() => {
        generateNextTurn();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [session?.isRunning, session?.currentTurn, session?.agents.length, isLoading, currentStreamingContent, generateNextTurn]);

  useEffect(() => {
    const viewport = messageViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [session?.messages.length, currentStreamingContent]);

  useEffect(() => {
    if (isEditingTurnLimit && !session) {
      turnLimitInputRef.current?.focus();
      turnLimitInputRef.current?.select();
    }
  }, [isEditingTurnLimit, session]);

  const hasConfiguredPro = agents.some((agent) => agent.stance === 'pro' && agent.apiKey.trim().length > 0);
  const hasConfiguredCon = agents.some((agent) => agent.stance === 'con' && agent.apiKey.trim().length > 0);
  const canLaunch = isTwoPersonLaunchEnabled(topic, hasConfiguredPro, hasConfiguredCon);
  const composerState = getTwoPersonComposerState(Boolean(session));
  const frameSpec = getTwoPersonFrameSpec(Boolean(session?.isRunning));
  const idleSpec = getTwoPersonIdleSpec();
  const currentSpeaker = session?.agents[session.currentAgentIndex];
  const proAgent = agents.find((agent) => agent.stance === 'pro');
  const conAgent = agents.find((agent) => agent.stance === 'con');
  const judgeAgent = agents.find((agent) => agent.stance === 'judge');
  const turnsLeftLabel = getTwoPersonTurnsLeftLabel({
    proTurns: session?.proTurns,
    conTurns: session?.conTurns,
    maxTurnsPerSide: session?.maxTurnsPerSide,
    maxTurnsTotal: session?.maxTurnsTotal ?? turnLimitValue,
  });
  const turnLimitDisplayValue = session
    ? turnsLeftLabel
    : isEditingTurnLimit
      ? turnLimitInput
      : turnsLeftLabel;
  const footerActionState = getTwoPersonFooterActionState({
    hasSessionStarted: Boolean(session),
    isRunning: Boolean(session?.isRunning),
    canLaunch,
    isBusy: isLoading || currentStreamingContent.length > 0,
  });
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
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleSaveAgent = (agent: AgentConfig) => {
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

  const handleExportMarkdown = () => {
    if (!session) return;

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

    const mdContent = session.messages
      .map((msg) => `### ${msg.agentName} (${stanceLabel(msg.stance)})\n\n${msg.content}\n\n---\n`)
      .join('\n');

    const fullContent = `# 辩论主题: ${session.topic}\n\n**辩论时间:** ${new Date().toLocaleString(
      'zh-CN'
    )}\n\n**参与辩手:** ${session.agents.map((agent) => agent.name).join('、')}\n\n---\n\n${mdContent}`;

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `辩论记录_${session.topic.substring(0, 10)}_${Date.now()}.md`;
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
    if (footerActionState.mode === 'pause') {
      pauseDebate();
      return;
    }

    if (footerActionState.mode === 'resume') {
      resumeDebate();
      return;
    }

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
    startDebate(topic, validAgents, validation.normalizedValue);
    toast.success('辩论开始！');
  };

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
        <div className="debate-stage-scene" data-running={session ? 'true' : 'false'}>
          <svg className="debate-stage-cloud debate-stage-cloud-left" viewBox="0 0 180 100" aria-hidden="true">
            <path d="M22 84c-12 0-20-8-20-20 0-11 8-20 19-20 4-20 23-34 45-34 17 0 31 7 40 20 5-2 10-3 15-3 19 0 34 15 34 34 0 14-10 23-26 23H22Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-left-mid" viewBox="0 0 160 92" aria-hidden="true">
            <path d="M20 78c-11 0-18-8-18-18 0-10 7-18 18-18 4-18 20-30 40-30 15 0 27 6 35 18 4-2 8-3 13-3 17 0 30 13 30 30 0 13-9 21-23 21H20Z" />
          </svg>
          <svg className="debate-stage-cloud debate-stage-cloud-right" viewBox="0 0 220 122" aria-hidden="true">
            <path d="M28 104c-15 0-26-10-26-25 0-14 10-24 24-24 5-26 29-45 58-45 21 0 40 9 52 26 6-3 12-4 19-4 24 0 42 18 42 42 0 18-13 30-33 30H28Z" />
          </svg>
          {judgeAgent && (
            <div className="debate-stage-float debate-stage-float-judge">
              <AgentCard
                agent={judgeAgent}
                index={0}
                variant="stage"
                onEdit={handleEditAgent}
              />
            </div>
          )}
          {proAgent && (
            <div className="debate-stage-float debate-stage-float-pro">
              <AgentCard
                agent={proAgent}
                index={0}
                variant="stage"
                onEdit={handleEditAgent}
              />
            </div>
          )}
          {conAgent && (
            <div className="debate-stage-float debate-stage-float-con">
              <AgentCard
                agent={conAgent}
                index={0}
                variant="stage"
                onEdit={handleEditAgent}
              />
            </div>
          )}
          <section className="debate-stage-shell">
            <header className="debate-stage-header">
              <div className="debate-stage-header-main">
                <div className="debate-stage-title-group">
                  <span className="debate-stage-title">
                    {frameSpec.stageTitle}
                  </span>
                  <span className="debate-stage-status-text">{session?.isRunning ? '进行中' : '准备中'}</span>
                </div>
                <div className="wolf-debate-mode-toggle debate-stage-mode-toggle" data-placement={frameSpec.modeTogglePlacement}>
                  <button
                    onClick={() => setDebateMode('2person')}
                    className="wolf-debate-mode-toggle-button debate-stage-mode-toggle-button"
                    data-active={debateMode === '2person'}
                  >
                    2 人
                  </button>
                  <button
                    type="button"
                    disabled={frameSpec.eightPersonEntryState === 'disabled'}
                    className="wolf-debate-mode-toggle-button debate-stage-mode-toggle-button"
                    data-active={debateMode === '8person'}
                    title="8人制将在同一骨架下后续适配"
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
                    inputMode={session ? 'text' : 'numeric'}
                    value={turnLimitDisplayValue}
                    readOnly={Boolean(session) || !isEditingTurnLimit}
                    onChange={(event) => {
                      if (session || !isEditingTurnLimit) return;
                      const nextValue = event.target.value.replace(/[^\d]/g, '');
                      setTurnLimitInput(nextValue);
                      if (turnLimitError) {
                        setTurnLimitError(null);
                      }
                    }}
                    onClick={() => {
                      if (!session && !isEditingTurnLimit) {
                        setTurnLimitInput(String(turnLimitValue));
                        setIsEditingTurnLimit(true);
                      }
                    }}
                    onBlur={() => {
                      if (!session && isEditingTurnLimit) {
                        validateTurnLimitInput();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!session && isEditingTurnLimit && event.key === 'Enter') {
                        event.preventDefault();
                        validateTurnLimitInput();
                      }
                      if (!session && isEditingTurnLimit && event.key === 'Escape') {
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
                  {turnLimitError && !session && (
                    <span id="debate-turn-limit-error" className="debate-stage-turns-error">
                      {turnLimitError}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={session ? resetDebate : () => {}}
                  disabled={!session}
                  className="debate-stage-reset-button"
                >
                  重置
                </Button>
              </div>
            </header>

            <div className="debate-stage-body">
              {!session && idleSpec.showMatchupPreview && (
                <div className="debate-idle-preview">
                  <p className="debate-idle-guidance">在下方输入主题并发起辩论。</p>
                </div>
              )}

              {session && (
                <div className="debate-message-shell">
                  <ScrollArea className="debate-message-viewport" ref={messageViewportRef}>
                    <div className="space-y-3 p-4" id="debate-messages">
                      {session.messages.map((message) => (
                        <MessageBubble key={message.id} message={message} onExport={handleExportMarkdown} />
                      ))}
                      {currentStreamingContent && (
                        <MessageBubble
                          message={{
                            id: 'streaming',
                            agentId: currentSpeaker?.id ?? 'streaming',
                            agentName: currentSpeaker?.name ?? '匿名辩手',
                            stance: currentSpeaker?.stance ?? 'pro',
                            content: currentStreamingContent,
                            timestamp: session.messages[session.messages.length - 1]?.timestamp ?? 0,
                          }}
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

            <footer className="debate-stage-footer" data-placement={frameSpec.composerPlacement}>
              <div className="debate-stage-composer-row">
                <label htmlFor="debate-topic-input" className="sr-only">
                  辩论主题
                </label>
                <input
                  id="debate-topic-input"
                  type="text"
                  value={topic}
                  readOnly={composerState.mode === 'readonly'}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="例如：AI 是否会取代人类？"
                  className="wolf-debate-topic-input debate-stage-composer-input"
                  aria-label="辩论主题"
                />
                <Button
                  size="icon"
                  onClick={handleStageAction}
                  disabled={footerActionState.disabled}
                  className="wolf-hard-shadow-button debate-stage-send-button"
                  data-tone={footerActionState.tone}
                  style={{ border: '2px solid #454341', borderRadius: 0 }}
                  aria-label={
                    footerActionState.mode === 'pause'
                      ? '暂停辩论'
                      : footerActionState.mode === 'resume'
                        ? '继续辩论'
                        : '开始辩论'
                  }
                  title={
                    footerActionState.mode === 'pause'
                      ? '暂停辩论'
                      : footerActionState.mode === 'resume'
                        ? '继续辩论'
                        : '开始辩论'
                  }
                >
                  {footerActionState.mode === 'pause' ? (
                    <Pause className="w-4 h-4" />
                  ) : footerActionState.mode === 'resume' ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </footer>
          </section>
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
