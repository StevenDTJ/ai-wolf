// Players Panel - Shows player list with status
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Skull, EyeIcon, FlaskConical, Swords, UserPlus, Eye, EyeOff } from 'lucide-react';
import type { WolfPlayer } from '@/types';

interface PlayersPanelProps {
  players: WolfPlayer[];
  showGameInfo: boolean;
  onEditPlayer?: (player: WolfPlayer) => void;
  onRemovePlayer?: (id: string) => void;
  onAddPlayer?: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  villager: { label: '村民', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Users className="w-3 h-3" /> },
  werewolf: { label: '狼人', color: 'bg-red-100 text-red-700 border-red-300', icon: <Skull className="w-3 h-3" /> },
  seer: { label: '预言家', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <EyeIcon className="w-3 h-3" /> },
  witch: { label: '女巫', color: 'bg-pink-100 text-pink-700 border-pink-300', icon: <FlaskConical className="w-3 h-3" /> },
  hunter: { label: '猎人', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <Swords className="w-3 h-3" /> },
};

export function PlayersPanel({
  players,
  showGameInfo,
  onEditPlayer,
  onRemovePlayer,
  onAddPlayer,
}: PlayersPanelProps) {
  const aliveCount = players.filter(p => p.isAlive).length;

  return (
    <Card className="wolf-theme-panel rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="tracking-wide">玩家列表</span>
          {showGameInfo && (
            <Badge variant="outline" className="border-slate-300 bg-white/70">
              {aliveCount} / {players.length} 存活
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-2 gap-2.5">
            {[...players]
              .sort((a, b) => a.playerNumber - b.playerNumber)
              .map((player) => {
                const role = ROLE_CONFIG[player.role] || {
                  label: player.role,
                  color: 'bg-gray-100 text-gray-700 border-gray-300',
                  icon: null,
                };

                return (
                  <div
                    key={player.id}
                    className={`relative p-2.5 rounded-xl border transition-all ${
                      showGameInfo
                        ? player.isAlive
                          ? 'bg-white/90 border-slate-200 shadow-sm'
                          : 'bg-slate-100/90 border-slate-200 opacity-60'
                        : 'bg-white/90 border-slate-200 shadow-sm'
                    }`}
                  >
                    {showGameInfo && (
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${player.isAlive ? 'bg-emerald-500/70' : 'bg-slate-400/80'}`}
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground">
                          #{player.playerNumber}
                        </span>
                        <span className="text-sm font-semibold truncate">{player.name}</span>
                      </div>
                    </div>
                    {showGameInfo && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <Badge variant="outline" className={`text-xs ${role.color}`}>
                          {role.icon}
                          <span className="ml-1">{role.label}</span>
                        </Badge>
                        {!player.isAlive && (
                          <Badge variant="outline" className="text-xs border-slate-300 bg-slate-200/70">
                            淘汰
                          </Badge>
                        )}
                      </div>
                    )}
                    {!showGameInfo && onEditPlayer && (
                      <div className="mt-1.5 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-slate-100"
                          aria-label={`编辑 ${player.name}`}
                          onClick={() => onEditPlayer(player)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {onRemovePlayer && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 rounded-lg hover:text-red-700 hover:bg-red-50"
                            aria-label={`移除 ${player.name}`}
                            onClick={() => onRemovePlayer(player.id)}
                          >
                            <EyeOff className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>
        {!showGameInfo && players.length < 8 && onAddPlayer && (
          <Button
            variant="outline"
            className="w-full mt-3 border-slate-300 bg-white/70 hover:bg-white"
            onClick={onAddPlayer}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            添加玩家
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
