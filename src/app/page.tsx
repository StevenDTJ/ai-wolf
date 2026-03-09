'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { MessageSquare, Plus, Send, Users } from 'lucide-react';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { AgentForm } from '@/components/agent-form';
import { MessageBubble } from '@/components/message-bubble';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import { AgentConfig, Stance } from '@/types';
import {
  buildTwoPersonRosterRows,
  getTwoPersonComposerState,
  getTwoPersonFrameSpec,
  getTwoPersonIdleSpec,
  getTwoPersonRailState,
  isTwoPersonLaunchEnabled,
} from '@/lib/debate-stage-layout';

export default function Home() {
  const pathname = usePathname();

  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    const saved = loadAgentsFromStorage();
    if (saved.length > 0) return saved;
    return [
      { ...createDefaultAgent('pro'), name: '正方一辩', model: 'gpt-4o-mini' },
      { ...createDefaultAgent('con'), name: '反方一辩', model: 'gpt-4o-mini' },
    ];
  });
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [debateMode, setDebateMode] = useState<'2person' | '8person'>('2person');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('https://api.openai.com/v1');
  const [defaultApiKey, setDefaultApiKey] = useState('');
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

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
    stopGeneration,
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

  const hasConfiguredPro = agents.some((agent) => agent.stance === 'pro' && agent.apiKey.trim().length > 0);
  const hasConfiguredCon = agents.some((agent) => agent.stance === 'con' && agent.apiKey.trim().length > 0);
  const canLaunch = isTwoPersonLaunchEnabled(topic, hasConfiguredPro, hasConfiguredCon);
  const composerState = getTwoPersonComposerState(Boolean(session));
  const frameSpec = getTwoPersonFrameSpec(Boolean(session?.isRunning));
  const idleSpec = getTwoPersonIdleSpec();
  const currentSpeaker = session?.agents[session.currentAgentIndex];
  const railState = getTwoPersonRailState({
    currentTurn: session?.currentTurn ?? 1,
    currentSpeakerName: currentSpeaker?.name ?? '待开始',
    isRunning: Boolean(session?.isRunning),
  });
  const rosterRows = buildTwoPersonRosterRows(
    agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      stance: agent.stance,
      model: agent.model,
      hasApiKey: agent.apiKey.trim().length > 0,
    }))
  );

  const handleAddAgent = (stance: Stance) => {
    setEditingAgent(createDefaultAgent(stance));
    setIsAgentDialogOpen(true);
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

  const handleDeleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
    toast.success('辩手已删除');
  };

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
    const copied = [...agents];
    const [dragged] = copied.splice(dragIndex, 1);
    copied.splice(dropIndex, 0, dragged);
    setAgents(copied);
    setDragIndex(null);
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

  const handleLaunchDebate = () => {
    if (!canLaunch) {
      toast.error('请填写主题并完成正反方配置');
      return;
    }
    const validAgents = agents.filter((agent) => agent.apiKey.trim().length > 0);
    startDebate(topic, validAgents);
    toast.success('辩论开始！');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--wolf-paper, #f4efea)' }}>
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <div
        className="py-2 px-4 flex items-center justify-center gap-4"
        style={{ backgroundColor: '#ffde00', borderBottom: '2px solid #454341' }}
      >
        <span className="text-sm font-medium" style={{ color: '#3e3d3c' }}>
          模式选择：
        </span>
        <div className="flex gap-1">
          <Link href="/">
            <Button
              size="sm"
              className="wolf-hard-shadow-button h-7 px-3 text-[0.62rem] font-mono uppercase tracking-wider"
              style={{
                backgroundColor: !pathname?.startsWith('/wolf') ? '#3e3d3c' : '#fbf7f2',
                color: !pathname?.startsWith('/wolf') ? '#fbf7f2' : '#3e3d3c',
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
                backgroundColor: pathname?.startsWith('/wolf') ? '#3e3d3c' : '#fbf7f2',
                color: pathname?.startsWith('/wolf') ? '#fbf7f2' : '#3e3d3c',
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
        <div className="debate-stage-grid mx-auto h-full max-w-[1600px]">
          <aside className="debate-side-rail debate-side-rail-left">
            <div className="debate-rail-header">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>2人辩手</span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[0.56rem] uppercase tracking-wider"
                style={{ border: '1px solid #454341', backgroundColor: '#fbf7f2', color: '#3e3d3c' }}
              >
                {rosterRows.length} 人
              </Badge>
            </div>
            <div className="debate-rail-body">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {agents.map((agent, index) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      index={index}
                      variant="compact"
                      onEdit={handleEditAgent}
                      onDelete={handleDeleteAgent}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="debate-rail-footer">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddAgent('pro')}
                className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#53dbc9', color: '#3e3d3c' }}
              >
                <Plus className="w-3 h-3 mr-1" />
                正方
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddAgent('con')}
                className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#ff7169', color: '#3e3d3c' }}
              >
                <Plus className="w-3 h-3 mr-1" />
                反方
              </Button>
            </div>
          </aside>

          <section className="debate-stage-shell">
            <header className="debate-stage-header">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: '#3e3d3c' }}>
                  中央辩论舞台
                </span>
                <span className="debate-stage-token">{session?.isRunning ? '进行中' : '准备中'}</span>
              </div>
              <div className="wolf-debate-mode-toggle flex gap-0" data-placement={frameSpec.modeTogglePlacement}>
                <button
                  onClick={() => setDebateMode('2person')}
                  className={`wolf-debate-mode-toggle-button px-3 py-1 ${
                    debateMode === '2person' ? 'wolf-debate-mode-toggle-button-active' : ''
                  }`}
                  style={{ backgroundColor: debateMode === '2person' ? '#6fc2ff' : 'transparent', color: '#3e3d3c' }}
                >
                  2 人
                </button>
                <button
                  onClick={() => {
                    setDebateMode('8person');
                    toast.info('8人模式将在下一次重构中接入同一舞台框架');
                  }}
                  className={`wolf-debate-mode-toggle-button px-3 py-1 ${
                    debateMode === '8person' ? 'wolf-debate-mode-toggle-button-active' : ''
                  }`}
                  style={{ backgroundColor: debateMode === '8person' ? '#6fc2ff' : 'transparent', color: '#3e3d3c' }}
                >
                  8 人
                </button>
              </div>
            </header>

            <div className="debate-stage-body">
              {debateMode === '8person' && (
                <div className="debate-idle-empty">
                  <p>8人模式暂未迁移到新舞台。请先使用 2 人模式。</p>
                </div>
              )}

              {debateMode === '2person' && !session && idleSpec.showMatchupPreview && (
                <div className="debate-idle-preview">
                  <p className="debate-idle-guidance">先完成正反方配置，再从下方输入主题并发起辩论。</p>
                  <div className="debate-matchup">
                    <div className="debate-matchup-row">
                      <span className="debate-team-pill debate-team-pill-pro">正方</span>
                      <span>{rosterRows.find((row) => row.sideLabel === '正方')?.name ?? '待配置'}</span>
                    </div>
                    <div className="debate-matchup-row">
                      <span className="debate-team-pill debate-team-pill-con">反方</span>
                      <span>{rosterRows.find((row) => row.sideLabel === '反方')?.name ?? '待配置'}</span>
                    </div>
                  </div>
                </div>
              )}

              {debateMode === '2person' && session && (
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
                          timestamp: Date.now(),
                        }}
                        isStreaming={true}
                      />
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <footer className="debate-stage-footer" data-placement={frameSpec.composerPlacement}>
              <input
                type="text"
                value={topic}
                readOnly={composerState.mode === 'readonly'}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="例如：AI 是否会取代人类？"
                className="wolf-debate-topic-input debate-stage-composer-input"
              />
              <Button
                size="icon"
                onClick={handleLaunchDebate}
                disabled={Boolean(session) || !canLaunch}
                className="wolf-hard-shadow-button debate-stage-send-button"
                style={{ border: '2px solid #454341', borderRadius: 0 }}
                aria-label="开始辩论"
              >
                <Send className="w-4 h-4" />
              </Button>
            </footer>
          </section>

          <aside className="debate-side-rail debate-side-rail-right">
            <div className="debate-rail-header">
              <span>控制栏</span>
            </div>
            <div className="debate-rail-body">
              <div className="debate-rail-stat">{railState.roundLabel}</div>
              <div className="debate-rail-stat">{railState.speakerLabel}</div>
              <div className="debate-rail-stat">{railState.statusLabel}</div>
              {frameSpec.showVerboseRightRail ? (
                <div className="debate-rail-stat">详细状态</div>
              ) : null}
            </div>
            <div className="debate-rail-footer">
              {session?.isRunning ? (
                <Button
                  size="sm"
                  onClick={pauseDebate}
                  disabled={isLoading || currentStreamingContent.length > 0}
                  className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                  style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#fbf7f2', color: '#3e3d3c' }}
                >
                  暂停
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={resumeDebate}
                  disabled={!session || isLoading}
                  className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                  style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#6fc2ff', color: '#3e3d3c' }}
                >
                  继续
                </Button>
              )}
              <Button
                size="sm"
                onClick={session ? resetDebate : () => {}}
                disabled={!session}
                className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#ede7e1', color: '#3e3d3c' }}
              >
                重置
              </Button>
              <Button
                size="sm"
                onClick={stopGeneration}
                disabled={currentStreamingContent.length === 0}
                className="wolf-hard-shadow-button h-8 text-[0.58rem] font-mono uppercase"
                style={{ border: '2px solid #454341', borderRadius: 0, backgroundColor: '#ff7169', color: '#3e3d3c' }}
              >
                停止生成
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent
          className="max-w-lg"
          style={{ backgroundColor: '#fbf7f2', border: '2px solid #454341', borderRadius: 0 }}
        >
          <DialogHeader style={{ borderBottom: '2px solid #454341', padding: '0.75rem 1rem' }}>
            <DialogTitle className="font-mono uppercase text-sm tracking-wider" style={{ color: '#3e3d3c' }}>
              {editingAgent?.name ? '编辑辩手' : '添加辩手'}
            </DialogTitle>
          </DialogHeader>
          {editingAgent && (
            <AgentForm
              agent={editingAgent}
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
