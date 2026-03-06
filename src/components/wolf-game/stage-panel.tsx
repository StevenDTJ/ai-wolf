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

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  waiting: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 border-gray-300',
  },
  night: {
    icon: <Moon className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-300',
  },
  night_witch: {
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 border-pink-300',
  },
  night_seer: {
    icon: <EyeIcon className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 border-purple-300',
  },
  night_werewolf: {
    icon: <Skull className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 border-red-300',
  },
  werewolf_chat: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 border-red-300',
  },
  day: {
    icon: <Sun className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 border-yellow-300',
  },
  day_speech: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 border-yellow-300',
  },
  voting: {
    icon: <Swords className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 border-orange-300',
  },
  ended: {
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-300',
  },
};

export function StagePanel({ status, currentRound }: StagePanelProps) {
  const config = status ? STATUS_CONFIG[status] : STATUS_CONFIG.waiting;
  const label = status ? getPhaseLabel(status) : '等待开始';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>当前阶段</span>
          {status && status !== 'waiting' && status !== 'ended' && (
            <Badge variant="outline" className="text-xs">
              第 {currentRound} 天
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${config.bgColor}`}>
          {config.icon}
          <span className={`font-medium ${config.color}`}>{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
