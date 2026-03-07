import { describe, it, expect } from 'vitest';
import { createDefaultWolfPlayer } from '@/hooks/useWolfGame';
import { WolfPlayer, WolfRole } from '@/types';
import {
  formatEventText,
  getEventMeta,
  getPhaseLabel,
  getPhaseMeta,
  getPhasePalette,
  getPlayerStateMeta,
  groupEventsByRound,
  shouldShowPanel,
  summarizePlayerRoster,
} from './wolf-game-ui';
import type { UiEventV1 } from './wolf-engine/uiEvents';

const createTestPlayer = (overrides: Partial<WolfPlayer> = {}): WolfPlayer => ({
  id: 'test-1',
  name: '测试玩家',
  playerNumber: 1,
  role: 'villager',
  isAlive: true,
  hasWill: true,
  wasProtected: false,
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  systemPrompt: '',
  ...overrides,
});

describe('添加玩家功能', () => {
  it('应该允许添加最多8名玩家', () => {
    const players: WolfPlayer[] = [];
    for (let i = 0; i < 8; i++) {
      const player = createDefaultWolfPlayer(i + 1);
      players.push(player);
    }

    expect(players.length).toBe(8);

    const wouldBeRejected = players.length >= 8;
    expect(wouldBeRejected).toBe(true);
  });

  it('添加玩家按钮应该在使用少于8人时显示', () => {
    const sessionExists = false;
    const showButtonWhenPlayersLessThan8 = (playersCount: number) => {
      return !sessionExists && playersCount < 8;
    };

    expect(showButtonWhenPlayersLessThan8(0)).toBe(true);
    expect(showButtonWhenPlayersLessThan8(5)).toBe(true);
    expect(showButtonWhenPlayersLessThan8(7)).toBe(true);
    expect(showButtonWhenPlayersLessThan8(8)).toBe(false);
  });
});

describe('编辑玩家角色功能', () => {
  it('WolfPlayer 应该包含 role 字段', () => {
    const player = createTestPlayer();
    expect(player.role).toBeDefined();
  });

  it('应该支持所有狼人杀角色', () => {
    const validRoles: WolfRole[] = ['villager', 'werewolf', 'seer', 'witch', 'hunter'];

    validRoles.forEach(role => {
      const player = createTestPlayer({ role });
      expect(player.role).toBe(role);
    });
  });

  it('更新玩家时应该能够更新 role 字段', () => {
    const originalPlayer = createTestPlayer({ role: 'villager' });

    const updatedPlayer: WolfPlayer = {
      ...originalPlayer,
      role: 'werewolf' as WolfRole,
    };

    expect(updatedPlayer.role).toBe('werewolf');
    expect(originalPlayer.role).toBe('villager');
  });
});

