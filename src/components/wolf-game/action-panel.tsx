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
  currentStreamingContent: string;
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
  currentStreamingContent,
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
    return LOADING_MESSAGES.inner_thought || 'AI思考中...';
  };

  const isGameActive = status && status !== 'waiting' && status !== 'ended';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">游戏控制</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!status || status === 'waiting' ? (
            // Pre-game: show init button
            <Button
              onClick={onInit}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              开始游戏
            </Button>
          ) : status === 'ended' ? (
            // Game ended: show reset button
            <Button
              onClick={onReset}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              再来一局
            </Button>
          ) : pendingTransition ? (
            // Transition pending: show continue button
            <div className="space-y-2">
              <Button
                onClick={onContinue}
                disabled={isLoading}
                className="w-full"
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
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          ) : (
            // Active game: show next action button
            <div className="space-y-2">
              <Button
                onClick={onNextAction}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {currentStreamingContent || getLoadingMessage()}
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
                className="w-full"
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
