import type {
  AccountCode,
  AccountMap,
  ConsolidationSnapshot,
  ConsolidationSnapshotLine,
  Dataset,
  DimMap,
  EliminationRule,
  Entity,
  Period,
} from '@stratus/schema';
import { round2 } from '../fx/translate.js';
import { buildEntityTree, flattenTree, postOrder } from '../org/tree.js';

export interface ConsolidationInput {
  dataset: Dataset;
  architectureId: string;
  rootEntityCode: string;
  period: Period;
}

function dimsKey(dims: DimMap): string {
  return Object.keys(dims)
    .sort()
    .map((k) => `${k}=${dims[k]}`)
    .join('|');
}

function mapAccount(maps: AccountMap[], entityCode: string, sourceAccount: string): AccountCode {
  const m = maps.find((x) => x.entityCode === entityCode && x.sourceAccount === sourceAccount);
  return m?.groupAccount ?? sourceAccount;
}

function matchAccount(pattern: string, account: AccountCode): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return account.startsWith(pattern.slice(0, -1));
  return pattern === account;
}

function translateAmount(
  amount: number,
  from: string,
  to: string,
  dataset: Dataset,
  period: Period,
  rateType: 'closing' | 'average',
): { amount: number; missing: boolean } {
  if (from === to) return { amount, missing: false };
  const rate = dataset.fxRates.find(
    (r) => r.base === from && r.quote === to && r.period === period && r.rateType === rateType,
  );
  if (!rate) return { amount, missing: true };
  return { amount: round2(amount * rate.rate), missing: false };
}

/**
 * Group consolidation pipeline:
 * map → stage input/adjustments → translate to group ccy → IC elimination → roll-up by ownership
 */
