// Константы для работы с TON
export const NANOTONS_PER_TON = 1000000000n; // 1 TON = 1,000,000,000 nanotons

// Лимиты ставок (в nanotons)
export const MIN_BET_NANOTONS = BigInt(process.env.MIN_BET_NANOTONS || '100000000'); // 0.1 TON
export const MAX_BET_NANOTONS = BigInt(process.env.MAX_BET_NANOTONS || '100000000000'); // 100 TON

// Комиссии (в basis points)
export const FEE_IN_BPS = parseInt(process.env.FEE_IN_BPS || '50'); // 0.5%
export const FEE_OUT_BPS = parseInt(process.env.FEE_OUT_BPS || '150'); // 1.5%
export const REFUND_FEE_BPS = parseInt(process.env.REFUND_FEE_BPS || '50'); // 0.5%

// Лимиты на манипуляции
export const MAX_BET_PERCENT = parseInt(process.env.MAX_BET_PERCENT || '20'); // 20% от пула
export const MAX_PROBABILITY_CHANGE = parseInt(process.env.MAX_PROBABILITY_CHANGE || '10'); // 10%

// Функции для конвертации
export function tonToNanotons(ton: number): bigint {
  return BigInt(Math.floor(ton * Number(NANOTONS_PER_TON)));
}

export function nanotonsToTon(nanotons: bigint | string): number {
  const value = typeof nanotons === 'string' ? BigInt(nanotons) : nanotons;
  return Number(value) / Number(NANOTONS_PER_TON);
}

export function formatTon(nanotons: bigint | string): string {
  return nanotonsToTon(nanotons).toFixed(2);
}

