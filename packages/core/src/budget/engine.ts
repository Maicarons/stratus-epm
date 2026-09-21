import type { AccountCode, BudgetDriver, BudgetFormula, BudgetVersion, Dataset, DimMap, Period } from '@stratus/schema';
import { round2 } from '../fx/translate.js';

export interface BudgetLine {
  entityCode: string;
  period: Period;
  account: AccountCode;
  dims: DimMap;
  amount: number;
  versionId: string;
  formulaId?: string;
  driverKey?: string;
  driverValue?: number;
  rate?: number;
}

export interface BudgetResult {
  versionId: string;
  lines: BudgetLine[];
  totalsByAccount: Record<AccountCode, number>;
  totalsByPeriod: Record<Period, number>;
}

/** Derive budget financial lines from business drivers × rates. */
export function runBudget(dataset: Dataset, versionId: string): BudgetResult {
  const version = dataset.budgetVersions.find((v) => v.id === versionId);
  if (!version) throw new Error(`Budget version not found: ${versionId}`);

  const drivers = dataset.budgetDrivers.filter((d) => d.versionId === versionId);
  const formulas = dataset.budgetFormulas.filter((f) => f.versionId === versionId);
  const lines: BudgetLine[] = [];

  for (const formula of formulas) {
    const matched = drivers.filter(
      (d) =>
        d.entityCode === formula.entityCode &&
        d.key === formula.driverKey &&
        dimsMatch(d.dims, formula.dims ?? {}),
    );
    for (const d of matched) {
      const amount = round2(d.value * formula.rate);
      lines.push({
        entityCode: formula.entityCode,
        period: d.period,
        account: formula.targetAccount,
        dims: { ...d.dims, ...formula.dims },
        amount,
        versionId,
        formulaId: formula.id,
        driverKey: formula.driverKey,
        driverValue: d.value,
        rate: formula.rate,
      });
    }
  }

  const totalsByAccount: Record<string, number> = {};
  const totalsByPeriod: Record<string, number> = {};
  for (const line of lines) {
    totalsByAccount[line.account] = round2((totalsByAccount[line.account] ?? 0) + line.amount);
    totalsByPeriod[line.period] = round2((totalsByPeriod[line.period] ?? 0) + line.amount);
  }

  return { versionId, lines, totalsByAccount, totalsByPeriod };
}

function dimsMatch(dims: DimMap, filter: DimMap): boolean {
  return Object.entries(filter).every(([k, v]) => dims[k] === v);
}

/** Roll forward a budget version (e.g. copy with growth). */
export function rollBudgetVersion(
  dataset: Dataset,
  baseVersionId: string,
  newVersion: BudgetVersion,
  growthRate = 0,
): { version: BudgetVersion; drivers: BudgetDriver[]; formulas: BudgetFormula[] } {
  const baseDrivers = dataset.budgetDrivers
    .filter((d) => d.versionId === baseVersionId)
    .map((d) => ({
      ...d,
      versionId: newVersion.id,
      id: `${d.id}_${newVersion.id}`,
      value: round2(d.value * (1 + growthRate)),
    }));
  const baseFormulas = dataset.budgetFormulas
    .filter((f) => f.versionId === baseVersionId)
    .map((f) => ({
      ...f,
      versionId: newVersion.id,
      id: `${f.id}_${newVersion.id}`,
    }));
  return { version: newVersion, drivers: baseDrivers, formulas: baseFormulas };
}

export interface VarianceLine {
  account: AccountCode;
  entityCode: string;
  budget: number;
  actual: number;
  variance: number;
  variancePct: number | null;
}

/** Compare budget vs actual facts for a period. */
export function budgetVsActual(
  budget: BudgetResult,
  dataset: Dataset,
  period: Period,
): VarianceLine[] {
  const actual = new Map<string, number>();
  for (const f of dataset.facts) {
    if (f.period !== period || f.scenario !== 'actual') continue;
    const k = `${f.entityCode}|${f.account}`;
    actual.set(k, round2((actual.get(k) ?? 0) + f.amount));
  }

  const budgetMap = new Map<string, number>();
  for (const line of budget.lines) {
    if (line.period !== period) continue;
    const k = `${line.entityCode}|${line.account}`;
    budgetMap.set(k, round2((budgetMap.get(k) ?? 0) + line.amount));
  }

  const keys = new Set([...actual.keys(), ...budgetMap.keys()]);
  const out: VarianceLine[] = [];
  for (const k of keys) {
    const [entityCode, account] = k.split('|');
    const b = budgetMap.get(k) ?? 0;
    const a = actual.get(k) ?? 0;
    const variance = round2(a - b);
    out.push({
      entityCode,
      account,
      budget: b,
      actual: a,
      variance,
      variancePct: b !== 0 ? round2((variance / Math.abs(b)) * 100) : null,
    });
  }
  out.sort((x, y) => x.account.localeCompare(y.account) || x.entityCode.localeCompare(y.entityCode));
  return out;
}
