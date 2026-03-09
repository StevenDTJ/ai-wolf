import { describe, expect, it } from 'vitest';

import {
  DEBATE_COLORS,
  getJudgeCardStatus,
  getPanelIconStyles,
  getUtilityAccentColor,
} from '@/lib/debate-ui';

describe('debate-ui palette', () => {
  it('uses blue for non-stance utility accents', () => {
    expect(getUtilityAccentColor()).toBe(DEBATE_COLORS.utilityBlue);
  });

  it('uses neutral panel icon treatment for board headers', () => {
    expect(getPanelIconStyles()).toEqual({
      tileBackground: DEBATE_COLORS.panel,
      iconColor: DEBATE_COLORS.ink,
    });
  });

  it('renders judge card status with black label and orange ok chip', () => {
    expect(getJudgeCardStatus(true)).toEqual({
      labelBackground: DEBATE_COLORS.ink,
      labelText: DEBATE_COLORS.paper,
      statusBackground: DEBATE_COLORS.judge,
      statusText: DEBATE_COLORS.ink,
      statusLabel: 'OK',
    });
  });
});
