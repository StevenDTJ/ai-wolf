import { describe, expect, it } from 'vitest';
import {
  buildTwoPersonRosterRows,
  getTwoPersonComposerState,
  getTwoPersonFrameSpec,
  getTwoPersonIdleSpec,
  getTwoPersonRailState,
  isTwoPersonLaunchEnabled,
} from './debate-stage-layout';

describe('debate stage layout helpers', () => {
  it('enables launch only when topic and both sides are configured', () => {
    expect(isTwoPersonLaunchEnabled('', false, false)).toBe(false);
    expect(isTwoPersonLaunchEnabled('AI should govern society', true, false)).toBe(false);
    expect(isTwoPersonLaunchEnabled('AI should govern society', true, true)).toBe(true);
  });

  it('returns editable composer before session starts', () => {
    expect(getTwoPersonComposerState(false).mode).toBe('editable');
  });

  it('returns readonly composer after session starts', () => {
    expect(getTwoPersonComposerState(true).mode).toBe('readonly');
  });

  it('builds minimal right rail summary', () => {
    const rail = getTwoPersonRailState({
      currentTurn: 3,
      currentSpeakerName: '正方一辩',
      isRunning: true,
    });

    expect(rail.roundLabel).toContain('3');
    expect(rail.speakerLabel).toContain('正方一辩');
  });

  it('builds compact roster row metadata for pro and con', () => {
    const rows = buildTwoPersonRosterRows([
      { id: 'p1', name: '正方一辩', stance: 'pro', model: 'gpt-4o-mini', hasApiKey: true },
      { id: 'c1', name: '反方一辩', stance: 'con', model: 'gpt-4o-mini', hasApiKey: false },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ sideLabel: '正方', configLabel: '已配置' });
    expect(rows[1]).toMatchObject({ sideLabel: '反方', configLabel: '未配置' });
  });

  it('defines center-stage frame ownership for 2-person mode', () => {
    const frame = getTwoPersonFrameSpec(false);

    expect(frame.modeTogglePlacement).toBe('stage-header');
    expect(frame.composerPlacement).toBe('stage-footer');
    expect(frame.showVerboseRightRail).toBe(false);
  });

  it('defines lightweight idle stage and icon composer action', () => {
    const idle = getTwoPersonIdleSpec();

    expect(idle.showMatchupPreview).toBe(true);
    expect(idle.showLegacyArenaBlock).toBe(false);
    expect(idle.launchActionStyle).toBe('icon-only');
  });
});
