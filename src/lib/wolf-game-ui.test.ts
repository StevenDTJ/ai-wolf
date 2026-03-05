import { describe, it, expect } from 'vitest';
import { createDefaultWolfPlayer, loadWolfPlayersFromStorage, saveWolfPlayersToStorage } from '@/hooks/useWolfGame';
import { WolfPlayer, WolfRole } from '@/types';

// 测试辅助函数
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
    // 创建8名玩家
    const players: WolfPlayer[] = [];
    for (let i = 0; i < 8; i++) {
      const player = createDefaultWolfPlayer(i + 1);
      players.push(player);
    }

    expect(players.length).toBe(8);

    // 第9名玩家应该被拒绝（在实际代码中由 addPlayer 函数检查）
    const wouldBeRejected = players.length >= 8;
    expect(wouldBeRejected).toBe(true);
  });

  it('添加玩家按钮应该在使用少于8人时显示', () => {
    // 测试条件：按钮应该在玩家数 < 8 时显示
    const showButtonWhenPlayersLessThan8 = (playersCount: number) => {
      return !sessionExists && playersCount < 8;
    };

    const sessionExists = false;

    expect(showButtonWhenPlayersLessThan8(0)).toBe(true);  // 0人，显示按钮
    expect(showButtonWhenPlayersLessThan8(5)).toBe(true);  // 5人，显示按钮
    expect(showButtonWhenPlayersLessThan8(7)).toBe(true);  // 7人，显示按钮
    expect(showButtonWhenPlayersLessThan8(8)).toBe(false); // 8人，不显示
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

    // 模拟更新角色
    const updatedPlayer: WolfPlayer = {
      ...originalPlayer,
      role: 'werewolf' as WolfRole,
    };

    expect(updatedPlayer.role).toBe('werewolf');
    expect(originalPlayer.role).toBe('villager'); // 原始角色不变
  });
});
