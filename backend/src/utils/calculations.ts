export function calculateRR(entry: number, stop: number, target: number): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  return risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 0;
}

export function calculatePnL(entry: number, exit: number, contracts: number, direction: string): number {
  const diff = direction === 'LONG' ? exit - entry : entry - exit;
  return parseFloat((diff * contracts * 20).toFixed(2));
}