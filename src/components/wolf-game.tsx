'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  UseWolfGameReturn,
  loadWolfPlayersFromStorage,
  createDefaultWolfPlayer,
  saveWolfPlayersToStorage,
} from '@/hooks/useWolfGame';
import { WolfPlayer, WolfMessage } from '@/types';
import {
  Play,
  RotateCcw,
  Moon,
  Sun,
  UserPlus,
  Eye,
  EyeOff,
  Save,
  FolderOpen,
  Trash2,
  FlaskConical,
  Skull,
  EyeIcon,
  Users,
  Trophy,
  Loader2,
  MessageCircle,
  Swords,
} from 'lucide-react';
import { toast } from 'sonner';
// 预设接口
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
    isLoading,
    error,
    currentStreamingContent,
    currentMessageType,
    votes,
    votingResults,
    pendingTransition,
    addPlayer,
    updatePlayer,
    removePlayer,
    initGame,
    nextAction,
    continueTransition,
    resetGame,
  } = wolf;

  // 编辑弹窗状态
  const [editingPlayer, setEditingPlayer] = useState<WolfPlayer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'villager' as 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter',
    model: '',
    baseUrl: '',
    apiKey: '',
  });

  // 预设状态管理
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

  // 保存预设到 localStorage
  const savePresets = (newPresets: WolfPlayerPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('wolfPlayerPresets', JSON.stringify(newPresets));
  };

  // 保存为预设
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

  // 应用预设
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

  // 删除预设
  const handleDeletePreset = (presetId: string) => {
    const newPresets = presets.filter(p => p.id !== presetId);
    savePresets(newPresets);
    toast.success('预设已删除');
  };

  // 加载玩家数据
  useEffect(() => {
    if (players.length === 0) {
      // 添加默认8名玩家
      const defaultPlayers = Array.from({ length: 8 }, (_, i) =>
        createDefaultWolfPlayer(i + 1)
      );
      defaultPlayers.forEach(p => addPlayer(p));
    }
  }, []);

  // 保存玩家数据到本地存储
  useEffect(() => {
    if (players.length > 0) {
      saveWolfPlayersToStorage(players);
    }
  }, [players]);

  // 错误提示
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!session || isLoading || pendingTransition || session.status === 'ended' || session.status === 'waiting') {
      return;
    }

    const timer = setTimeout(() => {
      void nextAction();
    }, 0);

    return () => clearTimeout(timer);
  }, [session, isLoading, pendingTransition, nextAction]);

  // 获取当前状态配置
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; icon: React.ReactNode; color: string; bgColor: string }> = {
      waiting: {
        text: '等待开始',
        icon: <Users className="w-4 h-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 border-gray-300'
      },
      night: {
        text: '夜晚 - 女巫行动',
        icon: <FlaskConical className="w-4 h-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 border-blue-300'
      },
      night_witch: {
        text: '夜晚 - 女巫行动',
        icon: <FlaskConical className="w-4 h-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 border-blue-300'
      },
      night_seer: {
        text: '夜晚 - 预言家行动',
        icon: <EyeIcon className="w-4 h-4" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 border-purple-300'
      },
      night_werewolf: {
        text: '夜晚 - 狼人行动',
        icon: <Skull className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100 border-red-300'
      },
      werewolf_chat: {
        text: '狼人密聊中',
        icon: <MessageCircle className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100 border-red-300'
      },
      day: {
        text: '白天 - 发言环节',
        icon: <Sun className="w-4 h-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 border-yellow-300'
      },
      voting: {
        text: '投票环节',
        icon: <Swords className="w-4 h-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 border-orange-300'
      },
      ended: {
        text: '游戏结束',
        icon: <Trophy className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100 border-green-300'
      },
    };
    return configs[status] || {
      text: status,
      icon: null,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 border-gray-300'
    };
  };

  // 获取玩家身份标签
  const getRoleLabel = (role: string) => {
            const roleMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      villager: { label: '村民', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Users className="w-3 h-3" /> },
      werewolf: { label: '狼人', color: 'bg-red-100 text-red-700 border-red-300', icon: <Skull className="w-3 h-3" /> },
      seer: { label: '预言家', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <EyeIcon className="w-3 h-3" /> },
      witch: { label: '女巫', color: 'bg-pink-100 text-pink-700 border-pink-300', icon: <FlaskConical className="w-3 h-3" /> },
      hunter: { label: '猎人', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <Swords className="w-3 h-3" /> },
    };
    return roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-300', icon: null };
  };

  // 打开编辑弹窗
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

  // 保存编辑
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

  // 添加玩家
  const handleAddPlayer = () => {
    if (players.length >= 8) {
      toast.warning('玩家数量已达到上限（8人）');
      return;
    }
    const newPlayer = createDefaultWolfPlayer(players.length + 1);
    addPlayer(newPlayer);
  };

  // 获取行动按钮标签
  const getActionLabel = () => {
    if (!session) return '继续';
    switch (session.status) {
      case 'waiting': return '开始第1晚';
      case 'night':
        case 'night_witch': return '女巫行动';
      case 'night_seer': return '预言家验人';
      case 'night_werewolf': return '狼人密聊';
      case 'werewolf_chat': return '确认刀人';
      case 'day': return '发言';
      case 'voting': return '投票';
      default: return '继续';
    }
  };

  // 获取加载中的提示文本
  const getLoadingText = (type: string) => {
    switch (type) {
      case 'witch_action': return '女巫正在决策...';
      case 'seer_action': return '预言家正在选择查验目标...';
      case 'wolf_chat': return '狼人密聊中...';
      case 'speech': return '正在发言...';
      case 'inner_thought': return '思考中...';
      default: return 'AI思考中...';
    }
  };

  const statusConfig = session ? getStatusConfig(session.status) : getStatusConfig('waiting');
    const killedPlayer = session?.nightAction?.killedId
      ? session.players.find(p => p.id === session.nightAction.killedId)
      : null;
    const killedPlayerName = killedPlayer?.name || '无人';


  return (
    <div className="h-full flex flex-col gap-4">
      {/* 游戏状态 */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {session?.status === 'ended' ? (
                <Trophy className="w-5 h-5 text-yellow-500" />
              ) : session?.status?.startsWith('night') || session?.status === 'werewolf_chat' ? (
                <Moon className="w-5 h-5 text-blue-500" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              狼人杀
              {session && (
                <span className="text-sm font-normal text-muted-foreground">
                  第 {session.currentRound} 天
                </span>
              )}
            </CardTitle>
            <Badge
              variant="outline"
              className={`${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-1`}
            >
              {statusConfig.icon}
              {statusConfig.text}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {!session ? (
            <div className="text-center py-6 space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">8人标准局配置</p>
                                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <Skull className="w-3 h-3 mr-1" />
                      狼人 ×2
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="w-3 h-3 mr-1" />
                      村民 ×3
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      预言家 ×1
                    </Badge>
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      <FlaskConical className="w-3 h-3 mr-1" />
                      女巫 ×1
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Swords className="w-3 h-3 mr-1" />
                      猎人 ×1
                    </Badge>
                  </div>
              </div>

              <Button
                onClick={initGame}
                disabled={players.length !== 8 || isLoading}
                size="lg"
                className="w-full max-w-xs"
              >
                <Play className="w-4 h-4 mr-2" />
                {players.length !== 8 ? `需要8名玩家 (${players.length}/8)` : '开始游戏'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 游戏进程控制 */}
              {session.status !== 'ended' ? (
                <div className="flex gap-2">
                  {pendingTransition ? (
                    <Button onClick={continueTransition} disabled={isLoading} className="flex-1" size="lg">
                      {pendingTransition === 'to_day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span className="ml-2">{pendingTransition === 'to_day' ? '进入白天' : '进入黑夜'}</span>
                    </Button>
                  ) : session.status === 'waiting' ? (
                    <Button onClick={nextAction} disabled={isLoading} className="flex-1" size="lg">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {getLoadingText(currentMessageType)}
                        </>
                      ) : (
                        <>
                          {statusConfig.icon}
                          <span className="ml-2">{getActionLabel()}</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="flex-1" size="lg">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {getLoadingText(currentMessageType)}
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          自动进行中...
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetGame} disabled={isLoading}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className={`text-3xl font-bold ${session.winner === 'good' ? 'text-blue-600' : 'text-red-600'}`}>
                    {session.winner === 'good' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8" />
                        好人阵营获胜！
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Skull className="w-8 h-8" />
                        狼人阵营获胜！
                      </span>
                    )}
                  </div>

                  {/* 显示身份揭晓 */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {session.players.map(player => {
                      const role = getRoleLabel(player.role);
                      return (
                        <div
                          key={player.id}
                          className={`p-2 rounded border ${role.color} ${!player.isAlive ? 'opacity-50 line-through' : ''}`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {role.icon}
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <div className="text-xs">{role.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <Button onClick={resetGame} size="lg" className="w-full max-w-xs">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    再来一局
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 玩家列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>玩家列表</span>
            {session && (
              <span className="text-muted-foreground font-normal">
                {session.players.filter(p => p.isAlive).length} / 8 存活
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="grid grid-cols-2 gap-2">
              {(session ? session.players : players)
                .sort((a, b) => a.playerNumber - b.playerNumber)
                .map((player) => {
                  const role = getRoleLabel(player.role);
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        session?.status === 'ended'
                          ? role.color
                          : player.isAlive !== false
                          ? 'bg-white dark:bg-gray-800 border-gray-200'
                          : 'bg-gray-100 dark:bg-gray-900 opacity-60 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">
                            #{player.playerNumber}
                          </span>
                          <span className="font-medium text-sm">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {session && session.status !== 'waiting' && session.status !== 'ended' && (
                            <Badge variant="outline" className={`text-xs ${role.color}`}>
                              {role.icon}
                              <span className="ml-1">{role.label}</span>
                            </Badge>
                          )}
                          {session && player.isAlive === false && (
                            <Badge variant="outline" className="text-xs">已淘汰</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {!session && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removePlayer(player.id)}
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {!session && players.length < 8 && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleAddPlayer}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                添加玩家
              </Button>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 游戏记录与流式输出 */}
      {session && (
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>游戏记录</span>
              {isLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {getLoadingText(currentMessageType)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {session.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* 流式输出 */}
                {currentStreamingContent && (
                  <StreamingBubble
                    content={currentStreamingContent}
                    type={currentMessageType}
                  />
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 投票结果展示 */}
      {session?.status === 'voting' && Object.keys(votingResults).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="w-4 h-4" />
              投票统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(votingResults).map(([targetId, count]) => {
                const target = session.players.find(p => p.id === targetId);
                return (
                  <Badge key={targetId} variant="outline" className="bg-white">
                    {target?.name || '未知'}: {count} 票
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑玩家弹窗 */}
      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑玩家</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">玩家名称</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="请输入玩家名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">身份</Label>
              <select
                id="edit-role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="villager">村民</option>
                <option value="werewolf">狼人</option>
                <option value="seer">预言家</option>
                <option value="witch">女巫</option>
                <option value="hunter">猎人</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">模型</Label>
              <Input
                id="edit-model"
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                placeholder="如: gpt-4o-mini"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-baseUrl">API 地址</Label>
              <Input
                id="edit-baseUrl"
                value={editForm.baseUrl}
                onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                placeholder="如: https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apiKey">API Key</Label>
              <Input
                id="edit-apiKey"
                type="password"
                value={editForm.apiKey}
                onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                placeholder="请输入 API Key"
              />
            </div>
          </div>
          {/* 预设按钮 */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setPresetMode('save');
                setPresetDialogOpen(true);
              }}
            >
              <Save className="w-3 h-3 mr-1" />
              保存为预设
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setPresetMode('load');
                setPresetDialogOpen(true);
              }}
              disabled={presets.length === 0}
            >
              <FolderOpen className="w-3 h-3 mr-1" />
              应用预设
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预设管理弹窗 */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{presetMode === 'save' ? '保存为预设' : '应用预设'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {presetMode === 'save' ? (
              // 保存预设模式
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">预设名称</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="请输入预设名称，如：我的GPT配置"
                  />
                </div>
                <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">模型：</span>
                    <span className="font-mono">{editForm.model || '未设置'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API地址：</span>
                    <span className="font-mono truncate max-w-[200px]">{editForm.baseUrl || '未设置'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Key：</span>
                    <span className="font-mono">{editForm.apiKey ? '***已设置***' : '未设置'}</span>
                  </div>
                </div>
                <Button onClick={handleSavePreset} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  确认保存
                </Button>
              </div>
            ) : (
              // 应用预设模式
              <div className="space-y-3">
                {presets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无保存的预设</p>
                    <p className="text-sm">请先保存一个预设</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleApplyPreset(preset)}
                        >
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                            <span className="font-mono">{preset.model}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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

// 消息气泡组件
function MessageBubble({ message }: { message: WolfMessage }) {
  const typeStyles = {
    inner_thought: {
      container: 'bg-gray-50 border-gray-200',
      badge: 'bg-gray-200 text-gray-700',
      label: '💭 内心戏',
    },
    speech: {
      container: message.playerId === 'system'
        ? 'bg-blue-50 border-blue-200 border-dashed'
        : 'bg-white border-blue-200',
      badge: message.playerId === 'system'
        ? 'bg-blue-500 text-white'
        : 'bg-blue-100 text-blue-700',
      label: message.playerId === 'system' ? '🔔 系统' : '🎤 发言',
    },
    wolf_chat: {
      container: 'bg-red-50 border-red-200',
      badge: 'bg-red-200 text-red-700',
      label: '🐺 密聊',
    },
    final_speech: {
      container: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-200 text-amber-700',
      label: '💀 遗言',
    },
  };

  const style = typeStyles[message.type as keyof typeof typeStyles] || typeStyles.speech;

  return (
    <div className={`p-3 rounded-lg border ${style.container}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm">{message.playerName}</span>
        <Badge variant="outline" className={`text-xs ${style.badge}`}>
          {style.label}
        </Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap text-gray-800">
        {message.content}
      </p>
    </div>
  );
}

// 流式输出气泡
function StreamingBubble({
  content,
  type
}: {
  content: string;
  type: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action';
}) {
  const typeStyles = {
    inner_thought: {
      container: 'bg-gray-100 border-gray-300 border-dashed',
      badge: 'bg-gray-300 text-gray-700',
      label: '💭 思考中',
    },
    speech: {
      container: 'bg-blue-50 border-blue-300 border-dashed',
      badge: 'bg-blue-300 text-blue-800',
      label: '🎤 正在发言',
    },
    wolf_chat: {
      container: 'bg-red-50 border-red-300 border-dashed',
      badge: 'bg-red-300 text-red-800',
      label: '🐺 密聊中',
    },
    witch_action: {
        container: 'bg-pink-50 border-pink-300 border-dashed',
        badge: 'bg-pink-300 text-pink-800',
      label: '🧪 女巫行动',
    },
    seer_action: {
      container: 'bg-purple-50 border-purple-300 border-dashed',
      badge: 'bg-purple-300 text-purple-800',
      label: '🔮 正在查验',
    },
  };

  const style = typeStyles[type];

  return (
    <div className={`p-3 rounded-lg border-2 ${style.container} animate-pulse`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge className={`text-xs ${style.badge}`}>
          {style.label}
        </Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap text-gray-700">
        {content}
        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
      </p>
    </div>
  );
}

