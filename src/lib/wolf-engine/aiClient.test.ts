import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDaySpeech, generateFinalSpeech, generateVoteDecision, generateWerewolfChat } from './aiClient';
import { WolfPlayer } from '@/types';
import { DaySpeechContext, NightContext } from './types';

function makePlayer(overrides: Partial<WolfPlayer> = {}): WolfPlayer {
  return {
    id: 'p1',
    name: '玩家1',
    playerNumber: 1,
    role: 'villager',
    isAlive: true,
    hasWill: true,
    wasProtected: false,
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'test-key',
    systemPrompt: 'test-system',
    ...overrides,
  };
}

function mockFetchWithContent(content: string) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: { content },
        },
      ],
    }),
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('aiClient privacy and context', () => {
  it('does not include seer check history in non-seer final speech prompt', async () => {
    const player = makePlayer({ role: 'villager' });
    const mockFetch = mockFetchWithContent('遗言');

    await generateFinalSpeech(player, {
      players: [player],
      alivePlayers: [player],
      seerChecks: [{ playerId: 'p2', playerName: '玩家2', result: 'evil' }],
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    const prompt: string = requestBody.messages[1].content;
    expect(prompt).not.toContain('预言家查验：');
  });

  it('uses provided wolf chat history in werewolf chat prompt', async () => {
    const wolf = makePlayer({ role: 'werewolf' });
    const villager = makePlayer({ id: 'p2', name: '玩家2', playerNumber: 2 });
    const teammate = makePlayer({ id: 'p3', name: '玩家3', playerNumber: 3, role: 'werewolf' });
    const mockFetch = mockFetchWithContent('刀2号');

    const context: NightContext & { chatHistory: string } = {
      currentRound: 2,
      players: [wolf, villager, teammate],
      alivePlayers: [wolf, villager, teammate],
      wolfPlayers: [wolf, teammate],
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
      seerChecks: [],
      lastProtectedId: null,
      witchSaveUsed: false,
      witchPoisonUsed: false,
      publicInfo: {
        speeches: [],
        votes: [],
        systemBroadcasts: [],
        timeline: [],
      },
      privateInfo: {},
      chatHistory: '第二轮密聊：玩家1提议刀2号',
    };

    await generateWerewolfChat(wolf, context);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    const prompt: string = requestBody.messages[1].content;
    expect(prompt).toContain('第二轮密聊：玩家1提议刀2号');
  });

  it('uses previous night broadcast instead of default peace-night text', async () => {
    const wolf = makePlayer({ role: 'werewolf' });
    const villager = makePlayer({ id: 'p2', name: '玩家2', playerNumber: 2 });
    const teammate = makePlayer({ id: 'p3', name: '玩家3', playerNumber: 3, role: 'werewolf' });
    const mockFetch = mockFetchWithContent('刀2号');

    const context: NightContext = {
      currentRound: 3,
      players: [wolf, villager, teammate],
      alivePlayers: [wolf, villager, teammate],
      wolfPlayers: [wolf, teammate],
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
      publicInfo: {
        speeches: [],
        votes: [],
        systemBroadcasts: [
          {
            id: 'sys-1',
            playerId: 'system',
            playerName: '系统',
            content: '天亮了，昨夜死亡：玩家2',
            type: 'speech',
            round: 2,
            timestamp: Date.now(),
          },
        ],
        timeline: [],
      },
      privateInfo: {
        wolfKills: [{ round: 2, targetId: 'p2' }],
      },
    };

    await generateWerewolfChat(wolf, context);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    const prompt: string = requestBody.messages[1].content;
    expect(prompt).toContain('昨夜死亡：玩家2');
    expect(prompt).not.toContain('昨晚无人死亡');
  });

  it('uses fixed public role setup in day speech prompt', async () => {
    const speaker = makePlayer({ id: 'p1', role: 'villager' });
    const wolf = makePlayer({ id: 'p2', role: 'werewolf', playerNumber: 2, name: '玩家2' });
    const seer = makePlayer({ id: 'p3', role: 'seer', playerNumber: 3, name: '玩家3', isAlive: false });
    const witch = makePlayer({ id: 'p4', role: 'witch', playerNumber: 4, name: '玩家4', isAlive: false });
    const hunter = makePlayer({ id: 'p5', role: 'hunter', playerNumber: 5, name: '玩家5', isAlive: false });
    const villager = makePlayer({ id: 'p6', role: 'villager', playerNumber: 6, name: '玩家6' });
    const mockFetch = mockFetchWithContent('我是好人，请相信我。');

    const context: DaySpeechContext = {
      currentRound: 3,
      players: [speaker, wolf, seer, witch, hunter, villager],
      alivePlayers: [speaker, wolf, villager],
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
      previousSpeeches: [],
      publicInfo: {
        speeches: [],
        votes: [],
        systemBroadcasts: [],
        timeline: [],
      },
      privateInfo: {},
    };

    await generateDaySpeech(speaker, context);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    const prompt: string = requestBody.messages[1].content;
    expect(prompt).toContain('场上存活角色类型：村民、狼人、预言家、女巫、猎人');
    expect(prompt).not.toMatch(/场上存活角色类型：村民、狼人\s*$/m);
  });

  it('uses fixed public role setup in vote prompt', async () => {
    const voter = makePlayer({ id: 'p1', role: 'villager' });
    const wolf = makePlayer({ id: 'p2', role: 'werewolf', playerNumber: 2, name: '玩家2' });
    const seer = makePlayer({ id: 'p3', role: 'seer', playerNumber: 3, name: '玩家3', isAlive: false });
    const witch = makePlayer({ id: 'p4', role: 'witch', playerNumber: 4, name: '玩家4', isAlive: false });
    const hunter = makePlayer({ id: 'p5', role: 'hunter', playerNumber: 5, name: '玩家5', isAlive: false });
    const villager = makePlayer({ id: 'p6', role: 'villager', playerNumber: 6, name: '玩家6' });
    const mockFetch = mockFetchWithContent('我投票给2号玩家。');

    const context: DaySpeechContext = {
      currentRound: 3,
      players: [voter, wolf, seer, witch, hunter, villager],
      alivePlayers: [voter, wolf, villager],
      nightAction: {
        protectedId: null,
        checkedId: null,
        checkResult: null,
        killedId: null,
        healedId: null,
        poisonedId: null,
      },
      previousSpeeches: [],
      publicInfo: {
        speeches: [],
        votes: [],
        systemBroadcasts: [],
        timeline: [],
      },
      privateInfo: {},
    };

    await generateVoteDecision(voter, context);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    const prompt: string = requestBody.messages[1].content;
    expect(prompt).toContain('场上存活角色类型：村民、狼人、预言家、女巫、猎人');
    expect(prompt).not.toMatch(/场上存活角色类型：村民、狼人\s*$/m);
  });
});
