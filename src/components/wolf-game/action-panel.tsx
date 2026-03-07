'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Moon, Play, RotateCcw, Sun } from 'lucide-react';
import type { WolfGameStatus } from '@/types';
import { getPhaseMeta, getPhasePalette } from '@/lib/wolf-game-ui';
import { cn } from '@/lib/utils';

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
  waiting: '开始游戏',
  night: '推进夜晚',
  night_witch: '女巫行动',
  night_seer: '预言家行动',
  night_werewolf: '狼人行动',
  werewolf_chat: '确认狼刀',
  day: '进入白天',
  day_speech: '推进发言',
  voting: '投票结算',
};

const LOADING_MESSAGES: Record<string, string> = {
  witch_action: '女巫正在决策，请等待技能结果。',
  seer_action: '预言家正在选择查验目标。',
  wolf_chat: '狼人正在密聊并同步目标。',
  speech: '当前玩家正在输出发言。',
  inner_thought: '系统正在组织下一步推理。',
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
  const currentStatus = status || 'waiting';
  const phaseMeta = getPhaseMeta(currentStatus);
  const palette = getPhasePalette(currentStatus);
  const canStartGame = typeof playerCount === 'number' ? playerCount === requiredPlayers : true;
  const startLabel = canStartGame ? '开始游戏' : `需 ${requiredPlayers} 人`;
  const primaryLabel = ACTION_LABELS[currentStatus] || phaseMeta.actionLabel;
  const hintText = isLoading
    ? LOADING_MESSAGES[currentMessageType] || '系统处理中...'
    : pendingTransition
      ? pendingTransition === 'to_day'
        ? '夜晚结算完成，确认切入白天。'
        : '白天流程结束，确认切入黑夜。'
      : phaseMeta.summary;

  return (
    <Card className="wolf-theme-panel flex min-h-0 flex-col overflow-visible rounded-none">
      <CardHeader className="border-b border-[rgba(69,67,65,0.16)] pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="wolf-kicker">控制台</div>
            <CardTitle className="text-[0.88rem] font-semibold leading-5 text-[hsl(40_25%_12%)]">推进与切换</CardTitle>
          </div>
          <Badge variant="outline" className={cn('wolf-stat-pill text-[0.66rem]', palette.chipClass)}>{phaseMeta.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 overflow-x-visible overflow-y-auto pt-1.5 pb-1">
        <div className="wolf-action-command-deck space-y-1.5 overflow-visible">
          <div className="wolf-action-primary-card overflow-visible">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="wolf-stage-detail-label">主操作</div>
                <div className="mt-0.5 text-[0.74rem] font-semibold leading-4 text-[hsl(40_25%_12%)]">
                  {!status || status === 'waiting' ? '建立对局' : pendingTransition ? '确认切换' : primaryLabel}
                </div>
              </div>
              <Badge variant="outline" className={cn('wolf-stat-pill text-[0.62rem]', palette.chipClass)}>{palette.spotlightLabel}</Badge>
            </div>

            <div className="mt-1.5 space-y-1.5">
              {!status || status === 'waiting' ? (
                <Button onClick={onInit} disabled={isLoading || !canStartGame} className="wolf-command-button wolf-command-button-primary wolf-action-cta wolf-hard-shadow-button h-8 w-full rounded-none px-2 text-[0.6rem]" size="lg">
                  <Play className="mr-1 h-3 w-3" />
                  {startLabel}
                </Button>
              ) : status === 'ended' ? (
                <Button onClick={onReset} className="wolf-command-button wolf-command-button-success wolf-action-cta wolf-hard-shadow-button h-8 w-full rounded-none px-2 text-[0.6rem]" size="lg">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  再来一局
                </Button>
              ) : pendingTransition ? (
                <Button onClick={onContinue} disabled={isLoading} className="wolf-command-button wolf-command-button-primary wolf-action-cta wolf-hard-shadow-button h-8 w-full rounded-none px-2 text-[0.6rem]" size="lg">
                  {pendingTransition === 'to_day' ? (
                    <>
                      <Sun className="mr-1 h-3 w-3" />
                      进入白天
                    </>
                  ) : (
                    <>
                      <Moon className="mr-1 h-3 w-3" />
                      进入黑夜
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={onNextAction} disabled={isLoading} className="wolf-command-button wolf-command-button-primary wolf-action-cta wolf-hard-shadow-button h-8 w-full rounded-none px-2 text-[0.6rem]" size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      处理中
                    </>
                  ) : status.startsWith('night') || status === 'werewolf_chat' ? (
                    <>
                      <Moon className="mr-1 h-3 w-3" />
                      {primaryLabel}
                    </>
                  ) : (
                    <>
                      <Sun className="mr-1 h-3 w-3" />
                      {primaryLabel}
                    </>
                  )}
                </Button>
              )}

              <p className="text-[10px] leading-4 text-[hsl(40_12%_38%)]">{hintText}</p>

              <Button variant="outline" onClick={onReset} disabled={isLoading} className="wolf-command-button wolf-command-button-secondary h-7 w-full rounded-none px-2 text-[0.58rem]">
                <RotateCcw className="mr-1 h-3 w-3" />
                重置
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




