import { createUiEvent, type UiEventV1, type UiEventType } from './uiEvents';

// Generate deterministic mock events for a complete round
export function buildMockRoundEvents(round: number): UiEventV1[] {
  const gameId = 'mock-game-1';
  const baseTimestamp = 1700000000000 + round * 100000;

  const events: UiEventV1[] = [];

  // Round started
  events.push(
    createUiEvent('round_started', {
      gameId,
      round,
      phase: 'night',
      publicText: `第 ${round} 天夜晚降临`,
      directorText: `第 ${round} 天 - 夜晚阶段开始`,
    })
  );

  // Night actions
  events.push(
    createUiEvent('night_action', {
      gameId,
      round,
      actionType: 'seer_check',
      targetId: 'p3',
      targetName: '玩家3',
      result: 'success',
      publicText: '预言家查验了玩家3',
      directorText: '预言家查验 玩家3 为好人',
    })
  );

  events.push(
    createUiEvent('night_action', {
      gameId,
      round,
      actionType: 'wolf_kill',
      targetId: 'p5',
      targetName: '玩家5',
      result: 'success',
      publicText: '狼人击杀了玩家5',
      directorText: '狼人击杀 玩家5 (村民)',
    })
  );

  // Phase changed to day
  events.push(
    createUiEvent('phase_changed', {
      gameId,
      round,
      previousStatus: 'night',
      currentStatus: 'day',
      publicText: '天亮了',
      directorText: '进入白天讨论阶段',
    })
  );

  // Day phase events
  events.push(
    createUiEvent('message_added', {
      gameId,
      round,
      playerId: 'p1',
      playerName: '玩家1',
      messageType: 'speech',
      content: '昨晚平安夜，大家有什么想法？',
      publicText: '玩家1 发言',
    })
  );

  events.push(
    createUiEvent('message_added', {
      gameId,
      round,
      playerId: 'p2',
      playerName: '玩家2',
      messageType: 'speech',
      content: '我建议先跳过，观察一下局势。',
      publicText: '玩家2 发言',
    })
  );

  // Voting phase
  events.push(
    createUiEvent('phase_changed', {
      gameId,
      round,
      previousStatus: 'day',
      currentStatus: 'voting',
      publicText: '投票阶段',
      directorText: '进入投票阶段',
    })
  );

  // Vote cast events
  const voters = ['p1', 'p2', 'p3', 'p4', 'p6', 'p7', 'p8'];
  const targets = ['p4', 'p4', 'p1', 'p4', 'p2', 'p4', 'p1'];

  voters.forEach((voterId, i) => {
    const voterNum = parseInt(voterId.replace('p', ''));
    const targetNum = parseInt(targets[i].replace('p', ''));
    events.push(
      createUiEvent('vote_cast', {
        gameId,
        round,
        voterId,
        voterName: `玩家${voterNum}`,
        targetId: targets[i],
        targetName: `玩家${targetNum}`,
        publicText: `玩家${voterNum} 投票给 玩家${targetNum}`,
      })
    );
  });

  // Vote result
  events.push(
    createUiEvent('vote_result', {
      gameId,
      round,
      eliminatedPlayerId: 'p4',
      eliminatedPlayerName: '玩家4',
      votes: { p1: 2, p2: 1, p4: 4 },
      publicText: '玩家4 获得 4 票被投出',
    })
  );

  // Player eliminated
  events.push(
    createUiEvent('player_eliminated', {
      gameId,
      round,
      playerId: 'p4',
      playerName: '玩家4',
      reason: 'voted_out',
      publicText: '玩家4 被投票出局',
      directorText: '玩家4 (预言家) 被投票出局',
    })
  );

  return events;
}

// Generate mock game timeline for multiple rounds
export function buildMockGameEvents(maxRounds: number = 3): UiEventV1[] {
  const events: UiEventV1[] = [];

  // Initial game start
  events.push(
    createUiEvent('phase_changed', {
      gameId: 'mock-game-1',
      round: 1,
      previousStatus: 'waiting',
      currentStatus: 'night',
      publicText: '游戏开始',
      directorText: '游戏开始 - 第1晚',
    })
  );

  // Generate events for each round
  for (let round = 1; round <= maxRounds; round++) {
    const roundEvents = buildMockRoundEvents(round);
    events.push(...roundEvents);
  }

  // Game ended
  events.push(
    createUiEvent('game_ended', {
      gameId: 'mock-game-1',
      winner: 'good',
      finalRound: maxRounds,
      publicText: '游戏结束，好人获胜',
      directorText: '游戏结束 - 好人阵营获胜',
      summary: {
        goodWins: 1,
        evilWins: 0,
        totalRounds: maxRounds,
      },
    })
  );

  return events;
}

// Mock event source for local development
export interface MockEventSource {
  getEvents: () => UiEventV1[];
  reset: () => void;
}

export function createMockEventSource(rounds: number = 3): MockEventSource {
  let events = buildMockGameEvents(rounds);

  return {
    getEvents: () => events,
    reset: () => {
      events = buildMockGameEvents(rounds);
    },
  };
}
