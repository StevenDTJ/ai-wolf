'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UseWolfGameReturn,
  createDefaultWolfPlayer,
  saveWolfPlayersToStorage,
} from '@/hooks/useWolfGame';
import { ActionPanel } from '@/components/wolf-game/action-panel';
import { PlayersPanel } from '@/components/wolf-game/players-panel';
import { TimelinePanel } from '@/components/wolf-game/timeline-panel';
import { shouldAutoAdvanceWolfGame } from '@/components/wolf-game/auto-advance';
import { formatEventText, getPhaseMeta, summarizePlayerRoster } from '@/lib/wolf-game-ui';
import { WolfMessage, WolfPlayer, WolfRole } from '@/types';
import {
  FolderOpen,
  Loader2,
  MessageSquareText,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface WolfPlayerPreset {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string;
}

interface WolfGameProps {
  wolf: UseWolfGameReturn;
}

export function WolfGame({ wolf }: WolfGameProps) {
  const {
    session,
    players,
    playersInitialized,
    isLoading,
    error,
    currentStreamingContent,
    currentMessageType,
    pendingTransition,
    uiEvents,
    addPlayer,
    updatePlayer,
    removePlayer,
    initGame,
    nextAction,
    continueTransition,
    resetGame,
  } = wolf;

  const [editingPlayer, setEditingPlayer] = useState<WolfPlayer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'villager' as 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter',
    model: '',
    baseUrl: '',
    apiKey: '',
  });
  const [presets, setPresets] = useState<WolfPlayerPreset[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('wolfPlayerPresets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetMode, setPresetMode] = useState<'save' | 'load'>('save');

  const savePresets = (newPresets: WolfPlayerPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('wolfPlayerPresets', JSON.stringify(newPresets));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('请输入预设名称');
      return;
    }
    const newPreset: WolfPlayerPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      model: editForm.model,
      baseUrl: editForm.baseUrl,
      apiKey: editForm.apiKey,
    };
    savePresets([...presets, newPreset]);
    setPresetName('');
    setPresetDialogOpen(false);
    toast.success(`已保存预设 "${presetName}"`);
  };

  const handleApplyPreset = (preset: WolfPlayerPreset) => {
    setEditForm({
      ...editForm,
      model: preset.model,
      baseUrl: preset.baseUrl,
      apiKey: preset.apiKey,
    });
    setPresetDialogOpen(false);
    toast.success(`已应用预设 "${preset.name}"`);
  };

  const handleDeletePreset = (presetId: string) => {
    const newPresets = presets.filter(p => p.id !== presetId);
    savePresets(newPresets);
    toast.success('预设已删除');
  };

  useEffect(() => {
    if (!playersInitialized || players.length > 0) {
      return;
    }

    const defaultPlayers = Array.from({ length: 8 }, (_, i) => createDefaultWolfPlayer(i + 1));
    defaultPlayers.forEach(p => addPlayer(p));
  }, [playersInitialized, players.length, addPlayer]);

  useEffect(() => {
    if (players.length > 0) {
      saveWolfPlayersToStorage(players);
    }
  }, [players]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!shouldAutoAdvanceWolfGame(session, isLoading, pendingTransition)) {
      return;
    }

    const timer = setTimeout(() => {
      void nextAction();
    }, 0);

    return () => clearTimeout(timer);
  }, [session, isLoading, pendingTransition, nextAction]);

  const handleEditPlayer = (player: WolfPlayer) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      role: player.role || 'villager',
      model: player.model,
      baseUrl: player.baseUrl,
      apiKey: player.apiKey,
    });
  };

  const handleSaveEdit = () => {
    if (!editingPlayer) return;
    if (!editForm.name.trim()) {
      toast.error('玩家名称不能为空');
      return;
    }
    updatePlayer({
      ...editingPlayer,
      name: editForm.name.trim(),
      role: editForm.role,
      model: editForm.model,
      baseUrl: editForm.baseUrl,
      apiKey: editForm.apiKey,
    });
    setEditingPlayer(null);
    toast.success('玩家信息已更新');
  };

  const handleAddPlayer = () => {
    if (players.length >= 8) {
      toast.warning('玩家数量已达到上限（8人）');
      return;
    }
    const newPlayer = createDefaultWolfPlayer(players.length + 1);
    addPlayer(newPlayer);
  };

  const getLoadingText = (type: string) => {
    switch (type) {
      case 'witch_action': return '女巫正在决策';
      case 'seer_action': return '预言家正在查验';
      case 'wolf_chat': return '狼人密聊中';
      case 'speech': return '玩家正在发言';
      case 'inner_thought': return '系统思考中';
      default: return 'AI 思考中';
    }
  };

  const displayPlayers = session ? session.players : players;
  const rosterSummary = summarizePlayerRoster(displayPlayers);
  const currentSpeechMessage = [...(session?.messages || [])]
    .filter(message => message.playerId !== 'system' && (message.type === 'speech' || message.type === 'final_speech'))
    .at(-1);
  const currentSpeakerId = currentSpeechMessage?.playerId;
  const latestPublicEventText = uiEvents.length > 0 ? formatEventText(uiEvents[uiEvents.length - 1], 'player') : undefined;
  const phaseMeta = getPhaseMeta(session?.status);
  const playerRoleById = new Map(displayPlayers.map((player) => [player.id, player.role] as const));

  return (
    <div className="wolf-workbench grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
      <section className="wolf-command-bar grid gap-2 rounded-[18px] border-2 border-[var(--wolf-border)] bg-[var(--wolf-panel)] px-3 py-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <div className="wolf-kicker">当前阶段</div>
          <div className="mt-0.5 text-[clamp(0.88rem,1.25vw,1.08rem)] font-normal uppercase tracking-[-0.06em] text-[var(--wolf-ink)]">{phaseMeta.label}</div>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--wolf-ink-soft)]">{latestPublicEventText || phaseMeta.summary}</p>
        </div>
        <div className="wolf-command-ledger">
          <div className="wolf-command-stat"><span className="wolf-hero-stat-label">第几天</span><strong className="wolf-hero-mini-value">{session?.currentRound ?? 1}</strong></div>
          <div className="wolf-command-stat"><span className="wolf-hero-stat-label">存活</span><strong className="wolf-hero-mini-value">{rosterSummary.alive}/{rosterSummary.total}</strong></div>
          <div className="wolf-command-stat"><span className="wolf-hero-stat-label">已配置</span><strong className="wolf-hero-mini-value">{rosterSummary.configured}/{rosterSummary.total}</strong></div>
        </div>
      </section>

      <section className="wolf-workbench-primary grid min-h-0 gap-2 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.58fr)_minmax(272px,0.76fr)] 2xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.62fr)_minmax(280px,0.8fr)]" style={{ gridTemplateColumns: 'minmax(280px, 0.78fr) minmax(0, 1.58fr) minmax(272px, 0.76fr)' }}>
        <div className="wolf-workbench-board min-h-0 wolf-stagger-3">
          <PlayersPanel
            players={displayPlayers}
            showGameInfo={!!session}
            currentSpeakerId={currentSpeakerId}
            onEditPlayer={handleEditPlayer}
            onRemovePlayer={!session ? removePlayer : undefined}
            onAddPlayer={!session ? handleAddPlayer : undefined}
          />
        </div>

        <div className="wolf-workbench-log min-h-0 wolf-stagger-2">
          <Card className="wolf-theme-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[24px]">
            <CardHeader className="border-b border-[rgba(69,67,65,0.16)] pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="wolf-kicker">记录流</div>
                  <CardTitle className="text-[1rem] font-semibold text-[hsl(40_25%_12%)]">对局消息记录</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="wolf-stat-pill">{phaseMeta.label}</Badge>
                  {isLoading && (
                    <Badge variant="outline" className="wolf-stat-pill">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {getLoadingText(currentMessageType)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pt-2">
              {session ? (
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-3">
                    {session.messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} role={playerRoleById.get(msg.playerId)} />
                    ))}
                    {currentStreamingContent && (
                      <StreamingBubble
                        content={currentStreamingContent}
                        type={currentMessageType}
                        role={currentSpeakerId ? playerRoleById.get(currentSpeakerId) : undefined}
                      />
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-full min-h-[7rem] flex-col items-center justify-center rounded-[18px] border border-dashed border-[rgba(69,67,65,0.22)] bg-[rgba(255,255,255,0.6)] px-4 text-center text-[hsl(40_10%_42%)]">
                  <MessageSquareText className="h-8 w-8 text-[hsl(40_10%_50%)]" />
                  <p className="mt-2 text-sm font-medium text-[hsl(40_25%_18%)]">记录区待激活</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="wolf-workbench-rail grid min-h-0 gap-2 xl:grid-rows-[minmax(320px,1.15fr)_minmax(0,0.85fr)] wolf-stagger-2">
          <ActionPanel
            status={session?.status}
            isLoading={isLoading}
            pendingTransition={pendingTransition}
            currentMessageType={currentMessageType}
            playerCount={players.length}
            requiredPlayers={8}
            onNextAction={() => {
              void nextAction();
            }}
            onContinue={continueTransition}
            onReset={resetGame}
            onInit={initGame}
          />

          <div className="min-h-0">
            <TimelinePanel events={uiEvents} viewMode="player" />
          </div>
        </div>
      </section>

      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent className="wolf-dialog-square rounded-none border-[2px] border-[#454341] bg-[#fbf7f2] p-6 shadow-[0_18px_50px_rgba(33,31,29,0.12)]">
          <DialogHeader className="border-b border-[rgba(69,67,65,0.18)] pb-3">
            <DialogTitle className="font-mono text-[1.4rem] uppercase tracking-[-0.04em] text-[#3e3d3c]">编辑玩家</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-mono text-[0.8rem] uppercase tracking-[0.03em] text-[#3e3d3c]">玩家名称</Label>
              <Input id="edit-name" className="h-11 rounded-[18px] border-[2px] border-[#454341] bg-white text-[#3e3d3c]" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="请输入玩家名称" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="font-mono text-[0.8rem] uppercase tracking-[0.03em] text-[#3e3d3c]">身份</Label>
              <select
                id="edit-role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter' })}
                className="flex h-11 w-full rounded-[18px] border-[2px] border-[#454341] bg-white px-3 py-2 text-sm text-[#3e3d3c] outline-none focus-visible:ring-0"
              >
                <option value="villager">村民</option>
                <option value="werewolf">狼人</option>
                <option value="seer">预言家</option>
                <option value="witch">女巫</option>
                <option value="hunter">猎人</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model" className="font-mono text-[0.8rem] uppercase tracking-[0.03em] text-[#3e3d3c]">模型</Label>
              <Input id="edit-model" className="h-11 rounded-[18px] border-[2px] border-[#454341] bg-white text-[#3e3d3c]" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} placeholder="如: gpt-4o-mini" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-baseUrl" className="font-mono text-[0.8rem] uppercase tracking-[0.03em] text-[#3e3d3c]">API 地址</Label>
              <Input id="edit-baseUrl" className="h-11 rounded-[18px] border-[2px] border-[#454341] bg-white text-[#3e3d3c]" value={editForm.baseUrl} onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })} placeholder="如: https://api.openai.com/v1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apiKey" className="font-mono text-[0.8rem] uppercase tracking-[0.03em] text-[#3e3d3c]">API Key</Label>
              <Input id="edit-apiKey" type="password" className="h-11 rounded-[18px] border-[2px] border-[#454341] bg-white text-[#3e3d3c]" value={editForm.apiKey} onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })} placeholder="请输入 API Key" />
            </div>
          </div>
          <div className="flex gap-2 border-t pt-2">
            <Button variant="ghost" size="sm" className="wolf-inline-action flex-1 justify-start px-0 hover:bg-transparent" onClick={() => { setPresetMode('save'); setPresetDialogOpen(true); }}>
              <Save className="mr-1 h-3 w-3" />
              保存为预设
            </Button>
            <Button variant="ghost" size="sm" className="wolf-inline-action flex-1 justify-start px-0 hover:bg-transparent disabled:opacity-40" onClick={() => { setPresetMode('load'); setPresetDialogOpen(true); }} disabled={presets.length === 0}>
              <FolderOpen className="mr-1 h-3 w-3" />
              应用预设
            </Button>
          </div>
          <DialogFooter className="border-t border-[rgba(69,67,65,0.18)] pt-3">
            <Button variant="outline" className="wolf-command-button wolf-command-button-secondary border-[2px] border-[#454341] bg-[var(--panel)]" onClick={() => setEditingPlayer(null)}>取消</Button>
            <Button className="wolf-command-button wolf-command-button-primary border-[2px] border-[#454341] bg-[#6fc2ff] text-[#3e3d3c]" onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="wolf-dialog-square rounded-none border-[2px] border-[#454341] bg-[#fbf7f2] p-6 shadow-[0_18px_50px_rgba(33,31,29,0.12)]">
          <DialogHeader className="border-b border-[rgba(69,67,65,0.18)] pb-3">
            <DialogTitle>{presetMode === 'save' ? '保存为预设' : '应用预设'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {presetMode === 'save' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">预设名称</Label>
                  <Input id="preset-name" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="请输入预设名称，如：我的 GPT 配置" />
                </div>
                <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">模型：</span><span className="truncate font-mono">{editForm.model || '未设置'}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">API 地址：</span><span className="max-w-[200px] truncate font-mono">{editForm.baseUrl || '未设置'}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">API Key：</span><span className="font-mono">{editForm.apiKey ? '***已设置***' : '未设置'}</span></div>
                </div>
                <Button onClick={handleSavePreset} className="w-full"><Save className="mr-2 h-4 w-4" />确认保存</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p>暂无保存的预设</p>
                    <p className="text-sm">请先保存一个预设</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] space-y-2 overflow-y-auto">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex-1 cursor-pointer" onClick={() => handleApplyPreset(preset)}>
                          <div className="font-medium">{preset.name}</div>
                          <div className="mt-1 flex gap-2 text-xs text-muted-foreground"><span className="font-mono">{preset.model}</span></div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getRoleTone(role?: WolfRole, isSystem = false) {
  if (isSystem) {
    return {
      fill: '#fbf7f2',
      text: '#3e3d3c',
      border: '#454341',
    };
  }

  switch (role) {
    case 'werewolf':
      return { fill: '#ff7169', text: '#f4efea', border: '#454341' };
    case 'seer':
      return { fill: '#6fc2ff', text: '#f4efea', border: '#454341' };
    case 'witch':
      return { fill: '#ff9538', text: '#f4efea', border: '#454341' };
    case 'hunter':
      return { fill: '#ffde00', text: '#3e3d3c', border: '#454341' };
    case 'villager':
      return { fill: '#53dbc9', text: '#f4efea', border: '#454341' };
    default:
      return { fill: '#fbf7f2', text: '#3e3d3c', border: '#454341' };
  }
}

function getMessageVisual(messageType: WolfMessage['type'], role?: WolfRole, isSystem = false) {
  if (isSystem || messageType === 'inner_thought') {
    const tone = getRoleTone(undefined, true);
    return {
      shellStyle: { border: `2px solid ${tone.border}`, backgroundColor: '#fbf7f2' },
      badgeStyle: { border: `2px solid ${tone.border}`, backgroundColor: '#fbf7f2', color: tone.text },
      avatarStyle: { border: `2px solid ${tone.border}`, backgroundColor: '#fbf7f2', color: tone.text },
    };
  }

  const tone = getRoleTone(role, false);
  return {
    shellStyle: { border: `2px solid ${tone.border}`, backgroundColor: '#f4efea' },
    badgeStyle: { border: `2px solid ${tone.border}`, backgroundColor: tone.fill, color: tone.text },
    avatarStyle: { border: `2px solid ${tone.border}`, backgroundColor: tone.fill, color: tone.text },
  };
}

function getMessageLabel(message: WolfMessage) {
  if (message.playerId === 'system') {
    return message.type === 'speech' ? '系统播报' : '系统推理';
  }

  switch (message.type) {
    case 'speech':
      return '发言';
    case 'wolf_chat':
      return '狼人密聊';
    case 'witch_action':
      return '女巫行动';
    case 'seer_action':
      return '预言家行动';
    case 'final_speech':
      return '遗言';
    default:
      return '内心戏';
  }
}

function getStreamingRole(type: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action', role?: WolfRole) {
  switch (type) {
    case 'wolf_chat':
      return 'werewolf' as const;
    case 'witch_action':
      return 'witch' as const;
    case 'seer_action':
      return 'seer' as const;
    case 'speech':
      return role;
    default:
      return undefined;
  }
}

function MessageBubble({ message, role }: { message: WolfMessage; role?: WolfRole }) {
  const isSystem = message.playerId === 'system';
  const visual = getMessageVisual(message.type, role, isSystem);
  const label = getMessageLabel(message);

  return (
    <div className="group transition-all">
      <div className="flex items-start gap-3">
        <div className="wolf-log-avatar" style={visual.avatarStyle}>
          {message.playerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[hsl(40_25%_12%)]">{message.playerName}</span>
            <span className="wolf-log-badge" style={visual.badgeStyle}>{label}</span>
            <span className="text-xs text-[hsl(40_10%_42%)]">
              {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="wolf-log-shell" style={visual.shellStyle}>
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-[14px] leading-6" style={{ color: '#3e3d3c' }}>{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
                  li: ({ children }) => <li style={{ color: '#3e3d3c' }}>{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: '#3e3d3c' }}>{children}</strong>,
                  em: ({ children }) => <em style={{ color: '#5f5b57' }}>{children}</em>,
                  code: ({ children }) => <code className="rounded px-1.5 py-0.5 text-xs font-mono" style={{ backgroundColor: 'rgba(62,61,60,0.08)', color: '#3e3d3c' }}>{children}</code>,
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg p-3" style={{ backgroundColor: 'rgba(62,61,60,0.05)', color: '#3e3d3c' }}>{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-current pl-3 italic" style={{ color: '#5f5b57' }}>{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({
  content,
  type,
  role,
}: {
  content: string;
  type: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action';
  role?: WolfRole;
}) {
  const streamingRole = getStreamingRole(type, role);
  const isSystem = type === 'inner_thought';
  const visual = getMessageVisual(type, streamingRole, isSystem);
  const label = type === 'speech'
    ? '正在发言'
    : type === 'wolf_chat'
      ? '狼人密聊'
      : type === 'witch_action'
        ? '女巫行动'
        : type === 'seer_action'
          ? '预言家行动'
          : '思考中';

  return (
    <div className="group opacity-95 transition-all">
      <div className="flex items-start gap-3">
        <div className="wolf-log-avatar" style={visual.avatarStyle}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="wolf-log-badge" style={visual.badgeStyle}>
              <Sparkles className="mr-1 inline h-3 w-3" />
              {label}
            </span>
          </div>
          <div className="wolf-log-shell" style={visual.shellStyle}>
            <p className="whitespace-pre-wrap text-[14px] leading-6" style={{ color: '#3e3d3c' }}>
              {content}
              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current align-[-2px]" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}








