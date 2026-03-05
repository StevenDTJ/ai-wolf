'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { WolfGame } from '@/components/wolf-game';
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
import { useWolfGame } from '@/hooks/useWolfGame';
import { AgentConfig, Stance, DEFAULT_MODELS, Debater, DebaterRole, TeamSide, DEBATE_FLOW } from '@/types';
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
  Ghost,
} from 'lucide-react';
import { toast } from 'sonner';

// 游戏模式类型
type GameMode = 'debate' | 'wolf';

export default function Home() {
  // 游戏模式
  const [gameMode, setGameMode] = useState<GameMode>('debate');

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

  // Wolf game hook
  const wolf = useWolfGame();


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
    <div className="min-h-screen flex flex-col">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      {/* Game Mode Selector */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-3 px-4">
        <div className="container flex items-center justify-center gap-4">
          <span className="text-white/80 text-sm">选择游戏模式：</span>
          <div className="flex gap-2">
            <Button
              variant={gameMode === 'debate' ? 'default' : 'outline'}
              size="sm"
              className={gameMode === 'debate' ? 'bg-white text-blue-600 hover:bg-white/90' : 'text-white border-white/30 hover:bg-white/10'}
              onClick={() => setGameMode('debate')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI辩论
            </Button>
            <Button
              variant={gameMode === 'wolf' ? 'default' : 'outline'}
              size="sm"
              className={gameMode === 'wolf' ? 'bg-white text-red-600 hover:bg-white/90' : 'text-white border-white/30 hover:bg-white/10'}
              onClick={() => setGameMode('wolf')}
            >
              <Ghost className="w-4 h-4 mr-2" />
              狼人杀
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-6 px-4">
        {gameMode === 'wolf' ? (
          /* Wolf Game Mode */
          <div className="h-[calc(100vh-12rem)]">
            <WolfGame wolf={wolf} />
          </div>
        ) : (
          /* Debate Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Panel - Configuration */}
            <div className="flex flex-col gap-4 overflow-hidden">
            {/* Topic Input */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    辩论主题
                  </CardTitle>
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                    <Button
                      variant={debateMode === '2person' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setDebateMode('2person')}
                    >
                      2人制
                    </Button>
                    <Button
                      variant={debateMode === '8person' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setDebateMode('8person')}
                    >
                      8人制
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="例如：AI 是否会取代人类？"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={session?.isRunning}
                  />
                  {!session ? (
                    <Button onClick={debateMode === '2person' ? handleStartDebate : handleStartEightPersonDebate}>
                      <Play className="w-4 h-4 mr-2" />
                      开始
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Agent List */}
            {debateMode === '2person' ? (
              /* 2-Person Mode */
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      辩手列表
                    </CardTitle>
                    <Badge variant="outline">
                      {agents.length} 人
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
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
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>暂无辩手</p>
                          <p className="text-sm">点击下方按钮添加辩手</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Agent Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('pro')}
                      className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      正方
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('con')}
                      className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      反方
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAgent('judge')}
                      className="flex-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      裁判
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* 8-Person Mode - Team-based layout */
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users2 className="w-4 h-4" />
                      辩手列表 (8人制)
                    </CardTitle>
                    <Badge variant="outline">
                      {proDebaters.length + conDebaters.length} / 8 人
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {/* Pro Team */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                          <Users className="w-4 h-4" />
                          正方辩手 (4人)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['first', 'second', 'third', 'fourth'] as DebaterRole[]).map((role) => {
                            const debater = proDebaters.find(d => d.role === role);
                            return (
                              <div
                                key={`pro-${role}`}
                                className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                  debater
                                    ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'
                                    : 'border-dashed border-muted hover:border-blue-500/50'
                                }`}
                                onClick={() => {
                                  if (debater) {
                                    handleEditDebater(debater);
                                  } else {
                                    handleAddDebater(role, 'pro');
                                  }
                                }}
                              >
                                <div className="text-xs font-medium text-blue-700">
                                  {role === 'first' ? '一辩' : role === 'second' ? '二辩' : role === 'third' ? '三辩' : '四辩'}
                                </div>
                                <div className="text-xs text-gray-700 truncate">
                                  {debater?.name || '点击添加辩手'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Con Team */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                          <Users className="w-4 h-4" />
                          反方辩手 (4人)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['first', 'second', 'third', 'fourth'] as DebaterRole[]).map((role) => {
                            const debater = conDebaters.find(d => d.role === role);
                            return (
                              <div
                                key={`con-${role}`}
                                className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                  debater
                                    ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                    : 'border-dashed border-muted hover:border-red-500/50'
                                }`}
                                onClick={() => {
                                  if (debater) {
                                    handleEditDebater(debater);
                                  } else {
                                    handleAddDebater(role, 'con');
                                  }
                                }}
                              >
                                <div className="text-xs font-medium text-red-700">
                                  {role === 'first' ? '一辩' : role === 'second' ? '二辩' : role === 'third' ? '三辩' : '四辩'}
                                </div>
                                <div className="text-xs text-gray-700 truncate">
                                  {debater?.name || '点击添加辩手'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Debate */}
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  辩论现场
                </CardTitle>
                {session && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary">
                      {formatTopic(session.topic)}
                    </Badge>
                    {session.messages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportMarkdown('')}
                        className="h-7 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        导出
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              {!session ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">等待开始辩论</p>
                    <p className="text-sm mt-2">设置主题并点击开始按钮</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Controls */}
                  <div className="p-4 border-b">
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

                  {/* 当前环节和发言辩手提示 */}
                  {debateMode === '8person' && session && (
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-red-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            第 {currentStageId} 环节: {getCurrentStage()?.speechTypeLabel || '进行中'}
                          </span>
                          {getCurrentSpeaker() && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              getCurrentSpeaker()?.team === 'pro'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                              {getCurrentSpeaker()?.name} 正在发言
                            </span>
                          )}
                        </div>
                        {session.isRunning && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            进行中
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 min-h-[300px]">
                    <div className="p-4 space-y-4" id="debate-messages">
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
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span>AI 正在思考...</span>
                        </div>
                      )}

                      {/* 观众提问交互组件 */}
                      {debateMode === '8person' && audienceQAState.isActive && !audienceQAState.waitingForAnswer && (
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">🙋 观众提问环节</span>
                            <span className="text-sm text-gray-600">
                              (正在向{audienceQAState.currentQuestion?.targetTeam === 'pro' ? '正方' : '反方'}提问)
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={audienceQAState.questionSource === 'ai' ? 'default' : 'outline'}
                                onClick={startGenerateAIQuestion}
                                disabled={isLoading}
                              >
                                🤖 AI生成问题
                              </Button>
                              <Button
                                size="sm"
                                variant={audienceQAState.questionSource === 'user' ? 'default' : 'outline'}
                                onClick={() => {
                                  // 聚焦到输入框
                                  document.getElementById('audience-question-input')?.focus();
                                }}
                              >
                                ✍️ 用户输入
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Input
                                id="audience-question-input"
                                placeholder="请输入您想向辩手提出的问题...（按Enter发送）"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = (e.target as HTMLInputElement).value;
                                    if (value.trim()) {
                                      // 提交问题并触发回答生成
                                      submitUserQuestion(value.trim());
                                      // 清空输入框
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-600">
                                按 Enter 键提交问题，或切换到 AI 生成模式
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 观众提问等待回答 */}
                      {debateMode === '8person' && audienceQAState.isActive && audienceQAState.waitingForAnswer && audienceQAState.currentQuestion && (
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">🙋 观众提问</span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-gray-800">
                            {audienceQAState.currentQuestion.content}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>问题来源：{audienceQAState.questionSource === 'ai' ? 'AI生成' : '用户输入'}</span>
                          </div>
                        </div>
                      )}

                      {/* 自由辩论环节 UI */}
                      {debateMode === '8person' && freeDebateState.isActive && (
                        <div className="bg-gradient-to-r from-blue-50 to-red-50 border border-gray-300 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⚡</span>
                              <span className="font-bold text-gray-800">自由辩论</span>
                              <span className="text-sm text-gray-600">
                                (第{Math.ceil(freeDebateState.currentRound / 2)}轮 / 共{freeDebateState.maxRounds}轮)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                freeDebateState.currentTeam === 'pro'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-red-100 text-red-700 border border-red-300'
                              }`}>
                                {freeDebateState.currentTeam === 'pro' ? '正方发言' : '反方发言'}
                              </span>
                            </div>
                          </div>

                          {/* 剩余发言次数 */}
                          <div className="flex justify-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-gray-700">正方剩余: {freeDebateState.maxRounds - Math.ceil(freeDebateState.currentRound / 2) + (freeDebateState.currentTeam === 'con' ? 1 : 0)}次</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-gray-700">反方剩余: {freeDebateState.maxRounds - Math.floor((freeDebateState.currentRound - 1) / 2)}次</span>
                            </div>
                          </div>

                          {/* 时间轴展示 */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {freeDebateState.messages.map((msg, idx) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.team === 'pro' ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                    msg.team === 'pro'
                                      ? 'bg-blue-100 border border-blue-300 text-blue-800'
                                      : 'bg-red-100 border border-red-300 text-red-800'
                                  } ${msg.content === '【放弃发言】' ? 'opacity-50 italic' : ''}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs">{msg.speakerName}</span>
                                    <span className="text-xs opacity-70">第{Math.ceil(msg.round / 2)}轮</span>
                                  </div>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 控制按钮 */}
                          <div className="flex justify-center gap-3 pt-2 border-t">
                            {!freeDebateState.isWaitingForResponse ? (
                              <>
                                <Button
                                  onClick={startNextFreeDebateRound}
                                  disabled={isLoading}
                                  className={freeDebateState.currentTeam === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
                                >
                                  {freeDebateState.currentTeam === 'pro' ? '正方发言' : '反方发言'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleFreeDebateSkip}
                                  disabled={isLoading}
                                >
                                  放弃发言
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>AI思考中...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {session.messages.length === 0 && !isLoading && !currentStreamingContent && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>点击「下一轮」开始辩论</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </main>

      {/* Agent Dialog */}
      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
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

      {/* Debater Dialog (8-Person Mode) */}
      <Dialog open={isDebaterDialogOpen} onOpenChange={setIsDebaterDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
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

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>默认 API 设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              设置默认的 API 配置，新添加的辩手将自动使用这些配置。
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base URL</label>
              <Input
                value={defaultBaseUrl}
                onChange={(e) => setDefaultBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={defaultApiKey}
                onChange={(e) => setDefaultApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              API Key 仅存储在浏览器本地，不会上传至任何服务器。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}