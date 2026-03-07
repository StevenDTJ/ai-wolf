'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  EyeIcon,
  FlaskConical,
  MessageCircle,
  Moon,
  Skull,
  Sun,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import type { WolfGameStatus } from '@/types';
import { getPhaseMeta, getPhasePalette } from '@/lib/wolf-game-ui';
import { cn } from '@/lib/utils';

interface StagePanelProps {
  status: WolfGameStatus | undefined;
  currentRound: number;
  aliveCount: number;
  totalPlayers: number;
  isLoading: boolean;
  currentMessageType: 'inner_thought' | 'speech' | 'wolf_chat' | 'witch_action' | 'seer_action';
  pendingTransition: 'to_day' | 'to_night' | null;
  currentSpeakerName?: string;
  lastEventText?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; marker: string }> = {
  waiting: { icon: <Users className="h-4 w-4" />, marker: 'Seat' },
  night: { icon: <Moon className="h-4 w-4" />, marker: 'Night' },
  night_witch: { icon: <FlaskConical className="h-4 w-4" />, marker: 'Witch' },
  night_seer: { icon: <EyeIcon className="h-4 w-4" />, marker: 'Seer' },
  night_werewolf: { icon: <Skull className="h-4 w-4" />, marker: 'Wolf' },
  werewolf_chat: { icon: <MessageCircle className="h-4 w-4" />, marker: 'Chat' },
  day: { icon: <Sun className="h-4 w-4" />, marker: 'Day' },
  day_speech: { icon: <MessageCircle className="h-4 w-4" />, marker: 'Debate' },
  voting: { icon: <Swords className="h-4 w-4" />, marker: 'Vote' },
  ended: { icon: <Trophy className="h-4 w-4" />, marker: 'End' },
};

const MESSAGE_LABELS: Record<string, string> = {
  witch_action: '女巫正在决策',
  seer_action: '预言家正在查验',
  wolf_chat: '狼人密聊中',
  speech: '白天公共发言',
  inner_thought: '系统整理行动结果',
};

export function StagePanel({
  status,
  currentRound,
  aliveCount,
  totalPlayers,
  isLoading,
  currentMessageType,
  pendingTransition,
  currentSpeakerName,
  lastEventText,
}: StagePanelProps) {
  const currentStatus = status || 'waiting';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.waiting;
  const phaseMeta = getPhaseMeta(currentStatus);
  const palette = getPhasePalette(currentStatus);
  const focusLabel = pendingTransition
    ? pendingTransition === 'to_day'
      ? '夜晚结算完成，等待切入白天。'
      : '白天流程已收束，等待进入黑夜。'
    : isLoading
      ? MESSAGE_LABELS[currentMessageType] || '正在推进中'
      : phaseMeta.actionLabel;

  return (
    <Card className="wolf-theme-panel wolf-stage-command-shell flex h-full min-h-0 flex-col overflow-hidden rounded-[28px]">
      <CardHeader className="border-b border-[rgba(69,67,65,0.16)] pb-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="wolf-kicker">主舞台</div>
              <CardTitle className="text-[clamp(2rem,4vw,3rem)] font-normal uppercase tracking-[-0.06em] text-[hsl(40_25%_12%)]">
                {phaseMeta.label}
              </CardTitle>
              <p className="max-w-2xl text-sm leading-7 text-[hsl(40_12%_38%)]">{phaseMeta.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="wolf-stat-pill">第 {currentRound} 天</Badge>
              <Badge variant="outline" className="wolf-stat-pill">存活 {aliveCount}/{totalPlayers}</Badge>
              <Badge variant="outline" className={cn('wolf-stat-pill', palette.chipClass)}>{palette.spotlightLabel}</Badge>
            </div>
          </div>

          <div className={cn('wolf-stage-banner', palette.bannerClass, palette.glowClass)}>
            <div className="flex items-start gap-4">
              <div className={cn('wolf-stage-emblem', palette.accentClass)}>{config.icon}</div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="wolf-stage-banner-label">{config.marker}</span>
                  <Badge variant="outline" className="wolf-stage-chip">{palette.spotlightLabel}</Badge>
                </div>
                <div className="text-[clamp(1.5rem,3vw,2.25rem)] font-normal uppercase tracking-[-0.05em] text-[hsl(40_25%_12%)]">
                  {phaseMeta.actionLabel}
                </div>
                <p className="max-w-2xl text-sm leading-7 text-[hsl(40_12%_30%)]">
                  {pendingTransition ? focusLabel : lastEventText || '等待关键事件写入舞台摘要。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-5">
        <div className="wolf-stage-ledger grid gap-3 xl:grid-cols-[1.14fr_0.86fr]">
          <div className="wolf-stage-spotlight">
            <div className="wolf-stage-detail-label">当前行动</div>
            <div className="mt-3 flex items-start gap-3">
              <span className={cn('wolf-stage-spotlight-icon', palette.chipClass)}>
                <ArrowRight className="h-4 w-4" />
              </span>
              <div>
                <div className="text-lg font-semibold text-[hsl(40_25%_12%)]">{focusLabel}</div>
                <p className="mt-1 text-sm leading-6 text-[hsl(40_12%_38%)]">
                  {isLoading ? '系统正在执行当前环节，请避免重复操作。' : '舞台焦点会随着阶段切换、发言和关键结算实时更新。'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="wolf-stage-detail-card">
              <div className="wolf-stage-detail-label">当前发言者</div>
              <div className="mt-2 text-base font-semibold text-[hsl(40_25%_12%)]">{currentSpeakerName || '暂无焦点玩家'}</div>
            </div>
            <div className="wolf-stage-detail-card">
              <div className="wolf-stage-detail-label">最新事件</div>
              <p className="mt-2 text-sm leading-6 text-[hsl(40_12%_32%)]">{lastEventText || '等待首个关键事件发生'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

