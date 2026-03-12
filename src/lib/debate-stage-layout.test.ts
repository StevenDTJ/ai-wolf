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
import {
  buildEightPersonRosterRows,
  createDefaultEightPersonRoster,
  EIGHT_PERSON_PHASES,
  getEightPersonComposerState,
  getEightPersonFooterActionState,
  getEightPersonFrameSpec,
  getEightPersonIdleSpec,
  getEightPersonPhaseIndex,
  getEightPersonPhaseLabel,
  getEightPersonPhaseProgress,
  getEightPersonRailState,
  getEightPersonTotalSteps,
  isEightPersonLaunchEnabled,
} from './debate-8p-layout';

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

describe('8-person debate stage layout helpers', () => {
  it('defines 5 phases for 8-person mode', () => {
    expect(EIGHT_PERSON_PHASES).toHaveLength(5);
    expect(EIGHT_PERSON_PHASES.map((p) => p.label)).toEqual(['开篇', '攻辩', '自由', '观众', '总结']);
  });

  it('computes total steps across all phases', () => {
    expect(getEightPersonTotalSteps()).toBe(16);
  });

  it('returns correct phase index and label', () => {
    expect(getEightPersonPhaseIndex('opening')).toBe(0);
    expect(getEightPersonPhaseIndex('attack')).toBe(1);
    expect(getEightPersonPhaseIndex('free')).toBe(2);
    expect(getEightPersonPhaseIndex('audience')).toBe(3);
    expect(getEightPersonPhaseIndex('summary')).toBe(4);

    expect(getEightPersonPhaseLabel('opening')).toBe('开篇');
    expect(getEightPersonPhaseLabel('attack')).toBe('攻辩');
  });

  it('enables launch only when topic and full 4v4 roster are configured', () => {
    expect(isEightPersonLaunchEnabled('', 0, 0)).toBe(false);
    expect(isEightPersonLaunchEnabled('AI topic', 1, 0)).toBe(false);
    expect(isEightPersonLaunchEnabled('AI topic', 0, 1)).toBe(false);
    expect(isEightPersonLaunchEnabled('AI topic', 1, 1)).toBe(false);
    expect(isEightPersonLaunchEnabled('AI topic', 4, 3)).toBe(false);
    expect(isEightPersonLaunchEnabled('AI topic', 4, 4)).toBe(true);
  });

  it('returns editable composer before session starts', () => {
    expect(getEightPersonComposerState(false).mode).toBe('editable');
  });

  it('returns readonly composer after session starts', () => {
    expect(getEightPersonComposerState(true).mode).toBe('readonly');
  });

  it('defines footer action states for start pause and resume', () => {
    expect(
      getEightPersonFooterActionState({
        hasSessionStarted: false,
        isRunning: false,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'start', disabled: false, tone: 'blue' });

    expect(
      getEightPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: true,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'pause', disabled: false, tone: 'red' });

    expect(
      getEightPersonFooterActionState({
        hasSessionStarted: true,
        isRunning: false,
        canLaunch: true,
        isBusy: false,
      })
    ).toEqual({ mode: 'resume', disabled: false, tone: 'blue' });
  });

  it('builds 8-person rail state with phase and speaker', () => {
    const rail = getEightPersonRailState('attack', '正方二辩', 'pro', true);

    expect(rail.currentPhase).toBe('attack');
    expect(rail.currentPhaseLabel).toBe('攻辩');
    expect(rail.currentSpeaker).toBe('正方二辩');
    expect(rail.speakerTeam).toBe('正方');
    expect(rail.statusLabel).toBe('进行中');
    expect(rail.controlSet).toContain('pause-resume');
    expect(rail.controlSet).toContain('reset');
  });

  it('creates default 8-person roster with 4 pro and 4 con', () => {
    const roster = createDefaultEightPersonRoster();

    expect(roster).toHaveLength(8);
    expect(roster.filter((r) => r.stance === 'pro')).toHaveLength(4);
    expect(roster.filter((r) => r.stance === 'con')).toHaveLength(4);
    expect(roster[0].name).toBe('正方一辩');
    expect(roster[4].name).toBe('反方一辩');
  });

  it('builds roster rows sorted by stance then position', () => {
    const rows = buildEightPersonRosterRows([
      { id: 'c2', name: '反方二辩', stance: 'con', model: 'gpt-4o', hasApiKey: true, position: 2 },
      { id: 'p1', name: '正方一辩', stance: 'pro', model: 'gpt-4o', hasApiKey: true, position: 1 },
      { id: 'c1', name: '反方一辩', stance: 'con', model: 'gpt-4o', hasApiKey: false, position: 1 },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0].id).toBe('p1');
    expect(rows[1].id).toBe('c1');
    expect(rows[2].id).toBe('c2');
  });

  it('defines center-stage frame ownership for 8-person mode', () => {
    const frame = getEightPersonFrameSpec();

    expect(frame.modeTogglePlacement).toBe('stage-header');
    expect(frame.composerPlacement).toBe('stage-footer');
    expect(frame.eightPersonEntryState).toBe('enabled');
    expect(frame.stageTitle).toBe('辩论现场');
    expect(frame.showStageTrack).toBe(true);
    expect(frame.leftRailWidth).toBe('narrow');
    expect(frame.rightRailWidth).toBe('narrow');
  });

  it('defines lightweight idle stage with team preview', () => {
    const idle = getEightPersonIdleSpec();

    expect(idle.showMatchupPreview).toBe(false);
    expect(idle.showTeamPreview).toBe(true);
    expect(idle.launchActionStyle).toBe('icon-only');
  });

  it('computes phase progress correctly', () => {
    const progress = getEightPersonPhaseProgress('free');

    expect(progress.completed).toEqual(['opening', 'attack']);
    expect(progress.current).toBe('free');
    expect(progress.upcoming).toEqual(['audience', 'summary']);
  });
});
