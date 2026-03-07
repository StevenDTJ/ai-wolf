// Wolf Game UI Helper Functions
// Provides pure utility functions for UI rendering

import type { UiEventV1, UiEventType } from './wolf-engine/uiEvents';
import type { WolfGameStatus, WolfPlayer, WolfRole } from '@/types';

export type WolfPhaseTone = 'setup' | 'night' | 'day' | 'vote' | 'end';
export type WolfEventIcon = 'phase' | 'elimination' | 'ballot' | 'vote' | 'night' | 'message' | 'victory' | 'round';

export interface WolfPhaseMeta {
  label: string;
  summary: string;
  tone: WolfPhaseTone;
  actionLabel: string;
}

export interface WolfPhasePalette {
  tone: WolfPhaseTone;
  spotlightLabel: string;
  bannerClass: string;
  accentClass: string;
  chipClass: string;
  glowClass: string;
}

export interface WolfEventMeta {
  label: string;
  tone: 'neutral' | 'night' | 'day' | 'vote' | 'critical';
  isCritical: boolean;
}

export interface WolfPlayerStateMeta {
  stateLabel: string;
  emphasis: 'focus' | 'alive' | 'warning' | 'out';
  readinessLabel: string;
  roleVisibilityLabel: string;
}

export interface WolfRosterSummary {
  total: number;
  alive: number;
  eliminated: number;
  configured: number;
  missingConfig: number;
  readyToStart: boolean;
  roles: Record<WolfRole, number>;
}

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

export function getPhaseMeta(status: WolfGameStatus | string | undefined): WolfPhaseMeta {
  const metaMap: Record<string, WolfPhaseMeta> = {
    waiting: {
      label: '等待开始',
      summary: '配置玩家与模型后即可开始第 1 夜。',
      tone: 'setup',
      actionLabel: '准备对局',
    },
    night: {
      label: '夜晚',
      summary: '系统正在推进夜间行动，优先处理神职与狼人回合。',
      tone: 'night',
      actionLabel: '推进夜晚',
    },
    night_witch: {
      label: '女巫行动',
      summary: '关键技能决策阶段，解药与毒药会直接改变局势。',
      tone: 'night',
      actionLabel: '处理女巫行动',
    },
    night_seer: {
      label: '预言家行动',
      summary: '查验结果会影响白天的信息结构与发言重心。',
      tone: 'night',
      actionLabel: '处理查验',
    },
    night_werewolf: {
      label: '狼人行动',
      summary: '狼人正在确定夜间目标，阵营博弈进入核心时段。',
      tone: 'night',
      actionLabel: '推进狼刀',
    },
    werewolf_chat: {
      label: '狼人密聊',
      summary: '密聊信息仅对导演视角完整可见，是夜晚的关键情报源。',
      tone: 'night',
      actionLabel: '确认密聊结果',
    },
    day: {
      label: '白天',
      summary: '公开信息生效，桌面进入讨论与信息对齐阶段。',
      tone: 'day',
      actionLabel: '进入白天',
    },
    day_speech: {
      label: '白天发言',
      summary: '当前以发言推进局势，关注场上话语权与怀疑链条。',
      tone: 'day',
      actionLabel: '推进发言',
    },
    voting: {
      label: '集中表决',
      summary: '所有公开信息在此收束，放逐结果将直接改写人数结构。',
      tone: 'vote',
      actionLabel: '推进投票',
    },
    ended: {
      label: '游戏结束',
      summary: '胜负已经确定，可以复盘时间线并重新开始新一局。',
      tone: 'end',
      actionLabel: '复盘对局',
    },
  };

  return metaMap[status || 'waiting'] || {
    label: getPhaseLabel(status || 'waiting'),
    summary: '阶段信息已更新。',
    tone: 'setup',
    actionLabel: '继续',
  };
}

export function getPhasePalette(status: WolfGameStatus | string | undefined): WolfPhasePalette {
  const tone = getPhaseMeta(status).tone;
  const paletteMap: Record<WolfPhaseTone, WolfPhasePalette> = {
    setup: {
      tone: 'setup',
      spotlightLabel: '准备阶段',
      bannerClass: 'wolf-stage-banner-setup',
      accentClass: 'wolf-stage-accent-setup',
      chipClass: 'wolf-stage-pill-setup',
      glowClass: 'wolf-stage-focus-setup',
    },
    night: {
      tone: 'night',
      spotlightLabel: '夜间行动',
      bannerClass: 'wolf-stage-banner-night',
      accentClass: 'wolf-stage-accent-night',
      chipClass: 'wolf-stage-pill-night',
      glowClass: 'wolf-stage-focus-night',
    },
    day: {
      tone: 'day',
      spotlightLabel: '公开讨论',
      bannerClass: 'wolf-stage-banner-day',
      accentClass: 'wolf-stage-accent-day',
      chipClass: 'wolf-stage-pill-day',
      glowClass: 'wolf-stage-focus-day',
    },
    vote: {
      tone: 'vote',
      spotlightLabel: '集中表决',
      bannerClass: 'wolf-stage-banner-vote',
      accentClass: 'wolf-stage-accent-vote',
      chipClass: 'wolf-stage-pill-vote',
      glowClass: 'wolf-stage-focus-vote',
    },
    end: {
      tone: 'end',
      spotlightLabel: '胜负已定',
      bannerClass: 'wolf-stage-banner-end',
      accentClass: 'wolf-stage-accent-end',
      chipClass: 'wolf-stage-pill-end',
      glowClass: 'wolf-stage-focus-end',
    },
  };

  return paletteMap[tone];
}

