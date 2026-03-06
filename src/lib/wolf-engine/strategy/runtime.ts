export function getProductionStrategyId(): string {
  return process.env.WOLF_STRATEGY_ID || 'strategy-baseline-v1';
}
