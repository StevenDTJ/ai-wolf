export const DEBATE_COLORS = {
  utilityBlue: '#6fc2ff',
  pro: '#53dbc9',
  con: '#ff7169',
  judge: '#ff9538',
  paper: '#f4efea',
  panel: '#fbf7f2',
  ink: '#3e3d3c',
  muted: '#5f5b57',
  border: '#454341',
} as const;

export function getUtilityAccentColor() {
  return DEBATE_COLORS.utilityBlue;
}

export function getPanelIconStyles() {
  return {
    tileBackground: DEBATE_COLORS.panel,
    iconColor: DEBATE_COLORS.ink,
  };
}

export function getJudgeCardStatus(isConfigured: boolean) {
  return {
    labelBackground: DEBATE_COLORS.ink,
    labelText: DEBATE_COLORS.paper,
    statusBackground: isConfigured ? DEBATE_COLORS.judge : DEBATE_COLORS.panel,
    statusText: DEBATE_COLORS.ink,
    statusLabel: isConfigured ? 'OK' : '待配置',
  };
}

export function getStanceAccentColor(stance: 'pro' | 'con' | 'judge') {
  switch (stance) {
    case 'pro':
      return DEBATE_COLORS.pro;
    case 'con':
      return DEBATE_COLORS.con;
    case 'judge':
      return DEBATE_COLORS.judge;
  }
}
