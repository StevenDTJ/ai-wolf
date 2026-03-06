// Action Panel - Shows game action controls
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Moon, Sun, RotateCcw, Play } from 'lucide-react';
import type { WolfGameStatus } from '@/types';

interface ActionPanelProps {
  status: WolfGameStatus | undefined;
  isLoading: boolean;
  pendingTransition: 'to_day' | 'to_night' | null;
  currentMessageType: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action';
  playerCount?: number;
  requiredPlayers?: number;
  onNextAction: () => void;
  onContinue: () => void;
  onReset: () => void;
  onInit?: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  waiting: '开始第1晚',
  night: '女巫行动',
  night_witch: '女巫行动',
  night_seer: '预言家验人',
  night_werewolf: '狼人密聊',
  werewolf_chat: '确认刀人',
  day: '发言',
  voting: '投票',
};

const LOADING_MESSAGES: Record<string, string> = {
  witch_action: '女巫正在决策...',
  seer_action: '预言家正在选择查验目标...',
  wolf_chat: '狼人密聊中...',
  speech: '正在发言...',
  inner_thought: '思考中...',
};

export function ActionPanel({
  status,
  isLoading,
  pendingTransition,
  currentMessageType,
  playerCount,
  requiredPlayers = 8,
  onNextAction,
  onContinue,
  onReset,
  onInit,
}: ActionPanelProps) {
  const getActionLabel = () => {
    if (!status) return '开始';
    return ACTION_LABELS[status] || '继续';
  };

  const getLoadingMessage = () => {
    return LOADING_MESSAGES[currentMessageType] || 'AI思考中...';
  };
  const canStartGame = typeof playerCount === 'number' ? playerCount === requiredPlayers : true;
  const startLabel = canStartGame ? '开始游戏' : `需要${requiredPlayers}名玩家 (${playerCount ?? 0}/${requiredPlayers})`;

  return (
    <Card className="wolf-theme-panel rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm tracking-wide">游戏控制</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!status || status === 'waiting' ? (
            <Button
              onClick={onInit}
              disabled={isLoading || !canStartGame}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-amber-100 shadow"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              {startLabel}
            </Button>
          ) : status === 'ended' ? (
            <Button
              onClick={onReset}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              再来一局
            </Button>
          ) : pendingTransition ? (
            <div className="space-y-2">
              <Button
                onClick={onContinue}
                disabled={isLoading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950"
                size="lg"
              >
                {pendingTransition === 'to_day' ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    进入白天
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    进入黑夜
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onReset}
                disabled={isLoading}
                className="w-full border-slate-300 bg-white/70 hover:bg-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={onNextAction}
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-amber-100 shadow"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getLoadingMessage()}
                  </>
                ) : (
                  <>
                    {status.startsWith('night') ? (
                      <Moon className="w-4 h-4 mr-2" />
                    ) : (
                      <Sun className="w-4 h-4 mr-2" />
                    )}
                    {getActionLabel()}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onReset}
                disabled={isLoading}
                className="w-full border-slate-300 bg-white/70 hover:bg-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
