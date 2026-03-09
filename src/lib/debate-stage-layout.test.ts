import { describe, expect, it } from 'vitest';
import {
  buildTwoPersonRosterRows,
  getTwoPersonComposerState,
  getTwoPersonFooterActionState,
  getTwoPersonFrameSpec,
  getTwoPersonIdleSpec,
  getTwoPersonRailState,
  getTwoPersonTurnsLeftLabel,
  isTwoPersonLaunchEnabled,
  validateTwoPersonTurnLimit,
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

  it('defines footer action states for start pause and resume', () => {
    expect(
      getTwoPersonFooterActionState({
        hasSessionStarted: false,
        isRunning: false,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'start', disabled: false, tone: 'blue' });

    expect(
      getTwoPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: true,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'pause', disabled: false, tone: 'red' });

    expect(
      getTwoPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: true,
        canLaunch: true,
        isBusy: true,
      })
    ).toEqual({ mode: 'pause', disabled: false, tone: 'red' });

    expect(
      getTwoPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: false,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'resume', disabled: false, tone: 'blue' });

    expect(
      getTwoPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: false,
        canLaunch: true,
        isBusy: true,
      })
    ).toEqual({ mode: 'resume', disabled: false, tone: 'blue' });
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
    expect(frame.showGlobalModeStrip).toBe(false);
    expect(frame.eightPersonEntryState).toBe('disabled');
    expect(frame.stageTitle).toBe('辩论现场');
    expect(frame.resetPlacement).toBe('stage-header');
    expect(frame.turnCounterTone).toBe('highlight');
    expect(frame.shellStyle).toBe('dark-topbar-floating');
  });

  it('defines lightweight idle stage and icon composer action', () => {
    const idle = getTwoPersonIdleSpec();

    expect(idle.showMatchupPreview).toBe(true);
    expect(idle.showLegacyArenaBlock).toBe(false);
    expect(idle.launchActionStyle).toBe('icon-only');
    expect(idle.matchupPlacement).toBe('lower-stage');
    expect(idle.largeSideRailCtas).toBe(false);
    expect(idle.sendButtonTone).toBe('subtle');
  });

  it('keeps the 2-person rail on the minimum control set', () => {
    const rail = getTwoPersonRailState({
      currentTurn: 1,
      currentSpeakerName: '待开始',
      isRunning: false,
    });

    expect(rail.controlSet).toEqual(['pause-resume']);
    expect(rail.showStopAction).toBe(false);
  });

  it('computes remaining turns for the stage header badge', () => {
    expect(getTwoPersonTurnsLeftLabel({})).toBe('剩余 20 回合');
    expect(getTwoPersonTurnsLeftLabel({ proTurns: 3, conTurns: 2, maxTurnsTotal: 20 })).toBe('剩余 15 回合');
    expect(getTwoPersonTurnsLeftLabel({ proTurns: 10, conTurns: 10, maxTurnsTotal: 20 })).toBe('剩余 0 回合');
  });

  it('validates editable turn-limit input before debate start', () => {
    expect(validateTwoPersonTurnLimit('2')).toEqual({
      isValid: true,
      normalizedValue: 2,
    });

    expect(validateTwoPersonTurnLimit('20')).toEqual({
      isValid: true,
      normalizedValue: 20,
    });

    expect(validateTwoPersonTurnLimit('1')).toEqual({
      isValid: false,
      errorMessage: '回合数最低不能小于 2。',
    });

    expect(validateTwoPersonTurnLimit('21')).toEqual({
      isValid: false,
      errorMessage: '回合数最高不能超过 20。',
    });
  });
});
