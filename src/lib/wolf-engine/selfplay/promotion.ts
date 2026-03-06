export function canPromote(input: { uplift: number; gatePassed: boolean }): boolean {
  return input.gatePassed && input.uplift >= 0.05;
}
