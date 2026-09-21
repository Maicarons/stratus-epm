import type { AccountCode, AllocationRule, Dataset, DimMap, Fact, Period } from '@stratus/schema';
import { round2 } from '../fx/translate.js';

export interface AllocationLine {
  entityCode: string;
  period: Period;
  fromAccount: AccountCode;
  toAccount: AccountCode;
  dims: DimMap;
  amount: number;
  ruleId: string;
  driverKey: string;
  driverValue: number;
  weight: number;
}

/**
 * Allocate pool accounts to targets by driver weights (e.g. headcount, revenue).
 * Input facts are expected in a single scenario (default actual).
 */
export function runAllocation(
  dataset: Dataset,
  entityCode: string,
  period: Period,
  rules: AllocationRule[] = dataset.allocationRules,
  scenario: Fact['scenario'] = 'actual',
): AllocationLine[] {
  const out: AllocationLine[] = [];

  for (const rule of rules) {
    const poolFacts = dataset.facts.filter(
      (f) =>
        f.entityCode === entityCode &&
        f.period === period &&
        f.account === rule.poolAccount &&
        f.scenario === scenario,
    );
    if (!poolFacts.length) continue;

    const poolTotal = round2(poolFacts.reduce((s, f) => s + f.amount, 0));
    if (poolTotal === 0) continue;

    // driver values per target dim member or equal split
    const targetKeys = rule.targetAccounts;
    const weights = new Map<string, number>();

    if (rule.basis === 'equal') {
      const w = 1 / targetKeys.length;
      targetKeys.forEach((t) => weights.set(t, w));
    } else if (rule.basis === 'custom' && rule.customWeights) {
      const sum = Object.values(rule.customWeights).reduce((s, v) => s + v, 0) || 1;
      for (const t of targetKeys) {
        weights.set(t, (rule.customWeights[t] ?? 0) / sum);
      }
    } else {
      // ratio by driver facts on target account / dims
      const driverFacts = dataset.facts.filter(
        (f) =>
          f.entityCode === entityCode &&
          f.period === period &&
          f.scenario === scenario &&
          (f.account === rule.driverKey || f.dims.driver === rule.driverKey || targetKeys.includes(f.account)),
      );
      // Prefer dedicated driver account named rule.driverKey
      const byTarget = new Map<string, number>();
      const explicitDriver = dataset.facts.filter(
        (f) => f.entityCode === entityCode && f.period === period && f.account === rule.driverKey,
      );
      if (explicitDriver.length) {
        for (const t of targetKeys) {
          const dimDriver = explicitDriver.find((f) => f.dims.target === t || f.dims.department === t);
          byTarget.set(t, dimDriver?.amount ?? 0);
        }
      } else {
        for (const t of targetKeys) {
          const related = driverFacts.filter((f) => f.account === t);
          byTarget.set(t, related.reduce((s, f) => s + Math.abs(f.amount), 0));
        }
      }
      const sum = [...byTarget.values()].reduce((s, v) => s + v, 0);
      for (const t of targetKeys) {
        weights.set(t, sum === 0 ? 1 / targetKeys.length : (byTarget.get(t) ?? 0) / sum);
      }
    }

    for (const poolFact of poolFacts) {
      for (const target of targetKeys) {
        const weight = weights.get(target) ?? 0;
        const amount = round2(poolFact.amount * weight);
        if (amount === 0) continue;
        out.push({
          entityCode,
          period,
          fromAccount: rule.poolAccount,
          toAccount: target,
          dims: { ...poolFact.dims, allocatedFrom: rule.poolAccount },
          amount,
          ruleId: rule.id,
          driverKey: rule.driverKey,
          driverValue: weight,
          weight,
        });
      }
    }
  }

  return out;
}

export function allocationTotalsByTarget(lines: AllocationLine[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lines) {
    out[l.toAccount] = round2((out[l.toAccount] ?? 0) + l.amount);
  }
  return out;
}
