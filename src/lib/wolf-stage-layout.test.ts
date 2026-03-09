import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StagePanel } from '@/components/wolf-game/stage-panel';
import { TimelinePanel } from '@/components/wolf-game/timeline-panel';
import { PlayersPanel } from '@/components/wolf-game/players-panel';
import { ActionPanel } from '@/components/wolf-game/action-panel';
import { WolfGame } from '@/components/wolf-game';
import { WolfPlayerCard } from '@/components/wolf-player-card';
import { getEventIcon } from '@/lib/wolf-game-ui';
import type { UiEventV1 } from '@/lib/wolf-engine/uiEvents';
import type { WolfPlayer } from '@/types';
import type { UseWolfGameReturn } from '@/hooks/useWolfGame';

const basePlayer = (overrides: Partial<WolfPlayer> = {}): WolfPlayer => ({
  id: 'p1',
  name: '一号玩家',
  playerNumber: 1,
  role: 'villager',
  isAlive: true,
  hasWill: true,
  wasProtected: false,
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'key',
  systemPrompt: '',
  ...overrides,
});

describe('wolf stage layout refactor', () => {
  it('uses symbolic event icons instead of emoji glyphs', () => {
    expect(getEventIcon('vote_result')).toBe('vote');
    expect(getEventIcon('player_eliminated')).toBe('elimination');
  });

  it('renders the stage panel with the new command-stage shell', () => {
    const markup = renderToStaticMarkup(
      React.createElement(StagePanel, {
        status: 'day_speech',
        currentRound: 2,
        aliveCount: 6,
        totalPlayers: 8,
        isLoading: false,
        currentMessageType: 'speech',
        pendingTransition: null,
        currentSpeakerName: '二号玩家',
        lastEventText: '二号玩家刚刚结束陈述。',
      })
    );

    expect(markup).toContain('wolf-stage-command-shell');
    expect(markup).toContain('wolf-stage-ledger');
    expect(markup).not.toContain('Wolf Command Theatre');
  });

  it('keeps the start action explicit in waiting state', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        status: 'waiting',
        isLoading: false,
        pendingTransition: null,
        currentMessageType: 'inner_thought',
        playerCount: 8,
        requiredPlayers: 8,
        onNextAction: () => {},
        onContinue: () => {},
        onReset: () => {},
        onInit: () => {},
      })
    );

    expect(markup).toContain('开始游戏');
    expect(markup).toContain('wolf-action-command-deck');
  });

  it('renders a single-view workbench without global player/director toggle', () => {
    const wolf: UseWolfGameReturn = {
      session: null,
      players: Array.from({ length: 8 }, (_, index) => basePlayer({ id: `p${index + 1}`, playerNumber: index + 1, name: `玩家${index + 1}` })),
      playersInitialized: true,
      isLoading: false,
      error: null,
      currentStreamingContent: '',
      currentMessageType: 'speech',
      votes: [],
      votingResults: {},
      currentSpeakerIndex: 0,
      pendingTransition: null,
      uiEvents: [],
      addPlayer: () => {},
      updatePlayer: () => {},
      removePlayer: () => {},
      initGame: () => {},
      startGame: () => {},
      nextAction: async () => {},
      continueTransition: () => {},
      resetGame: () => {},
      stopGeneration: () => {},
    };

    const markup = renderToStaticMarkup(React.createElement(WolfGame, { wolf }));

    expect(markup).toContain('wolf-workbench');
    expect(markup).toContain('wolf-command-bar');
    expect(markup).toContain('wolf-workbench-primary');
    expect(markup).toContain('wolf-workbench-rail');
    expect(markup).toContain('对局消息记录');
    expect(markup).toContain('座位与身份棋盘');
    expect(markup).toContain('最近结算');
    expect(markup).not.toContain('玩家视角');
    expect(markup).not.toContain('导演视角');
  });

  it('renders the timeline and roster with stage-oriented structural anchors', () => {
    const events: UiEventV1[] = [
      {
        id: 'e1',
        type: 'vote_result',
        timestamp: 1,
        data: {
          gameId: 'g1',
          round: 2,
          publicText: '三号玩家被放逐。',
          directorText: '三号玩家以 4 票出局。',
        },
      },
    ];

    const timelineMarkup = renderToStaticMarkup(
      React.createElement(TimelinePanel, { events, viewMode: 'director' })
    );
    const rosterMarkup = renderToStaticMarkup(
      React.createElement(PlayersPanel, {
        players: [basePlayer(), basePlayer({ id: 'p2', name: '二号玩家', playerNumber: 2, role: 'werewolf' })],
        showGameInfo: true,
        currentSpeakerId: 'p2',
      })
    );

    expect(timelineMarkup).toContain('wolf-timeline-rail');
    expect(rosterMarkup).toContain('wolf-roster-board');
    expect(rosterMarkup).toContain('wolf-roster-scroll');
  });

  it('renders neutral stage events with black hard-edge border treatment', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelinePanel, {
        viewMode: 'player',
        events: [
          {
            id: 'phase-1',
            type: 'phase_changed',
            timestamp: 1,
            data: {
              gameId: 'g1',
              round: 2,
              previousStatus: 'night_werewolf',
              currentStatus: 'day',
              publicText: '狼人行动阶段',
              directorText: '狼人行动阶段',
            },
          },
        ],
      })
    );

    expect(markup).toContain('bg-[rgba(255,255,255,0.96)]');
    expect(markup).toContain('rounded-none');
    expect(markup).toContain('border-[2px]');
    expect(markup).toContain('border-[#454341]');
  });

  it('renders eliminated player cards with black background and high-contrast text', () => {
    const markup = renderToStaticMarkup(
      React.createElement(WolfPlayerCard, {
        player: basePlayer({
          id: 'p8',
          name: '八号玩家',
          playerNumber: 8,
          role: 'hunter',
          isAlive: false,
        }),
        showIdentity: true,
      })
    );

    expect(markup).toContain('bg-[#111111]');
    expect(markup).toContain('text-[#f5efe6]');
    expect(markup).toContain('text-[#f8d84a]');
  });
});