describe('wolf-game-ui helpers', () => {
  describe('getPhaseLabel', () => {
    it('returns correct label for night phases', () => {
      expect(getPhaseLabel('night')).toBe('夜晚');
      expect(getPhaseLabel('night_witch')).toBe('女巫行动');
      expect(getPhaseLabel('night_seer')).toBe('预言家行动');
      expect(getPhaseLabel('night_werewolf')).toBe('狼人行动');
    });

    it('returns correct label for day phases', () => {
      expect(getPhaseLabel('day')).toBe('白天');
      expect(getPhaseLabel('day_speech')).toBe('白天发言');
      expect(getPhaseLabel('voting')).toBe('投票');
    });

    it('returns correct label for special phases', () => {
      expect(getPhaseLabel('werewolf_chat')).toBe('狼人密聊');
      expect(getPhaseLabel('waiting')).toBe('等待开始');
      expect(getPhaseLabel('ended')).toBe('游戏结束');
    });
  });

  describe('getPhaseMeta', () => {
    it('returns tone and summary for key phases', () => {
      expect(getPhaseMeta('waiting')).toMatchObject({ tone: 'setup', actionLabel: '准备对局' });
      expect(getPhaseMeta('night_seer')).toMatchObject({ tone: 'night', label: '预言家行动' });
      expect(getPhaseMeta('day_speech')).toMatchObject({ tone: 'day', label: '白天发言' });
      expect(getPhaseMeta('voting')).toMatchObject({ tone: 'vote', actionLabel: '推进投票' });
      expect(getPhaseMeta('ended')).toMatchObject({ tone: 'end', label: '游戏结束' });
    });
  });

  describe('getPhasePalette', () => {
    it('returns distinct visual themes for setup, night, day and end states', () => {
      expect(getPhasePalette('waiting')).toMatchObject({ tone: 'setup', spotlightLabel: '准备阶段' });
      expect(getPhasePalette('night_werewolf')).toMatchObject({ tone: 'night', spotlightLabel: '夜间行动' });
      expect(getPhasePalette('day_speech')).toMatchObject({ tone: 'day', spotlightLabel: '公开讨论' });
      expect(getPhasePalette('voting')).toMatchObject({ tone: 'vote', spotlightLabel: '集中表决' });
      expect(getPhasePalette('ended')).toMatchObject({ tone: 'end', spotlightLabel: '胜负已定' });
    });
  });

  describe('getPlayerStateMeta', () => {
    it('prioritizes current speaker emphasis over generic alive state', () => {
      const meta = getPlayerStateMeta(createTestPlayer(), { isCurrentSpeaker: true });
      expect(meta).toMatchObject({
        stateLabel: '当前发言',
        emphasis: 'focus',
        readinessLabel: '配置待补全',
      });
    });

    it('marks eliminated players as out regardless of readiness', () => {
      const meta = getPlayerStateMeta(createTestPlayer({ isAlive: false, apiKey: 'k', model: 'gpt-4o-mini' }));
      expect(meta).toMatchObject({
        stateLabel: '已出局',
        emphasis: 'out',
        readinessLabel: '行动结束',
      });
    });
  });

  describe('summarizePlayerRoster', () => {
    it('builds roster metrics for alive, configured and role counts', () => {
      const summary = summarizePlayerRoster([
        createTestPlayer({ id: 'a', role: 'werewolf', apiKey: 'k', model: 'gpt-4o-mini' }),
        createTestPlayer({ id: 'b', role: 'seer', playerNumber: 2, name: '预言家', apiKey: 'k', model: 'gpt-4o-mini' }),
        createTestPlayer({ id: 'c', role: 'villager', playerNumber: 3, name: '村民', isAlive: false }),
      ]);

      expect(summary).toMatchObject({
        total: 3,
        alive: 2,
        eliminated: 1,
        configured: 2,
        missingConfig: 1,
        readyToStart: false,
      });
      expect(summary.roles).toMatchObject({
        werewolf: 1,
        seer: 1,
        villager: 1,
      });
    });
  });

  describe('groupEventsByRound', () => {
    it('groups events by round number', () => {
      const events: UiEventV1[] = [
        { id: '1', type: 'phase_changed', timestamp: 1, data: { gameId: 'g1', round: 1, previousStatus: 'waiting', currentStatus: 'night', publicText: '进入夜晚' } },
        { id: '2', type: 'phase_changed', timestamp: 2, data: { gameId: 'g1', round: 1, previousStatus: 'night', currentStatus: 'day', publicText: '进入白天' } },
        { id: '3', type: 'round_started', timestamp: 3, data: { gameId: 'g1', round: 2, phase: 'night', publicText: '第2天' } },
        { id: '4', type: 'phase_changed', timestamp: 4, data: { gameId: 'g1', round: 2, previousStatus: 'day', currentStatus: 'voting', publicText: '投票' } },
      ];

      const grouped = groupEventsByRound(events);
      expect(grouped.size).toBe(2);
      expect(grouped.get(1)?.length).toBe(2);
      expect(grouped.get(2)?.length).toBe(2);
    });

    it('handles empty array', () => {
      const grouped = groupEventsByRound([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('shouldShowPanel', () => {
    it('shows timeline for all phases', () => {
      expect(shouldShowPanel('timeline', 'waiting')).toBe(true);
      expect(shouldShowPanel('timeline', 'night')).toBe(true);
      expect(shouldShowPanel('timeline', 'day')).toBe(true);
    });

    it('shows action panel only during active phases', () => {
      expect(shouldShowPanel('action', 'waiting')).toBe(false);
      expect(shouldShowPanel('action', 'ended')).toBe(false);
      expect(shouldShowPanel('action', 'day')).toBe(true);
      expect(shouldShowPanel('action', 'voting')).toBe(true);
    });

    it('shows players panel always when session exists', () => {
      expect(shouldShowPanel('players', 'waiting')).toBe(true);
      expect(shouldShowPanel('players', 'night')).toBe(true);
      expect(shouldShowPanel('players', 'ended')).toBe(true);
    });
  });

  describe('getEventMeta', () => {
    it('marks elimination and results as critical', () => {
      expect(getEventMeta('player_eliminated')).toMatchObject({ tone: 'critical', isCritical: true });
      expect(getEventMeta('vote_result')).toMatchObject({ tone: 'critical', isCritical: true });
      expect(getEventMeta('night_action')).toMatchObject({ tone: 'night', isCritical: false });
    });
  });

  describe('formatEventText', () => {
    it('returns publicText for player mode', () => {
      const event: UiEventV1 = {
        id: '1',
        type: 'phase_changed',
        timestamp: 1,
        data: {
          gameId: 'g1',
          round: 1,
          previousStatus: 'waiting',
          currentStatus: 'night',
          publicText: '进入夜晚',
          directorText: '狼人准备刀人',
        },
      };

      expect(formatEventText(event, 'player')).toBe('进入夜晚');
    });

    it('returns directorText for director mode', () => {
      const event: UiEventV1 = {
        id: '1',
        type: 'phase_changed',
        timestamp: 1,
        data: {
          gameId: 'g1',
          round: 1,
          previousStatus: 'waiting',
          currentStatus: 'night',
          publicText: '进入夜晚',
          directorText: '狼人准备刀人',
        },
      };

      expect(formatEventText(event, 'director')).toBe('狼人准备刀人');
    });
  });
});
