import { describe, expect, it } from 'vitest';
import { balanceCheck, createDemoDataset, runConsolidation, runBudget, budgetVsActual, runAllocation, buildManagementReport } from '../index.js';

describe('Stratus consolidation engine', () => {
  const dataset = createDemoDataset();

  it('runs group consolidation for 2025-01', () => {
    const snap = runConsolidation({
      dataset,
      architectureId: 'arch-legal',
      rootEntityCode: 'HH',
      period: '2025-01',
    });
    expect(snap.rootEntityCode).toBe('HH');
    expect(snap.groupCurrency).toBe('CNY');
    expect(snap.meta.entityCount).toBeGreaterThanOrEqual(4);
    expect(Object.keys(snap.totalsByAccount).length).toBeGreaterThan(5);
    // Cash consolidated should be > parent alone due to children
    expect(snap.totalsByAccount['1001']).toBeGreaterThan(12_000_000);
  });

  it('translates HKD subsidiary into CNY', () => {
    const snap = runConsolidation({
      dataset,
      architectureId: 'arch-legal',
      rootEntityCode: 'HH',
      period: '2025-01',
    });
    // 12M + 4.5M + 2.1M + 800k HKD * 0.92 ≈ 19,336,000
    const cash = snap.totalsByAccount['1001'];
    expect(cash).toBeGreaterThan(19_000_000);
    expect(cash).toBeLessThan(19_500_000);
  });

  it('produces elimination lines for intercompany', () => {
    const snap = runConsolidation({
      dataset,
      architectureId: 'arch-legal',
      rootEntityCode: 'HH',
      period: '2025-01',
    });
    expect(snap.meta.eliminationCount).toBeGreaterThan(0);
    expect(snap.lines.some((l) => l.stage === 'elimination')).toBe(true);
  });

  it('balance check runs without throwing', () => {
    const snap = runConsolidation({
      dataset,
      architectureId: 'arch-legal',
      rootEntityCode: 'HH',
      period: '2025-01',
    });
    const check = balanceCheck(snap.totalsByAccount, dataset);
    expect(check.assets).toBeGreaterThan(0);
  });
});

describe('Budget engine', () => {
  const dataset = createDemoDataset();

  it('derives budget from drivers', () => {
    const result = runBudget(dataset, 'bv-2025');
    expect(result.lines.length).toBeGreaterThan(0);
    // MFG volume 10000 * 520 = 5,200,000 for Jan revenue
    expect(result.totalsByAccount['6001']).toBeGreaterThanOrEqual(5_200_000);
  });

  it('compares budget vs actual', () => {
    const budget = runBudget(dataset, 'bv-2025');
    const variance = budgetVsActual(budget, dataset, '2025-01');
    expect(variance.length).toBeGreaterThan(0);
  });
});

describe('Allocation & report', () => {
  const dataset = createDemoDataset();

  it('allocates management expense', () => {
    const lines = runAllocation(dataset, 'HH-MFG', '2025-01');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('builds management report', () => {
    const snap = runConsolidation({
      dataset,
      architectureId: 'arch-legal',
      rootEntityCode: 'HH',
      period: '2025-01',
    });
    const report = buildManagementReport(dataset, snap.totalsByAccount, '2025-01');
    expect(report.sections.length).toBe(5);
  });
});
