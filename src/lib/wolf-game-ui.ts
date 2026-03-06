// Wolf Game UI Helper Functions
// Provides pure utility functions for UI rendering

import type { UiEventV1, UiEventType } from './wolf-engine/uiEvents';
import type { WolfGameStatus } from '@/types';

// Map game status to display label
export function getPhaseLabel(status: WolfGameStatus | string): string {
  const labelMap: Record<string, string> = {
    waiting: '等待开始',
    night: '夜晚',
    night_witch: '女巫行动',
    night_seer: '预言家行动',
    night_werewolf: '狼人行动',
    werewolf_chat: '狼人密聊',
    day: '白天',
    day_speech: '白天发言',
    voting: '投票',
    ended: '游戏结束',
  };
  return labelMap[status] || status;
}

// Group UI events by round number
export function groupEventsByRound(events: UiEventV1[]): Map<number, UiEventV1[]> {
  const grouped = new Map<number, UiEventV1[]>();

  events.forEach(event => {
    const round = (event.data as { round?: number }).round || 1;
    if (!grouped.has(round)) {
      grouped.set(round, []);
    }
    grouped.get(round)!.push(event);
  });

  return grouped;
}

// Panel types for 4-zone layout
export type PanelType = 'timeline' | 'stage' | 'action' | 'players';

// Determine if a panel should be shown based on game status
export function shouldShowPanel(panel: PanelType, status: WolfGameStatus | string): boolean {
  switch (panel) {
    case 'timeline':
      // Timeline always visible when game is active
      return status !== undefined && status !== '';
    case 'stage':
      // Stage panel shows current phase info
      return status !== 'waiting' && status !== 'ended';
    case 'action':
      // Action panel only during active gameplay
      return ['day', 'day_speech', 'voting', 'night', 'night_witch', 'night_seer', 'night_werewolf', 'werewolf_chat'].includes(status);
    case 'players':
      // Players always visible
      return true;
    default:
      return false;
  }
}

// Get event icon type based on event type
export function getEventIcon(type: UiEventType): string {
  const iconMap: Record<UiEventType, string> = {
    phase_changed: '🔄',
    player_eliminated: '💀',
    vote_cast: '🗳️',
    vote_result: '📊',
    night_action: '🌙',
    message_added: '💬',
    game_ended: '🏆',
    round_started: '🌅',
  };
  return iconMap[type] || '•';
}

// Format event for display based on view mode
export function formatEventText(event: UiEventV1, viewMode: 'player' | 'director'): string {
  const data = event.data as Record<string, unknown>;

  if (viewMode === 'director') {
    // Director mode: show directorText if available
    if (data.directorText && typeof data.directorText === 'string') {
      return data.directorText;
    }
  }

  // Player mode: show publicText
  if (data.publicText && typeof data.publicText === 'string') {
    return data.publicText;
  }

  return getPhaseLabel((data.currentStatus as string) || event.type);
}
