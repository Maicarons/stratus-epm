import type { AccountCode, Dataset, KpiDefinition, Period } from '@stratus/schema';
import { round2 } from '../fx/translate.js';

export interface KpiResult {
  id: string;
  name: string;
  value: number | null;
  formula: string;
  parts: Record<string, number>;
}

export function sumAccounts(totals: Record<AccountCode, number>, codes: AccountCode[]): number {
  return round2(codes.reduce((s, c) => s + (totals[c] ?? 0), 0));
}

export function evaluateKpis(totals: Record<AccountCode, number>, kpis: KpiDefinition[]): KpiResult[] {
  return kpis.map((kpi) => {
    const num = sumAccounts(totals, kpi.numerator);
    if (kpi.op === 'sum') {
      return {
        id: kpi.id,
        name: kpi.name,
        value: num,
        formula: `sum(${kpi.numerator.join('+')})`,
        parts: Object.fromEntries(kpi.numerator.map((c) => [c, totals[c] ?? 0])),
      };
    }
    if (kpi.op === 'ratio') {
      const den = sumAccounts(totals, kpi.denominator ?? []);
      return {
        id: kpi.id,
        name: kpi.name,
        value: den === 0 ? null : round2(num / den),
        formula: `sum(${kpi.numerator.join('+')}) / sum(${(kpi.denominator ?? []).join('+')})`,
        parts: { numerator: num, denominator: den },
      };
    }
    return {
      id: kpi.id,
      name: kpi.name,
      value: num,
      formula: 'growth-placeholder',
      parts: { current: num },
    };
  });
}

/** Build simple management report structure from consolidated totals + KPIs. */
export interface ManagementReport {
  period: Period;
  generatedAt: string;
  sections: { title: string; rows: { label: string; account?: AccountCode; value: number }[] }[];
  kpis: KpiResult[];
}

export function buildManagementReport(
  dataset: Dataset,
  totals: Record<AccountCode, number>,
  period: Period,
): ManagementReport {
  const accountName = (code: AccountCode) => dataset.accounts.find((a) => a.code === code)?.name ?? code;
  const byType = (type: string) =>
    dataset.accounts
      .filter((a) => a.type === type)
      .map((a) => ({ label: accountName(a.code), account: a.code, value: totals[a.code] ?? 0 }));

  return {
    period,
    generatedAt: new Date().toISOString(),
    sections: [
      { title: '资产 Assets', rows: byType('asset') },
      { title: '负债 Liabilities', rows: byType('liability') },
      { title: '权益 Equity', rows: byType('equity') },
      { title: '收入 Revenue', rows: byType('revenue') },
      { title: '费用 Expense', rows: byType('expense') },
    ],
    kpis: evaluateKpis(totals, dataset.kpis),
  };
}
