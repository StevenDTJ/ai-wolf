'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UiEventV1 } from '@/lib/wolf-engine/uiEvents';
import { formatEventText, getEventIcon, getEventMeta } from '@/lib/wolf-game-ui';
import { cn } from '@/lib/utils';
import {
  ArrowRightLeft,
  CircleDot,
  MessageSquareText,
  MoonStar,
  Skull,
  SunMedium,
  Swords,
  Trophy,
} from 'lucide-react';

interface TimelinePanelProps {
  events: UiEventV1[];
  viewMode: 'player' | 'director';
}

const TONE_CLASS_MAP = {
  neutral: 'border-[2px] border-[#454341] bg-[rgba(255,255,255,0.96)]',
  night: 'border-[2px] border-[#454341] bg-[#6fc2ff]',
  day: 'border-[2px] border-[#454341] bg-[#ffde00]',
  vote: 'border-[2px] border-[#454341] bg-[#ff9538]',
  critical: 'border-[2px] border-[#454341] bg-[#ff7169]',
} as const;

function EventGlyph({ type }: { type: ReturnType<typeof getEventIcon> }) {
  switch (type) {
    case 'phase':
      return <ArrowRightLeft className="h-4 w-4" />;
    case 'elimination':
      return <Skull className="h-4 w-4" />;
    case 'ballot':
      return <CircleDot className="h-4 w-4" />;
    case 'vote':
      return <Swords className="h-4 w-4" />;
    case 'night':
      return <MoonStar className="h-4 w-4" />;
    case 'message':
      return <MessageSquareText className="h-4 w-4" />;
    case 'victory':
      return <Trophy className="h-4 w-4" />;
    case 'round':
      return <SunMedium className="h-4 w-4" />;
    default:
      return <ArrowRightLeft className="h-4 w-4" />;
  }
}

function getIconToneClasses(tone: ReturnType<typeof getEventMeta>['tone']) {
  switch (tone) {
    case 'night':
      return 'border-[2px] border-[#454341] bg-[#6fc2ff] text-[#17496a]';
    case 'day':
      return 'border-[2px] border-[#454341] bg-[#ffde00] text-[#5d4f00]';
    case 'vote':
      return 'border-[2px] border-[#454341] bg-[#ff9538] text-[#7c4109]';
    case 'critical':
      return 'border-[2px] border-[#454341] bg-[#ff7169] text-[#7e2420]';
    default:
      return 'border-[2px] border-[#454341] bg-[rgba(255,255,255,0.96)] text-[hsl(220_9%_30%)]';
  }
}

export function TimelinePanel({ events, viewMode }: TimelinePanelProps) {
  const criticalCount = events.filter(event => getEventMeta(event.type).isCritical).length;
  const recentEvents = [...events].slice(-6).reverse();

  return (
    <Card className="wolf-theme-panel flex h-full min-h-0 flex-col overflow-hidden rounded-none">
      <CardHeader className="border-b border-[rgba(69,67,65,0.16)] pb-2.5">
        <div className="space-y-2">
          <div className="space-y-0.5">
            <div className="wolf-kicker">事件轨道</div>
            <CardTitle className="text-[1rem] font-semibold text-[hsl(40_25%_12%)]">最近结算</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="wolf-stat-pill">事件 {events.length}</Badge>
            <Badge variant="outline" className="wolf-stat-pill">关键 {criticalCount}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-3">
        <ScrollArea className="h-full pr-2">
          <div className="wolf-timeline-rail space-y-2.5">
            {recentEvents.map((event) => {
              const eventMeta = getEventMeta(event.type);
              return (
                <article
                  key={event.id}
                  className={cn(
                    'wolf-timeline-item',
                    TONE_CLASS_MAP[eventMeta.tone],
                    eventMeta.isCritical && 'wolf-event-critical'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('wolf-timeline-icon', getIconToneClasses(eventMeta.tone))}>
                      <EventGlyph type={getEventIcon(event.type)} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[hsl(40_25%_12%)]">{eventMeta.label}</span>
                        {eventMeta.isCritical && (
                          <Badge variant="outline" className="wolf-critical-pill border-[2px] border-[#454341] bg-[#ff7169] text-[#7e2420]">关键</Badge>
                        )}
                      </div>
                      <p className="text-[12px] leading-5 text-[hsl(40_12%_32%)]">{formatEventText(event, viewMode)}</p>
                    </div>
                    <time className="shrink-0 text-xs text-[hsl(40_10%_42%)]">
                      {new Date(event.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </article>
              );
            })}
            {events.length === 0 && (
              <div className="flex min-h-[8rem] flex-col items-center justify-center rounded-none border border-dashed border-[rgba(69,67,65,0.22)] bg-[rgba(255,255,255,0.6)] px-4 text-center text-[hsl(40_10%_42%)]">
                <p className="text-sm font-medium text-[hsl(40_25%_18%)]">暂无游戏事件</p>
                <p className="mt-1 text-[12px] leading-5">开始游戏后，这里会显示最近 6 条关键结算。</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


