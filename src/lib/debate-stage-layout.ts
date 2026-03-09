import { Stance } from '@/types';

export type TwoPersonComposerMode = 'editable' | 'readonly';

export interface TwoPersonComposerState {
  mode: TwoPersonComposerMode;
}

export interface TwoPersonFooterActionInput {
  hasSessionStarted: boolean;
  isRunning: boolean;
  canLaunch: boolean;
  isBusy: boolean;
}

export interface TwoPersonFooterActionState {
  mode: 'start' | 'pause' | 'resume';
  disabled: boolean;
  tone: 'blue' | 'red';
}

export interface TwoPersonRailInput {
  currentTurn: number;
  currentSpeakerName: string;
  isRunning: boolean;
}

export interface TwoPersonRailState {
  roundLabel: string;
  speakerLabel: string;
  statusLabel: string;
  controlSet: Array<'pause-resume'>;
  showStopAction: boolean;
}

export interface TwoPersonTurnsLeftInput {
  proTurns?: number;
  conTurns?: number;
  maxTurnsPerSide?: number;
  maxTurnsTotal?: number;
}

export interface TurnLimitValidationResult {
  isValid: boolean;
  normalizedValue?: number;
  errorMessage?: string;
}

export interface TwoPersonRosterInput {
  id: string;
  name: string;
  stance: Stance;
  model: string;
  hasApiKey: boolean;
}

export interface TwoPersonRosterRow {
  id: string;
  name: string;
  sideLabel: string;
  modelLabel: string;
  configLabel: '已配置' | '未配置';
}

export interface TwoPersonFrameSpec {
  modeTogglePlacement: 'stage-header';
  composerPlacement: 'stage-footer';
  showVerboseRightRail: boolean;
  showGlobalModeStrip: boolean;
  eightPersonEntryState: 'disabled';
  stageTitle: string;
  resetPlacement: 'stage-header';
  turnCounterTone: 'highlight';
  shellStyle: 'dark-topbar-floating';
}

export interface TwoPersonIdleSpec {
  showMatchupPreview: boolean;
  showLegacyArenaBlock: boolean;
  launchActionStyle: 'icon-only';
  matchupPlacement: 'lower-stage';
  largeSideRailCtas: boolean;
  sendButtonTone: 'subtle';
}

export function isTwoPersonLaunchEnabled(
  topic: string,
  hasConfiguredPro: boolean,
  hasConfiguredCon: boolean
): boolean {
  return topic.trim().length > 0 && hasConfiguredPro && hasConfiguredCon;
}

export function getTwoPersonComposerState(hasSessionStarted: boolean): TwoPersonComposerState {
  return {
    mode: hasSessionStarted ? 'readonly' : 'editable',
  };
}

export function getTwoPersonFooterActionState(input: TwoPersonFooterActionInput): TwoPersonFooterActionState {
  if (!input.hasSessionStarted) {
    return {
      mode: 'start',
      disabled: !input.canLaunch || input.isBusy,
      tone: 'blue',
    };
  }

  if (input.isRunning) {
    return {
      mode: 'pause',
      disabled: false,
      tone: 'red',
    };
  }

  return {
    mode: 'resume',
    disabled: false,
    tone: 'blue',
  };
}

export function getTwoPersonRailState(input: TwoPersonRailInput): TwoPersonRailState {
  return {
    roundLabel: `当前回合 ${Math.max(1, input.currentTurn)}`,
    speakerLabel: `当前发言 ${input.currentSpeakerName || '待开始'}`,
    statusLabel: input.isRunning ? '进行中' : '未开始',
    controlSet: ['pause-resume'],
    showStopAction: false,
  };
}

export function getTwoPersonTurnsLeftLabel(input: TwoPersonTurnsLeftInput): string {
  const maxTurnsTotal = input.maxTurnsTotal ?? Math.max(1, input.maxTurnsPerSide ?? 10) * 2;
  const turnsUsed = Math.max(0, input.proTurns ?? 0) + Math.max(0, input.conTurns ?? 0);
  const turnsLeft = Math.max(0, maxTurnsTotal - turnsUsed);

  return `剩余 ${turnsLeft} 回合`;
}

export function validateTwoPersonTurnLimit(rawValue: string): TurnLimitValidationResult {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return {
      isValid: false,
      errorMessage: '回合数不能为空，最低为 2 回合。',
    };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return {
      isValid: false,
      errorMessage: '回合数必须是整数。',
    };
  }

  if (parsed < 2) {
    return {
      isValid: false,
      errorMessage: '回合数最低不能小于 2。',
    };
  }

  if (parsed > 20) {
    return {
      isValid: false,
      errorMessage: '回合数最高不能超过 20。',
    };
  }

  return {
    isValid: true,
    normalizedValue: parsed,
  };
}

export function buildTwoPersonRosterRows(items: TwoPersonRosterInput[]): TwoPersonRosterRow[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sideLabel: item.stance === 'pro' ? '正方' : item.stance === 'con' ? '反方' : '裁判',
    modelLabel: item.model,
    configLabel: item.hasApiKey ? '已配置' : '未配置',
  }));
}

export function getTwoPersonFrameSpec(isRunning: boolean): TwoPersonFrameSpec {
  return {
    modeTogglePlacement: 'stage-header',
    composerPlacement: 'stage-footer',
    showVerboseRightRail: isRunning ? false : false,
    showGlobalModeStrip: false,
    eightPersonEntryState: 'disabled',
    stageTitle: '辩论现场',
    resetPlacement: 'stage-header',
    turnCounterTone: 'highlight',
    shellStyle: 'dark-topbar-floating',
  };
}

export function getTwoPersonIdleSpec(): TwoPersonIdleSpec {
  return {
    showMatchupPreview: true,
    showLegacyArenaBlock: false,
    launchActionStyle: 'icon-only',
    matchupPlacement: 'lower-stage',
    largeSideRailCtas: false,
    sendButtonTone: 'subtle',
  };
}
