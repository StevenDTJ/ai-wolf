'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { AgentForm } from '@/components/agent-form';
import { MessageBubble } from '@/components/message-bubble';
import { DebateControls } from '@/components/debate-controls';
import { DebaterForm } from '@/components/debater-form';
import {
  useDebate,
  loadAgentsFromStorage,
  saveAgentsToStorage,
  createDefaultAgent,
  createDefaultDebater,
  loadProDebatersFromStorage,
  loadConDebatersFromStorage,
  saveProDebatersToStorage,
  saveConDebatersToStorage,
} from '@/hooks/useDebate';
import { AgentConfig, Stance, Debater, DebaterRole, TeamSide, DEBATE_FLOW } from '@/types';
import {
  Plus,
  MessageSquare,
  Users,
  Settings2,
  Play,
  Info,
  Download,
  Users2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  // Agent state
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    const savedAgents = loadAgentsFromStorage();
    if (savedAgents.length > 0) return savedAgents;
    return [
      { ...createDefaultAgent('pro'), name: '正方一辩', model: 'gpt-4o-mini' },
      { ...createDefaultAgent('con'), name: '反方一辩', model: 'gpt-4o-mini' },
    ];
  });
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);

  // Topic state
  const [topic, setTopic] = useState('');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Settings dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('https://api.openai.com/v1');
  const [defaultApiKey, setDefaultApiKey] = useState('');

  // 8-Person Debate Mode
  const [debateMode, setDebateMode] = useState<'2person' | '8person'>('2person');
  const [proDebaters, setProDebaters] = useState<Debater[]>(() => {
    const savedProDebaters = loadProDebatersFromStorage();
    if (savedProDebaters.length > 0) return savedProDebaters;
    return [
      createDefaultDebater('first', 'pro'),
      createDefaultDebater('second', 'pro'),
      createDefaultDebater('third', 'pro'),
      createDefaultDebater('fourth', 'pro'),
    ];
  });
  const [conDebaters, setConDebaters] = useState<Debater[]>(() => {
    const savedConDebaters = loadConDebatersFromStorage();
    if (savedConDebaters.length > 0) return savedConDebaters;
    return [
      createDefaultDebater('first', 'con'),
      createDefaultDebater('second', 'con'),
      createDefaultDebater('third', 'con'),
      createDefaultDebater('fourth', 'con'),
    ];
  });
  const [editingDebater, setEditingDebater] = useState<Debater | null>(null);
  const [isDebaterDialogOpen, setIsDebaterDialogOpen] = useState(false);

  // Debate hook
  const {
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
    // 8-person debate
    currentStageId,
    getCurrentStage,
    getCurrentSpeaker,
    startEightPersonDebate,
    generateNextStage,
    crossExamState,
    audienceQAState,
    freeDebateState,
    setAudienceQuestion,
    startGenerateAIQuestion,
    submitAudienceAnswer,
    submitUserQuestion,
    startNextFreeDebateRound,
    handleFreeDebateSkip,
  } = useDebate();

  // Auto-generate next turn when running
  useEffect(() => {
    if (session?.isRunning && !isLoading && session.agents.length > 0 && !currentStreamingContent) {
      const timer = setTimeout(() => {
        if (debateMode === '8person') {
          generateNextStage();
        } else {
          generateNextTurn();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [session?.isRunning, session?.currentTurn, isLoading, currentStreamingContent, debateMode, currentStageId, generateNextStage, generateNextTurn]);

  // Save agents when changed
  useEffect(() => {
    if (agents.length > 0) {
      saveAgentsToStorage(agents);
    }
  }, [agents]);

  // Save 8-person debaters when changed
  useEffect(() => {
    if (proDebaters.length > 0) {
      saveProDebatersToStorage(proDebaters);
    }
  }, [proDebaters]);

  useEffect(() => {
    if (conDebaters.length > 0) {
      saveConDebatersToStorage(conDebaters);
    }
  }, [conDebaters]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Agent handlers
  const handleAddAgent = (stance: Stance) => {
    const newAgent = createDefaultAgent(stance);
    setEditingAgent(newAgent);
    setIsAgentDialogOpen(true);
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleSaveAgent = (agent: AgentConfig) => {
    let isUpdate = false;
    setAgents((prev) => {
      const existing = prev.find((a) => a.id === agent.id);
      if (existing) {
        isUpdate = true;
        return prev.map((a) => (a.id === agent.id ? agent : a));
      }
      return [...prev, agent];
    });
    setIsAgentDialogOpen(false);
    setEditingAgent(null);
    toast.success(isUpdate ? '辩手已更新' : '辩手已添加');
  };

  const handleDeleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    toast.success('辩手已删除');
  };

  // 8-Person Debate Handlers
  const handleAddDebater = (role: DebaterRole, team: TeamSide) => {
    const newDebater = createDefaultDebater(role, team);
    setEditingDebater(newDebater);
    setIsDebaterDialogOpen(true);
  };

  const handleEditDebater = (debater: Debater) => {
    setEditingDebater(debater);
    setIsDebaterDialogOpen(true);
  };

  const handleSaveDebater = (debater: Debater) => {
    const updater = debater.team === 'pro' ? setProDebaters : setConDebaters;
    let isUpdate = false;
    updater((prev) => {
      const existing = prev.find((d) => d.id === debater.id);
      if (existing) {
        isUpdate = true;
        return prev.map((d) => (d.id === debater.id ? debater : d));
      }
      return [...prev, debater];
    });
    setIsDebaterDialogOpen(false);
    setEditingDebater(null);
    toast.success(isUpdate ? '辩手已更新' : '辩手已添加');
  };

  const handleDeleteDebater = (id: string, team: TeamSide) => {
    if (team === 'pro') {
      setProDebaters((prev) => prev.filter((d) => d.id !== id));
    } else {
      setConDebaters((prev) => prev.filter((d) => d.id !== id));
    }
    toast.success('辩手已删除');
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newAgents = [...agents];
    const [draggedItem] = newAgents.splice(dragIndex, 1);
    newAgents.splice(dropIndex, 0, draggedItem);
    setAgents(newAgents);
    setDragIndex(null);
  };

  // 导出辩论记录为 Markdown
  const handleExportMarkdown = (content: string) => {
    if (!session) return;

    const stanceLabel = (stance: string) => {
      switch (stance) {
        case 'pro': return '正方';
        case 'con': return '反方';
        case 'judge': return '裁判';
        default: return '未知';
      }
    };

    const mdContent = session.messages.map((msg) => {
      return `### ${msg.agentName} (${stanceLabel(msg.stance)})\n\n${msg.content}\n\n---\n`;
    }).join('\n');

    const fullContent = `# 辩论主题: ${session.topic}\n\n**辩论时间:** ${new Date().toLocaleString('zh-CN')}\n\n**参与辩手:** ${session.agents.map(a => a.name).join('、')}\n\n---\n\n${mdContent}`;

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `辩论记录_${session.topic.substring(0, 10)}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('辩论记录已导出');
  };

  // Debate handlers
  const handleStartDebate = () => {
    if (!topic.trim()) {
      toast.error('请输入辩论主题');
      return;
    }
    const validAgents = agents.filter((a) => a.apiKey.trim());
    if (validAgents.length === 0) {
      toast.error('请至少为一个辩手配置 API Key');
      return;
    }
    startDebate(topic, validAgents);
    toast.success('辩论开始！');
  };

  // 8-Person Debate handlers
  const handleStartEightPersonDebate = () => {
    if (!topic.trim()) {
      toast.error('请输入辩论主题');
      return;
    }
    if (proDebaters.filter(d => d.apiKey.trim()).length === 0) {
      toast.error('请为正方至少配置一个辩手');
      return;
    }
    if (conDebaters.filter(d => d.apiKey.trim()).length === 0) {
      toast.error('请为反方至少配置一个辩手');
      return;
    }
    startEightPersonDebate(topic, proDebaters, conDebaters);
    toast.success('8人制辩论开始！');
  };

  // Format topic for display
  const formatTopic = (t: string) => {
    return t || '自由辩论';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--wolf-paper, #f4efea)' }}>
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      {/* Wolf-style Game Mode Selector - Yellow bar */}
      <div
        className="py-2 px-4 flex items-center justify-center gap-4"
        style={{
          backgroundColor: '#ffde00',
          borderBottom: '2px solid #454341',
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: '#3e3d3c' }}
        >
          模式选择：
        </span>
        <div className="flex gap-1">
          <Link href="/">
            <Button
              size="sm"
              className="wolf-hard-shadow-button h-7 px-3 text-[0.62rem] font-mono uppercase tracking-wider"
              style={{
                backgroundColor: !usePathname()?.startsWith('/wolf') ? '#3e3d3c' : '#fbf7f2',
                color: !usePathname()?.startsWith('/wolf') ? '#fbf7f2' : '#3e3d3c',
                border: '2px solid #454341',
                borderRadius: 0,
              }}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              AI辩论
            </Button>
          </Link>
          <Link href="/wolf">
            <Button
              size="sm"
              className="wolf-hard-shadow-button h-7 px-3 text-[0.62rem] font-mono uppercase tracking-wider"
              style={{
                backgroundColor: usePathname()?.startsWith('/wolf') ? '#3e3d3c' : '#fbf7f2',
                color: usePathname()?.startsWith('/wolf') ? '#fbf7f2' : '#3e3d3c',
                border: '2px solid #454341',
                borderRadius: 0,
              }}
            >
              狼人杀
            </Button>
          </Link>
        </div>
      </div>

      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full" style={{ maxWidth: '1600px', margin: '0 auto' }}>
            {/* Left Panel - Configuration */}
            <div className="flex flex-col gap-4 overflow-hidden">
            {/* Topic Input - Wolf Panel Style */}
            <div
              className="wolf-debate-panel"
            >
              <div
                className="wolf-debate-panel-header flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" style={{ color: '#3e3d3c' }} />
                  <span
                    className="font-semibold text-sm"
                    style={{ color: '#3e3d3c' }}
                  >
                    辩论主题
                  </span>
                </div>
                {/* Mode Toggle - Wolf Style */}
                <div className="wolf-debate-mode-toggle flex gap-0">
                  <button
                    onClick={() => setDebateMode('2person')}
                    className={`wolf-debate-mode-toggle-button px-3 py-1 ${
                      debateMode === '2person' ? 'wolf-debate-mode-toggle-button-active' : ''
                    }`}
                    style={{
                      backgroundColor: debateMode === '2person' ? '#6fc2ff' : 'transparent',
                      color: '#3e3d3c',
                    }}
                  >
                    2人制
                  </button>
                  <button
                    onClick={() => setDebateMode('8person')}
                    className={`wolf-debate-mode-toggle-button px-3 py-1 ${
                      debateMode === '8person' ? 'wolf-debate-mode-toggle-button-active' : ''
                    }`}
                    style={{
                      backgroundColor: debateMode === '8person' ? '#6fc2ff' : 'transparent',
                      color: '#3e3d3c',
                    }}
                  >
                    8人制
                  </button>
                </div>
              </div>
              <div className="wolf-debate-panel-content">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例如：AI 是否会取代人类？"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={session?.isRunning}
                    className="wolf-debate-topic-input flex-1 h-9 px-3 text-sm"
                  />
                  {!session ? (
                    <Button
                      onClick={debateMode === '2person' ? handleStartDebate : handleStartEightPersonDebate}
                      className="wolf-hard-shadow-button wolf-debate-control-primary h-9 px-4 text-[0.68rem]"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      开始
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Agent List - Wolf Panel */}
            {debateMode === '2person' ? (
              /* 2-Person Mode */
              <div className="wolf-debate-panel flex-1 flex flex-col overflow-hidden">
                <div
                  className="wolf-debate-panel-header flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: '#3e3d3c' }} />
                    <span
                      className="font-semibold text-sm"
                      style={{ color: '#3e3d3c' }}
                    >
                      辩手列表
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-[0.56rem] uppercase tracking-wider"
                    style={{
                      border: '1px solid #454341',
                      backgroundColor: '#fbf7f2',
                      color: '#3e3d3c',
                    }}
                  >
                    {agents.length} 人
                  </Badge>
                </div>
                <div className="wolf-debate-panel-content flex-1 overflow-hidden">
                  <ScrollArea className="wolf-debate-scroll h-[300px] pr-3">
                    <div className="space-y-2">
                      {agents.map((agent, index) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          index={index}
                          onEdit={handleEditAgent}
                          onDelete={handleDeleteAgent}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      ))}

                      {agents.length === 0 && (
                        <div
                          className="wolf-debate-empty text-center py-8"
                        >
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: '#5f5b57' }} />
                          <p style={{ color: '#5f5b57' }}>暂无辩手</p>
                          <p className="text-xs mt-1" style={{ color: '#5f5b57' }}>点击下方按钮添加辩手</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Agent Buttons - Wolf Style */}
                  <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(69,67,65,0.18)' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('pro')}
                      className="flex-1 wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                      style={{
                        border: '2px solid #454341',
                        borderRadius: 0,
                        backgroundColor: '#53dbc9',
                        color: '#3e3d3c',
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      正方
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('con')}
                      className="flex-1 wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                      style={{
                        border: '2px solid #454341',
                        borderRadius: 0,
                        backgroundColor: '#ff7169',
                        color: '#3e3d3c',
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      反方
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('judge')}
                      className="flex-1 wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                      style={{
                        border: '2px solid #454341',
                        borderRadius: 0,
                        backgroundColor: '#ffde00',
                        color: '#3e3d3c',
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      裁判
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* 8-Person Mode - Team-based layout */
              <div className="wolf-debate-panel flex-1 flex flex-col overflow-hidden">
                <div
                  className="wolf-debate-panel-header flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4" style={{ color: '#3e3d3c' }} />
                    <span
                      className="font-semibold text-sm"
                      style={{ color: '#3e3d3c' }}
                    >
                      辩手列表 (8人制)
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-[0.56rem] uppercase tracking-wider"
                    style={{
                      border: '1px solid #454341',
                      backgroundColor: '#fbf7f2',
                      color: '#3e3d3c',
                    }}
                  >
                    {proDebaters.length + conDebaters.length} / 8 人
                  </Badge>
                </div>
                <div className="wolf-debate-panel-content flex-1 overflow-hidden">
                  <ScrollArea className="wolf-debate-scroll h-[300px] pr-3">
                    <div className="space-y-4">
                      {/* Pro Team */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                          <Users className="w-3 h-3" style={{ color: '#6fc2ff' }} />
                          正方辩手 (4人)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['first', 'second', 'third', 'fourth'] as DebaterRole[]).map((role) => {
                            const debater = proDebaters.find(d => d.role === role);
                            return (
                              <div
                                key={`pro-${role}`}
                                className="wolf-debate-agent-card p-2 cursor-pointer"
                                onClick={() => {
                                  if (debater) {
                                    handleEditDebater(debater);
                                  } else {
                                    handleAddDebater(role, 'pro');
                                  }
                                }}
                              >
                                <div className="text-xs font-mono uppercase" style={{ color: '#3e3d3c' }}>
                                  {role === 'first' ? '一辩' : role === 'second' ? '二辩' : role === 'third' ? '三辩' : '四辩'}
                                </div>
                                <div className="text-xs truncate" style={{ color: '#5f5b57' }}>
                                  {debater?.name || '点击添加辩手'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Con Team */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                          <Users className="w-3 h-3" style={{ color: '#ff7169' }} />
                          反方辩手 (4人)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['first', 'second', 'third', 'fourth'] as DebaterRole[]).map((role) => {
                            const debater = conDebaters.find(d => d.role === role);
                            return (
                              <div
                                key={`con-${role}`}
                                className="wolf-debate-agent-card p-2 cursor-pointer"
                                onClick={() => {
                                  if (debater) {
                                    handleEditDebater(debater);
                                  } else {
                                    handleAddDebater(role, 'con');
                                  }
                                }}
                              >
                                <div className="text-xs font-mono uppercase" style={{ color: '#3e3d3c' }}>
                                  {role === 'first' ? '一辩' : role === 'second' ? '二辩' : role === 'third' ? '三辩' : '四辩'}
                                </div>
                                <div className="text-xs truncate" style={{ color: '#5f5b57' }}>
                                  {debater?.name || '点击添加辩手'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Debate - Wolf Panel */}
          <div className="wolf-debate-panel flex flex-col h-full overflow-hidden">
            <div
              className="wolf-debate-panel-header flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" style={{ color: '#3e3d3c' }} />
                <span
                  className="font-semibold text-sm"
                  style={{ color: '#3e3d3c' }}
                >
                  辩论现场
                </span>
              </div>
              {session && (
                <div className="flex items-center gap-2">
                  <Badge
                    className="wolf-debate-stage-badge px-2 py-0.5"
                    style={{
                      backgroundColor: '#fbf7f2',
                      color: '#3e3d3c',
                    }}
                  >
                    {formatTopic(session.topic)}
                  </Badge>
                  {session.messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportMarkdown('')}
                      className="h-6 text-[0.56rem] font-mono uppercase"
                      style={{
                        border: '1px solid #454341',
                        borderRadius: 0,
                        backgroundColor: '#fbf7f2',
                        color: '#3e3d3c',
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      导出
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="wolf-debate-panel-content flex-1 flex flex-col overflow-hidden p-0">
              {!session ? (
                <div className="wolf-debate-empty flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#5f5b57' }} />
                    <p className="text-base font-medium" style={{ color: '#3e3d3c' }}>等待开始辩论</p>
                    <p className="text-sm mt-2" style={{ color: '#5f5b57' }}>设置主题并点击开始按钮</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Controls - Wolf Style */}
                  <div className="p-3" style={{ borderBottom: '2px solid #454341' }}>
                    <DebateControls
                      session={session}
                      isLoading={isLoading}
                      currentStreamingContent={currentStreamingContent}
                      onStart={() => startDebate(topic, agents)}
                      onPause={pauseDebate}
                      onResume={resumeDebate}
                      onReset={resetDebate}
                      onStop={stopDebate}
                      onSkip={debateMode === '8person' ? generateNextStage : generateNextTurn}
                      currentStageId={debateMode === '8person' ? currentStageId : undefined}
                      onNextStage={debateMode === '8person' ? generateNextStage : undefined}
                    />
                  </div>

                  {/* 当前环节和发言辩手提示 - Wolf Style */}
                  {debateMode === '8person' && session && (
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{
                        backgroundColor: '#ede7e1',
                        borderBottom: '1px solid rgba(69,67,65,0.18)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-mono uppercase tracking-wider"
                          style={{ color: '#3e3d3c' }}
                        >
                          第 {currentStageId} 环节: {getCurrentStage()?.speechTypeLabel || '进行中'}
                        </span>
                        {getCurrentSpeaker() && (
                          <span
                            className="px-2 py-0.5 text-[0.54rem] font-mono uppercase"
                            style={{
                              backgroundColor: getCurrentSpeaker()?.team === 'pro' ? '#6fc2ff' : '#ff7169',
                              color: '#3e3d3c',
                              border: '1px solid #454341',
                            }}
                          >
                            {getCurrentSpeaker()?.name} 正在发言
                          </span>
                        )}
                      </div>
                      {session.isRunning && (
                        <span
                          className="text-[0.54rem] font-mono uppercase flex items-center gap-1"
                          style={{ color: '#53dbc9' }}
                        >
                          <span
                            className="w-2 h-2"
                            style={{ backgroundColor: '#53dbc9' }}
                          ></span>
                          进行中
                        </span>
                      )}
                    </div>
                  )}

                  {/* Messages - Wolf Scroll */}
                  <ScrollArea className="wolf-debate-scroll flex-1 min-h-[300px]">
                    <div className="p-3 space-y-3" id="debate-messages">
                      {session.messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          onExport={handleExportMarkdown}
                          isCrossExamStage={debateMode === '8person' && message.stageId !== undefined && message.stageId >= 5 && message.stageId <= 8}
                          crossExamGroup={crossExamState.currentGroup}
                        />
                      ))}

                      {/* Streaming content preview */}
                      {currentStreamingContent && (
                        <MessageBubble
                          message={{
                            id: 'streaming',
                            agentId: debateMode === '8person' ? (getCurrentSpeaker()?.id || 'unknown') : (session.agents[session.currentAgentIndex]?.id || 'unknown'),
                            agentName: debateMode === '8person' ? (getCurrentSpeaker()?.name || '匿名辩手') : (session.agents[session.currentAgentIndex]?.name || '匿名辩手'),
                            stance: debateMode === '8person' ? (getCurrentSpeaker()?.team || 'pro') : (session.agents[session.currentAgentIndex]?.stance || 'pro'),
                            content: currentStreamingContent,
                            timestamp: (session.messages[session.messages.length - 1]?.timestamp ?? 0),
                          }}
                          isStreaming={true}
                          isCrossExamStage={debateMode === '8person' && crossExamState.isActive}
                        />
                      )}

                      {isLoading && !currentStreamingContent && (
                        <div
                          className="wolf-debate-streaming flex items-center gap-2 px-3 py-2 inline-flex"
                          style={{ width: 'auto', display: 'inline-flex' }}
                        >
                          <span className="w-2 h-2" style={{ backgroundColor: '#6fc2ff' }}></span>
                          <span className="w-2 h-2" style={{ backgroundColor: '#6fc2ff' }}></span>
                          <span className="w-2 h-2" style={{ backgroundColor: '#6fc2ff' }}></span>
                          <span>AI 正在思考...</span>
                        </div>
                      )}

                      {/* 观众提问交互组件 - Wolf Style */}
                      {debateMode === '8person' && audienceQAState.isActive && !audienceQAState.waitingForAnswer && (
                        <div className="wolf-debate-audience-qa p-4 space-y-3">
                          <div className="flex items-center gap-2" style={{ color: '#3e3d3c' }}>
                            <HelpCircle className="w-4 h-4" />
                            <span className="font-medium text-sm">🙋 观众提问环节</span>
                            <span className="text-xs" style={{ color: '#5f5b57' }}>
                              (正在向{audienceQAState.currentQuestion?.targetTeam === 'pro' ? '正方' : '反方'}提问)
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={startGenerateAIQuestion}
                                disabled={isLoading}
                                className="wolf-hard-shadow-button text-[0.58rem] font-mono uppercase"
                                style={{
                                  backgroundColor: audienceQAState.questionSource === 'ai' ? '#6fc2ff' : '#fbf7f2',
                                  color: '#3e3d3c',
                                  border: '2px solid #454341',
                                  borderRadius: 0,
                                }}
                              >
                                🤖 AI生成问题
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  document.getElementById('audience-question-input')?.focus();
                                }}
                                className="wolf-hard-shadow-button text-[0.58rem] font-mono uppercase"
                                style={{
                                  backgroundColor: audienceQAState.questionSource === 'user' ? '#6fc2ff' : '#fbf7f2',
                                  color: '#3e3d3c',
                                  border: '2px solid #454341',
                                  borderRadius: 0,
                                }}
                              >
                                ✍️ 用户输入
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <input
                                id="audience-question-input"
                                type="text"
                                placeholder="请输入您想向辩手提出的问题...（按Enter发送）"
                                className="wolf-debate-input w-full h-8 px-3 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = (e.target as HTMLInputElement).value;
                                    if (value.trim()) {
                                      submitUserQuestion(value.trim());
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <p className="text-[0.54rem]" style={{ color: '#5f5b57' }}>
                                按 Enter 键提交问题，或切换到 AI 生成模式
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 观众提问等待回答 - Wolf Style */}
                      {debateMode === '8person' && audienceQAState.isActive && audienceQAState.waitingForAnswer && audienceQAState.currentQuestion && (
                        <div className="wolf-debate-audience-qa p-4 space-y-3">
                          <div className="flex items-center gap-2" style={{ color: '#3e3d3c' }}>
                            <HelpCircle className="w-4 h-4" />
                            <span className="font-medium text-sm">🙋 观众提问</span>
                          </div>
                          <div
                            className="p-3"
                            style={{
                              backgroundColor: '#fbf7f2',
                              border: '2px solid #454341',
                            }}
                          >
                            <p style={{ color: '#3e3d3c' }}>
                              {audienceQAState.currentQuestion.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#5f5b57' }}>
                            <span>问题来源：{audienceQAState.questionSource === 'ai' ? 'AI生成' : '用户输入'}</span>
                          </div>
                        </div>
                      )}

                      {/* 自由辩论环节 UI - Wolf Style */}
                      {debateMode === '8person' && freeDebateState.isActive && (
                        <div className="wolf-debate-free-section p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⚡</span>
                              <span className="font-bold text-sm" style={{ color: '#3e3d3c' }}>自由辩论</span>
                              <span className="text-xs" style={{ color: '#5f5b57' }}>
                                (第{Math.ceil(freeDebateState.currentRound / 2)}轮 / 共{freeDebateState.maxRounds}轮)
                              </span>
                            </div>
                            <span
                              className="px-2 py-0.5 text-[0.54rem] font-mono uppercase"
                              style={{
                                backgroundColor: freeDebateState.currentTeam === 'pro' ? '#6fc2ff' : '#ff7169',
                                color: '#3e3d3c',
                                border: '1px solid #454341',
                              }}
                            >
                              {freeDebateState.currentTeam === 'pro' ? '正方发言' : '反方发言'}
                            </span>
                          </div>

                          {/* 剩余发言次数 */}
                          <div className="flex justify-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-1" style={{ color: '#3e3d3c' }}>
                              <div className="w-2 h-2" style={{ backgroundColor: '#6fc2ff' }}></div>
                              <span>正方剩余: {freeDebateState.maxRounds - Math.ceil(freeDebateState.currentRound / 2) + (freeDebateState.currentTeam === 'con' ? 1 : 0)}次</span>
                            </div>
                            <div className="flex items-center gap-1" style={{ color: '#3e3d3c' }}>
                              <div className="w-2 h-2" style={{ backgroundColor: '#ff7169' }}></div>
                              <span>反方剩余: {freeDebateState.maxRounds - Math.floor((freeDebateState.currentRound - 1) / 2)}次</span>
                            </div>
                          </div>

                          {/* 时间轴展示 */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {freeDebateState.messages.map((msg, idx) => (
                              <div
                                key={msg.id}
                                className="flex"
                                style={{ justifyContent: msg.team === 'pro' ? 'flex-start' : 'flex-end' }}
                              >
                                <div
                                  className="max-w-[80%] p-2 text-xs"
                                  style={{
                                    backgroundColor: msg.team === 'pro' ? '#6fc2ff' : '#ff7169',
                                    color: '#3e3d3c',
                                    border: '2px solid #454341',
                                    opacity: msg.content === '【放弃发言】' ? 0.5 : 1,
                                  }}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="font-mono text-[0.5rem] uppercase">{msg.speakerName}</span>
                                    <span className="text-[0.5rem]">第{Math.ceil(msg.round / 2)}轮</span>
                                  </div>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 控制按钮 */}
                          <div className="flex justify-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(69,67,65,0.18)' }}>
                            {!freeDebateState.isWaitingForResponse ? (
                              <>
                                <Button
                                  onClick={startNextFreeDebateRound}
                                  disabled={isLoading}
                                  className="wolf-hard-shadow-button text-[0.58rem] font-mono uppercase"
                                  style={{
                                    backgroundColor: freeDebateState.currentTeam === 'pro' ? '#6fc2ff' : '#ff7169',
                                    color: '#3e3d3c',
                                    border: '2px solid #454341',
                                    borderRadius: 0,
                                  }}
                                >
                                  {freeDebateState.currentTeam === 'pro' ? '正方发言' : '反方发言'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleFreeDebateSkip}
                                  disabled={isLoading}
                                  className="text-[0.58rem] font-mono uppercase"
                                  style={{
                                    border: '2px solid #454341',
                                    borderRadius: 0,
                                    backgroundColor: '#fbf7f2',
                                    color: '#3e3d3c',
                                  }}
                                >
                                  放弃发言
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-xs" style={{ color: '#5f5b57' }}>
                                <div
                                  className="w-4 h-4 border-2"
                                  style={{ borderColor: '#454341', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}
                                ></div>
                                <span>AI思考中...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {session.messages.length === 0 && !isLoading && !currentStreamingContent && (
                        <div className="text-center py-8">
                          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: '#5f5b57' }} />
                          <p style={{ color: '#5f5b57' }}>点击「下一轮」开始辩论</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Agent Dialog - Wolf Style */}
      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            backgroundColor: '#fbf7f2',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <DialogHeader
            style={{
              borderBottom: '2px solid #454341',
              padding: '0.75rem 1rem',
            }}
          >
            <DialogTitle
              className="font-mono uppercase text-sm tracking-wider"
              style={{ color: '#3e3d3c' }}
            >
              {editingAgent?.name ? '编辑辩手' : '添加辩手'}
            </DialogTitle>
          </DialogHeader>
          {editingAgent && (
            <AgentForm
              agent={editingAgent}
              onSave={handleSaveAgent}
              onCancel={() => {
                setIsAgentDialogOpen(false);
                setEditingAgent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Debater Dialog (8-Person Mode) - Wolf Style */}
      <Dialog open={isDebaterDialogOpen} onOpenChange={setIsDebaterDialogOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            backgroundColor: '#fbf7f2',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <DialogHeader
            style={{
              borderBottom: '2px solid #454341',
              padding: '0.75rem 1rem',
            }}
          >
            <DialogTitle
              className="font-mono uppercase text-sm tracking-wider"
              style={{ color: '#3e3d3c' }}
            >
              {editingDebater?.name ? '编辑辩手' : '添加辩手'}
            </DialogTitle>
          </DialogHeader>
          {editingDebater && (
            <DebaterForm
              debater={editingDebater}
              onSave={handleSaveDebater}
              onCancel={() => {
                setIsDebaterDialogOpen(false);
                setEditingDebater(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog - Wolf Style */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent
          className="max-w-md"
          style={{
            backgroundColor: '#fbf7f2',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <DialogHeader
            style={{
              borderBottom: '2px solid #454341',
              padding: '0.75rem 1rem',
            }}
          >
            <DialogTitle
              className="font-mono uppercase text-sm tracking-wider"
              style={{ color: '#3e3d3c' }}
            >
              默认 API 设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-sm" style={{ color: '#5f5b57' }}>
              设置默认的 API 配置，新添加的辩手将自动使用这些配置。
            </p>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>Base URL</label>
              <input
                type="text"
                value={defaultBaseUrl}
                onChange={(e) => setDefaultBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="wolf-debate-input w-full h-9 px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>API Key</label>
              <input
                type="password"
                value={defaultApiKey}
                onChange={(e) => setDefaultApiKey(e.target.value)}
                placeholder="sk-..."
                className="wolf-debate-input w-full h-9 px-3 text-sm"
              />
            </div>
            <p className="text-[0.54rem]" style={{ color: '#5f5b57' }}>
              API Key 仅存储在浏览器本地，不会上传至任何服务器。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