export function runConsolidation(input: ConsolidationInput): ConsolidationSnapshot {
  const { dataset, architectureId, period } = input;
  const arch = dataset.architectures.find((a) => a.id === architectureId);
  if (!arch) throw new Error(`Architecture not found: ${architectureId}`);
  const groupCurrency = arch.groupCurrency;

  const trees = buildEntityTree(dataset.entities, architectureId);
  const flatAll = flattenTree(trees);
  const root = flatAll.find((e) => e.code === input.rootEntityCode);
  if (!root) throw new Error(`Root entity not found: ${input.rootEntityCode}`);

  const byId = new Map(flatAll.map((e) => [e.id, e]));
  const subtreeCodes = new Set<string>();
  const walkCollect = (code: string) => {
    const node = flatAll.find((e) => e.code === code);
    if (!node || subtreeCodes.has(node.code)) return;
    subtreeCodes.add(node.code);
    for (const child of flatAll) {
      if (child.parentId === node.id) walkCollect(child.code);
    }
  };
  walkCollect(root.code);

  const notes: string[] = [];
  const lines: ConsolidationSnapshotLine[] = [];

  // entity|account|tp -> amount in group currency (inputs + adjustments after FX)
  const baseAgg = new Map<string, number>();

  const addAgg = (entityCode: string, account: AccountCode, tp: string | null, amount: number) => {
    const key = `${entityCode}|${account}|${tp ?? ''}`;
    baseAgg.set(key, round2((baseAgg.get(key) ?? 0) + amount));
  };

  for (const f of dataset.facts) {
    if (!subtreeCodes.has(f.entityCode) || f.period !== period || f.scenario !== 'actual') continue;
    const account = mapAccount(dataset.accountMaps, f.entityCode, f.account);
    const entity = flatAll.find((e) => e.code === f.entityCode)!;
    const acc = dataset.accounts.find((a) => a.code === account);
    const isBS = acc ? ['asset', 'liability', 'equity'].includes(acc.type) : false;
    const rateType = isBS ? 'closing' : 'average';
    const { amount, missing } = translateAmount(f.amount, f.currency || entity.functionalCurrency, groupCurrency, dataset, period, rateType);
    if (missing) notes.push(`FX missing ${f.currency || entity.functionalCurrency}->${groupCurrency} (${rateType}) for ${f.entityCode}/${account}`);
    addAgg(f.entityCode, account, f.tradingPartner ?? null, amount);
    lines.push({
      entityCode: f.entityCode,
      account,
      amount,
      currency: groupCurrency,
      stage: 'input',
      tradingPartner: f.tradingPartner ?? null,
      sourceIds: [f.id],
    });
  }

  for (const j of dataset.journals) {
    if (!subtreeCodes.has(j.entityCode) || j.period !== period || j.entryType === 'elimination') continue;
    const account = mapAccount(dataset.accountMaps, j.entityCode, j.account);
    const entity = flatAll.find((e) => e.code === j.entityCode)!;
    const acc = dataset.accounts.find((a) => a.code === account);
    const isBS = acc ? ['asset', 'liability', 'equity'].includes(acc.type) : false;
    const rateType = isBS ? 'closing' : 'average';
    const { amount, missing } = translateAmount(j.amount, j.currency || entity.functionalCurrency, groupCurrency, dataset, period, rateType);
    if (missing) notes.push(`FX missing journal ${j.entityCode}/${account}`);
    addAgg(j.entityCode, account, j.tradingPartner ?? null, amount);
    lines.push({
      entityCode: j.entityCode,
      account,
      amount,
      currency: groupCurrency,
      stage: 'adjustment',
      tradingPartner: j.tradingPartner ?? null,
      memo: j.memo,
      sourceIds: [j.id],
    });
  }

  // Elimination
  const elimAgg = new Map<string, number>(); // entity|account|tp
  let eliminationCount = 0;
  const addElim = (entityCode: string, account: AccountCode, tp: string, amount: number) => {
    if (amount === 0) return;
    const key = `${entityCode}|${account}|${tp}`;
    elimAgg.set(key, round2((elimAgg.get(key) ?? 0) + amount));
    eliminationCount += 1;
    lines.push({
      entityCode,
      account,
      amount,
      currency: groupCurrency,
      stage: 'elimination',
      tradingPartner: tp,
    });
  };

  const rules = dataset.eliminationRules.filter((r) => r.active && r.method === 'net_change');

  for (const rule of rules) {
    // Group amounts by unordered pair + account for matching IC balances
    // Collect all IC-tagged balances matching rule patterns
    const tagged: { entity: string; account: AccountCode; tp: string; amount: number }[] = [];
    for (const [key, amount] of baseAgg) {
      const [entity, account, tp] = key.split('|');
      if (!tp || entity === tp) continue;
      if (!rule.sourceAccounts.some((p) => matchAccount(p, account))) continue;
      if (!subtreeCodes.has(entity)) continue;
      tagged.push({ entity, account, tp, amount });
    }

    // Match A->B with B->A
    const used = new Set<number>();
    for (let i = 0; i < tagged.length; i++) {
      if (used.has(i)) continue;
      const a = tagged[i];
      for (let j = i + 1; j < tagged.length; j++) {
        if (used.has(j)) continue;
        const b = tagged[j];
        if (a.entity === b.tp && a.tp === b.entity) {
          const elimAbs = round2(Math.min(Math.abs(a.amount), Math.abs(b.amount)));
          if (elimAbs === 0) {
            used.add(i);
            used.add(j);
            continue;
          }
          // Eliminate each side toward zero
          const aSign = a.amount > 0 ? -1 : 1;
          const bSign = b.amount > 0 ? -1 : 1;
          addElim(a.entity, a.account, b.entity, aSign * elimAbs);
          addElim(b.entity, b.account, a.entity, bSign * elimAbs);
          // Contra to elimination account to keep visibility (net to zero in group equity-like flow)
          addElim(a.entity, rule.eliminationAccount, b.entity, -aSign * elimAbs);
          addElim(b.entity, rule.eliminationAccount, a.entity, -bSign * elimAbs);
          used.add(i);
          used.add(j);
          break;
        }
      }
    }
  }

  // Combine base + elim per entity/account (ignore TP for roll-up)
  const entityAccount = new Map<string, number>(); // entity|account
  const bump = (entity: string, account: AccountCode, amount: number) => {
    const k = `${entity}|${account}`;
    entityAccount.set(k, round2((entityAccount.get(k) ?? 0) + amount));
  };
  for (const [key, amount] of baseAgg) {
    const [entity, account] = key.split('|');
    bump(entity, account, amount);
  }
  for (const [key, amount] of elimAgg) {
    const [entity, account] = key.split('|');
    bump(entity, account, amount);
  }

  // Roll-up
  const treeRoots = buildEntityTree(dataset.entities, architectureId).filter((n) => n.code === root.code);
  const order = postOrder(treeRoots);
  const nodeTotals = new Map<string, Map<AccountCode, number>>();

  for (const node of order) {
    const own = new Map<AccountCode, number>();
    for (const acc of dataset.accounts) {
      let total = entityAccount.get(`${node.code}|${acc.code}`) ?? 0;
      for (const child of node.children) {
        const childVal = nodeTotals.get(child.code)?.get(acc.code) ?? 0;
        const factor =
          child.consolidateMethod === 'full'
            ? 1
            : child.consolidateMethod === 'proportionate'
              ? child.ownershipPct
              : 0;
        total += childVal * factor;
      }
      own.set(acc.code, round2(total));
    }
    nodeTotals.set(node.code, own);
  }

  const totalsByAccount: Record<AccountCode, number> = {};
  const rootTotals = nodeTotals.get(root.code) ?? new Map();
  for (const acc of dataset.accounts) {
    const v = rootTotals.get(acc.code) ?? 0;
    totalsByAccount[acc.code] = v;
  }

  lines.push({
    entityCode: root.code,
    account: '*CONSOLIDATED*',
    amount: 0,
    currency: groupCurrency,
    stage: 'consolidated',
    memo: 'See totalsByAccount',
  });

  return {
    id: `snap_${architectureId}_${root.code}_${period}_${Date.now()}`,
    architectureId,
    rootEntityCode: root.code,
    period,
    groupCurrency,
    createdAt: new Date().toISOString(),
    lines,
    totalsByAccount,
    meta: {
      entityCount: subtreeCodes.size,
      eliminationCount,
      notes: [...new Set(notes)],
    },
  };
}

export function balanceCheck(
  totals: Record<AccountCode, number>,
  dataset: Dataset,
): { assets: number; liabilities: number; equity: number; balanced: boolean } {
  let assets = 0;
  let liabilities = 0;
  let equity = 0;
  for (const a of dataset.accounts) {
    const v = totals[a.code] ?? 0;
    if (a.type === 'asset') assets += v;
    if (a.type === 'liability') liabilities += v;
    if (a.type === 'equity') equity += v;
  }
  return {
    assets: round2(assets),
    liabilities: round2(liabilities),
    equity: round2(equity),
    balanced: Math.abs(assets - (liabilities + equity)) < 0.05,
  };
}

export function emptyDataset(): Dataset {
  return {
    architectures: [],
    entities: [],
    accounts: [],
    accountMaps: [],
    facts: [],
    journals: [],
    fxRates: [],
    eliminationRules: [],
    allocationRules: [],
    budgetVersions: [],
    budgetDrivers: [],
    budgetFormulas: [],
    kpis: [],
  };
}
