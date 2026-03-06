// Timeline Panel - Shows game event timeline
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UiEventV1 } from '@/lib/wolf-engine/uiEvents';
import { formatEventText, getEventIcon, groupEventsByRound } from '@/lib/wolf-game-ui';

interface TimelinePanelProps {
  events: UiEventV1[];
  viewMode: 'player' | 'director';
}

function isCriticalEvent(type: UiEventV1['type']): boolean {
  return type === 'player_eliminated' || type === 'game_ended' || type === 'transition_prompt';
}

export function TimelinePanel({ events, viewMode }: TimelinePanelProps) {
  const groupedEvents = groupEventsByRound(events);

  return (
    <Card className="wolf-theme-panel rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm tracking-wide">游戏时间线</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {Array.from(groupedEvents.entries()).map(([round, roundEvents]) => (
              <div key={round}>
                <Badge variant="outline" className="mb-2 border-slate-300 bg-white/80">
                  第 {round} 天
                </Badge>
                <div className="space-y-2">
                  {roundEvents.map((event) => {
                    const critical = isCriticalEvent(event.type);
                    return (
                      <div
                        key={event.id}
                        className={`p-2.5 rounded-lg border text-sm ${
                          critical
                            ? 'wolf-event-critical bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-white/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{getEventIcon(event.type)}</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          {critical && (
                            <Badge variant="outline" className="ml-auto text-[10px] border-amber-400 text-amber-700 bg-amber-100">
                              关键
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 leading-6">{formatEventText(event, viewMode)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                暂无游戏事件
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

