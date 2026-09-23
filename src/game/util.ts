export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const chance = (p: number) => Math.random() < p;
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (n: number) => {
  const abs = Math.abs(Math.round(n));
  const s = abs >= 1_000_000_000 ? `${+(abs / 1_000_000_000).toFixed(2)}B`
    : abs >= 1_000_000 ? `${+(abs / 1_000_000).toFixed(2)}M`
    : abs.toLocaleString('en-US');
  return `${n < 0 ? '-' : ''}$${s}`;
};

export function weightedPick<T extends { weight?: number }>(list: T[]): T | undefined {
  const total = list.reduce((s, e) => s + (e.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const e of list) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return list[list.length - 1];
}
