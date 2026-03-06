// Stage Panel - Shows current game phase/stage info
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, FlaskConical, EyeIcon, Skull, MessageCircle, Swords, Trophy, Users } from 'lucide-react';
import type { WolfGameStatus } from '@/types';
import { getPhaseLabel } from '@/lib/wolf-game-ui';

interface StagePanelProps {
  status: WolfGameStatus | undefined;
  currentRound: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; chipClass: string }> = {
  waiting: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-slate-700',
    chipClass: 'bg-slate-100 border-slate-300',
  },
  night: {
    icon: <Moon className="w-4 h-4" />,
    color: 'text-blue-900',
    chipClass: 'wolf-stage-chip-night',
  },
  night_witch: {
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'text-blue-900',
    chipClass: 'wolf-stage-chip-night',
  },
  night_seer: {
    icon: <EyeIcon className="w-4 h-4" />,
    color: 'text-blue-900',
    chipClass: 'wolf-stage-chip-night',
  },
  night_werewolf: {
    icon: <Skull className="w-4 h-4" />,
    color: 'text-blue-900',
    chipClass: 'wolf-stage-chip-night',
  },
  werewolf_chat: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-blue-900',
    chipClass: 'wolf-stage-chip-night',
  },
  day: {
    icon: <Sun className="w-4 h-4" />,
    color: 'text-amber-900',
    chipClass: 'wolf-stage-chip-day',
  },
  day_speech: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-amber-900',
    chipClass: 'wolf-stage-chip-day',
  },
  voting: {
    icon: <Swords className="w-4 h-4" />,
    color: 'text-orange-900',
    chipClass: 'wolf-stage-chip-vote',
  },
  ended: {
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-emerald-800',
    chipClass: 'bg-emerald-100 border-emerald-300',
  },
};

export function StagePanel({ status, currentRound }: StagePanelProps) {
  const config = status ? STATUS_CONFIG[status] : STATUS_CONFIG.waiting;
  const label = status ? getPhaseLabel(status) : '等待开始';

  return (
    <Card className="wolf-theme-panel rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="tracking-wide">当前阶段</span>
          {status && status !== 'waiting' && status !== 'ended' && (
            <Badge variant="outline" className="text-xs border-slate-300 bg-white/70">
              第 {currentRound} 天
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center gap-2 p-3 rounded-xl border-2 shadow-sm ${config.chipClass}`}>
          {config.icon}
          <span className={`font-semibold tracking-wide ${config.color}`}>{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
