export function calculateRR(entry, stop, target) {
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    return risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 0;
}
export function calculatePnL(entry, exit, contracts, direction) {
    const diff = direction === 'LONG' ? exit - entry : entry - exit;
    return parseFloat((diff * contracts * 20).toFixed(2));
}