export function getPlayerStateMeta(
  player: WolfPlayer,
  options: { isCurrentSpeaker?: boolean; showIdentity?: boolean } = {}
): WolfPlayerStateMeta {
  const configured = Boolean(player.apiKey && player.model);

  if (!player.isAlive) {
    return {
      stateLabel: '已出局',
      emphasis: 'out',
      readinessLabel: '行动结束',
      roleVisibilityLabel: options.showIdentity ? '身份公开' : '状态已锁定',
    };
  }

  if (options.isCurrentSpeaker) {
    return {
      stateLabel: '当前发言',
      emphasis: 'focus',
      readinessLabel: configured ? '配置完成' : '配置待补全',
      roleVisibilityLabel: options.showIdentity ? '身份可见' : '身份隐藏',
    };
  }

  if (!configured) {
    return {
      stateLabel: '待补全',
      emphasis: 'warning',
      readinessLabel: '配置待补全',
      roleVisibilityLabel: options.showIdentity ? '身份可见' : '身份隐藏',
    };
  }

  return {
    stateLabel: '在场',
    emphasis: 'alive',
    readinessLabel: '配置完成',
    roleVisibilityLabel: options.showIdentity ? '身份可见' : '身份隐藏',
  };
}

export function summarizePlayerRoster(players: WolfPlayer[]): WolfRosterSummary {
  const roles: Record<WolfRole, number> = {
    villager: 0,
    werewolf: 0,
    seer: 0,
    witch: 0,
    hunter: 0,
  };

  let alive = 0;
  let configured = 0;

  players.forEach((player) => {
    roles[player.role] += 1;
    if (player.isAlive) {
      alive += 1;
    }
    if (player.apiKey && player.model) {
      configured += 1;
    }
  });

  const total = players.length;
  const eliminated = total - alive;
  const missingConfig = total - configured;

  return {
    total,
    alive,
    eliminated,
    configured,
    missingConfig,
    readyToStart: total === 8 && missingConfig === 0,
    roles,
  };
}

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

export type PanelType = 'timeline' | 'stage' | 'action' | 'players';

export function shouldShowPanel(panel: PanelType, status: WolfGameStatus | string): boolean {
  switch (panel) {
    case 'timeline':
      return status !== undefined && status !== '';
    case 'stage':
      return status !== 'waiting' && status !== 'ended';
    case 'action':
      return ['day', 'day_speech', 'voting', 'night', 'night_witch', 'night_seer', 'night_werewolf', 'werewolf_chat'].includes(status);
    case 'players':
      return true;
    default:
      return false;
  }
}

export function getEventIcon(type: UiEventType): WolfEventIcon {
  const iconMap: Record<UiEventType, WolfEventIcon> = {
    phase_changed: 'phase',
    player_eliminated: 'elimination',
    vote_cast: 'ballot',
    vote_result: 'vote',
    night_action: 'night',
    message_added: 'message',
    game_ended: 'victory',
    round_started: 'round',
  };
  return iconMap[type] || 'phase';
}

export function getEventMeta(type: UiEventType): WolfEventMeta {
  const metaMap: Record<UiEventType, WolfEventMeta> = {
    round_started: {
      label: '轮次开始',
      tone: 'day',
      isCritical: false,
    },
    phase_changed: {
      label: '阶段切换',
      tone: 'neutral',
      isCritical: false,
    },
    player_eliminated: {
      label: '玩家出局',
      tone: 'critical',
      isCritical: true,
    },
    vote_cast: {
      label: '投票记录',
      tone: 'vote',
      isCritical: false,
    },
    vote_result: {
      label: '投票结果',
      tone: 'critical',
      isCritical: true,
    },
    night_action: {
      label: '夜间结果',
      tone: 'night',
      isCritical: false,
    },
    message_added: {
      label: '新增消息',
      tone: 'day',
      isCritical: false,
    },
    game_ended: {
      label: '胜负已定',
      tone: 'critical',
      isCritical: true,
    },
  };

  return metaMap[type];
}

export function formatEventText(event: UiEventV1, viewMode: 'player' | 'director'): string {
  const data = event.data as Record<string, unknown>;

  if (viewMode === 'director') {
    if (data.directorText && typeof data.directorText === 'string') {
      return data.directorText;
    }
  }

  if (data.publicText && typeof data.publicText === 'string') {
    return data.publicText;
  }

  return getPhaseLabel((data.currentStatus as string) || event.type);
}
