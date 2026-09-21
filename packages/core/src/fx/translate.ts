import type { Currency, FxRate, Period, RateType } from '@stratus/schema';

export function findRate(
  rates: FxRate[],
  base: Currency,
  quote: Currency,
  period: Period,
  rateType: RateType = 'average',
): number | undefined {
  if (base === quote) return 1;
  const direct = rates.find(
    (r) => r.base === base && r.quote === quote && r.period === period && r.rateType === rateType,
  );
  if (direct) return direct.rate;
  const inverse = rates.find(
    (r) => r.base === quote && r.quote === base && r.period === period && r.rateType === rateType,
  );
  if (inverse && inverse.rate !== 0) return 1 / inverse.rate;
  return undefined;
}

export function translate(
  amount: number,
  from: Currency,
  to: Currency,
  rates: FxRate[],
  period: Period,
  rateType: RateType = 'average',
): { amount: number; rate: number; missing: boolean } {
  if (from === to) return { amount, rate: 1, missing: false };
  const rate = findRate(rates, from, to, period, rateType);
  if (rate === undefined) return { amount, rate: 1, missing: true };
  return { amount: round2(amount * rate), rate, missing: false };
}

export function pickRateType(accountIsMonetary: boolean, isBalanceSheetClose: boolean): RateType {
  if (accountIsMonetary && isBalanceSheetClose) return 'closing';
  return 'average';
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
