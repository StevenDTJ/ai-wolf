'use client';

import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Users, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { WolfPlayer } from '@/types';
import { WolfPlayerCard } from '@/components/wolf-player-card';
import { summarizePlayerRoster } from '@/lib/wolf-game-ui';

interface PlayersPanelProps {
  players: WolfPlayer[];
  showGameInfo: boolean;
  currentSpeakerId?: string;
  onEditPlayer?: (player: WolfPlayer) => void;
  onRemovePlayer?: (id: string) => void;
  onAddPlayer?: () => void;
}

function StatBadge({ children, tone }: { children: ReactNode; tone: 'neutral' | 'green' | 'red' }) {
  const toneClass = tone === 'green'
    ? 'border-[2px] border-[#454341] bg-[#f4efea] text-[#173f3a]'
    : tone === 'red'
      ? 'border-[2px] border-[#454341] bg-[#f4efea] text-[#69211d]'
      : 'border-[2px] border-[#454341] bg-[#f4efea] text-[#3e3d3c]';

  return (
    <span className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1 font-mono text-[0.7rem] ${toneClass}`}>
      {children}
    </span>
  );
}

export function PlayersPanel({
  players,
  showGameInfo,
  currentSpeakerId,
  onEditPlayer,
  onRemovePlayer,
  onAddPlayer,
}: PlayersPanelProps) {
  const summary = summarizePlayerRoster(players);

  return (
    <Card className="wolf-theme-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[28px]">
      <CardHeader className="border-b border-[rgba(69,67,65,0.16)] pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="wolf-kicker">玩家棋盘</div>
              <CardTitle className="text-[0.95rem] font-semibold text-[hsl(40_25%_12%)]">座位与身份棋盘</CardTitle>
            </div>
            <Badge variant="outline" className="wolf-stat-pill">{summary.total} 席</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatBadge tone="green"><Users className="h-3.5 w-3.5" />存活 {summary.alive}</StatBadge>
            <StatBadge tone="red"><ShieldAlert className="h-3.5 w-3.5" />出局 {summary.eliminated}</StatBadge>
            <StatBadge tone="green"><ShieldCheck className="h-3.5 w-3.5" />已配置 {summary.configured}</StatBadge>
            <StatBadge tone={summary.readyToStart ? 'green' : 'red'}><TriangleAlert className="h-3.5 w-3.5" />{summary.readyToStart ? '可开局' : `${summary.missingConfig} 待补全`}</StatBadge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-2">
        <ScrollArea className="wolf-roster-scroll min-h-0 flex-1 pr-2">
          <div className="wolf-roster-board flex flex-col gap-2 pb-1">
            {[...players]
              .sort((a, b) => a.playerNumber - b.playerNumber)
              .map((player) => (
                <WolfPlayerCard
                  key={player.id}
                  player={player}
                  showIdentity={showGameInfo}
                  isCurrentSpeaker={currentSpeakerId === player.id}
                  onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
                  onRemove={onRemovePlayer ? () => onRemovePlayer(player.id) : undefined}
                />
              ))}
          </div>
        </ScrollArea>

        {!showGameInfo && players.length < 8 && onAddPlayer && (
          <Button variant="outline" className="wolf-command-button wolf-command-button-secondary mt-2 h-9 w-full border-[2px] border-[#454341] bg-[var(--panel)]" onClick={onAddPlayer}>
            <UserPlus className="mr-2 h-4 w-4" />
            添加玩家
          </Button>
        )}
      </CardContent>
    </Card>
  );
}




