import { describe, expect, it } from 'vitest';
import { createDemoDataset, runBudget, rollBudgetVersion } from '../index.js';

describe('budget extras', () => {
  const dataset = createDemoDataset();

  it('rolls budget version with growth', () => {
    const newVersion = {
      id: 'bv-test-roll',
      name: 'test roll',
      fiscalYear: '2025',
      status: 'draft' as const,
      basedOnVersionId: 'bv-2025',
    };
    const rolled = rollBudgetVersion(dataset, 'bv-2025', newVersion, 0.1);
    expect(rolled.drivers.every((d) => d.versionId === 'bv-test-roll')).toBe(true);
    const base = dataset.budgetDrivers.find((d) => d.id === 'd1')!;
    const grown = rolled.drivers.find((d) => d.id.startsWith('d1_'))!;
    expect(grown.value).toBeCloseTo(base.value * 1.1, 5);
  });

  it('budget totals include MFG revenue', () => {
    const result = runBudget(dataset, 'bv-2025');
    expect(result.totalsByAccount['6001']).toBeGreaterThan(0);
  });
});
