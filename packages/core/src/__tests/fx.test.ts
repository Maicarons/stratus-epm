import { describe, expect, it } from 'vitest';
import { translate, findRate, round2 } from '../fx/translate.js';

const rates = [
  { base: 'HKD', quote: 'CNY', rateType: 'average' as const, period: '2025-01', rate: 0.92 },
];

describe('fx translate', () => {
  it('identity currency', () => {
    const r = translate(100, 'CNY', 'CNY', rates, '2025-01');
    expect(r.amount).toBe(100);
    expect(r.missing).toBe(false);
  });

  it('direct rate', () => {
    const r = translate(1000, 'HKD', 'CNY', rates, '2025-01', 'average');
    expect(r.amount).toBe(920);
  });

  it('missing rate flagged', () => {
    const r = translate(1000, 'USD', 'CNY', rates, '2025-01');
    expect(r.missing).toBe(true);
  });

  it('findRate inverse', () => {
    const rate = findRate(rates, 'CNY', 'HKD', '2025-01', 'average');
    expect(rate).toBeCloseTo(1 / 0.92, 5);
  });

  it('round2', () => {
    expect(round2(1.005)).toBe(1.01);
  });
});
