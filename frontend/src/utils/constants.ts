export const NANOTONS_PER_TON = 1000000000;

export function nanotonsToTon(nanotons: string | number): number {
  const value = typeof nanotons === 'string' ? BigInt(nanotons) : BigInt(nanotons);
  return Number(value) / NANOTONS_PER_TON;
}

export function tonToNanotons(ton: number): string {
  return (BigInt(Math.floor(ton * NANOTONS_PER_TON))).toString();
}

export function formatTon(nanotons: string | number): string {
  return nanotonsToTon(nanotons).toFixed(2);
}

