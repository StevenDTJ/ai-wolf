import { Stance } from '@/types';

export type TwoPersonComposerMode = 'editable' | 'readonly';

export interface TwoPersonComposerState {
  mode: TwoPersonComposerMode;
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
}

export interface TwoPersonIdleSpec {
  showMatchupPreview: boolean;
  showLegacyArenaBlock: boolean;
  launchActionStyle: 'icon-only';
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

export function getTwoPersonRailState(input: TwoPersonRailInput): TwoPersonRailState {
  return {
    roundLabel: `当前回合 ${Math.max(1, input.currentTurn)}`,
    speakerLabel: `当前发言 ${input.currentSpeakerName || '待开始'}`,
    statusLabel: input.isRunning ? '进行中' : '未开始',
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
  };
}

export function getTwoPersonIdleSpec(): TwoPersonIdleSpec {
  return {
    showMatchupPreview: true,
    showLegacyArenaBlock: false,
    launchActionStyle: 'icon-only',
  };
}
