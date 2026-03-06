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

export function TimelinePanel({ events, viewMode }: TimelinePanelProps) {
  const groupedEvents = groupEventsByRound(events);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">游戏时间线</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {Array.from(groupedEvents.entries()).map(([round, roundEvents]) => (
              <div key={round}>
                <Badge variant="outline" className="mb-2">
                  第 {round} 天
                </Badge>
                <div className="space-y-2">
                  {roundEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 rounded border bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{getEventIcon(event.type)}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1">{formatEventText(event, viewMode)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                暂无游戏事件
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
