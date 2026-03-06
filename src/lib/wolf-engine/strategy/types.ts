export type StrategyTeamConfig = {
  promptSuffix?: string;
  aggressiveness?: number;
};

export type StrategyBundle = {
  id: string;
  parentId?: string;
  createdAt: string;
  wolf: StrategyTeamConfig;
  good: StrategyTeamConfig;
};
