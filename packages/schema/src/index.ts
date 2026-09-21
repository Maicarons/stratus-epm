/** Stratus EPM shared domain types. Apache-2.0 */

export type Currency = string;
export type Period = string; // e.g. "2025-01" or "2025-Q1" or "2025"
export type EntityId = string;
export type AccountCode = string;
export type DimMap = Record<string, string>;

export type ConsolidateMethod = 'full' | 'proportionate' | 'equity' | 'none';
export type ArchitectureKind = 'legal' | 'management';
export type Scenario = 'actual' | 'budget' | 'forecast' | 'adjustment' | 'elimination' | 'translated';
export type RateType = 'closing' | 'average' | 'historical' | 'custom';

export interface Entity {
  id: EntityId;
  code: string;
  name: string;
  parentId: EntityId | null;
  /** 0–1, ownership of this entity by its parent */
  ownershipPct: number;
  consolidateMethod: ConsolidateMethod;
  functionalCurrency: Currency;
  /** consolidation reporting currency path target for this node when acting as consolidator */
  architectureId: string;
  isConsolidationNode: boolean;
  activeFrom: string;
  activeTo?: string | null;
}

export interface Architecture {
  id: string;
  name: string;
  kind: ArchitectureKind;
  groupCurrency: Currency;
}

export interface Account {
  code: AccountCode;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  /** sign when consolidating: 1 natural, -1 for equity-like if needed */
  sign: 1 | -1;
  isMonetary: boolean;
  parentCode?: AccountCode | null;
}

export interface AccountMap {
  id: string;
  entityCode: string;
  sourceAccount: string;
  groupAccount: AccountCode;
  sourceSystem?: string;
}

export interface Fact {
  id: string;
  entityCode: string;
  period: Period;
  account: AccountCode;
  dims: DimMap;
  scenario: Scenario;
  currency: Currency;
  /** amount in transaction / functional currency of the entity */
  amount: number;
  source: string;
  tradingPartner?: string | null;
}

export interface JournalEntry {
  id: string;
  entityCode: string;
  period: Period;
  account: AccountCode;
  dims: DimMap;
  scenario: Scenario;
  currency: Currency;
  amount: number;
  entryType: 'reclass' | 'audit' | 'gaap' | 'elimination' | 'translation' | 'manual';
  memo: string;
  tradingPartner?: string | null;
  createdAt: string;
}

export interface FxRate {
  base: Currency;
  quote: Currency;
  rateType: RateType;
  period: Period;
  rate: number;
}

export type EliminationMethod = 'net_change' | 'fixed';

export interface EliminationRule {
  id: string;
  name: string;
  /** source accounts, * wildcard suffix supported e.g. "1122*" */
  sourceAccounts: string[];
  method: EliminationMethod;
  /** elimination postings go to this group account */
  eliminationAccount: AccountCode;
  /** optional fixed amount when method=fixed */
  fixedAmount?: number;
  entryType: 'intercompany_bv' | 'intercompany_pl' | 'unrealized' | 'equity';
  active: boolean;
}

export interface AllocationRule {
  id: string;
  name: string;
  poolAccount: AccountCode;
  targetAccounts: AccountCode[];
  /** driver key under dims, e.g. headcount / revenue / orderQty */
  driverKey: string;
  basis: 'ratio' | 'equal' | 'custom';
  customWeights?: Record<string, number>;
}

export interface BudgetDriver {
  id: string;
  entityCode: string;
  period: Period;
  versionId: string;
  key: string; // volume, headcount, ...
  dims: DimMap;
  value: number;
}

export interface BudgetFormula {
  id: string;
  name: string;
  /** target account for derived amount */
  targetAccount: AccountCode;
  /** formula: amount = driverKey * rate  OR custom expression keys */
  driverKey: string;
  rate: number;
  dims?: DimMap;
  versionId: string;
  entityCode: string;
}

export interface BudgetVersion {
  id: string;
  name: string;
  fiscalYear: string;
  status: 'draft' | 'submitted' | 'approved' | 'locked';
  basedOnVersionId?: string | null;
}

export interface KpiDefinition {
  id: string;
  name: string;
  /** numerator / denominator account codes or expressions */
  numerator: AccountCode[];
  denominator?: AccountCode[];
  op: 'sum' | 'ratio' | 'growth';
  basePeriodOffset?: number;
}

export interface ConsolidationSnapshotLine {
  entityCode: string;
  account: AccountCode;
  amount: number;
  currency: Currency;
  stage: 'input' | 'adjustment' | 'translated' | 'elimination' | 'consolidated';
  memo?: string;
  tradingPartner?: string | null;
  sourceIds?: string[];
}

export interface ConsolidationSnapshot {
  id: string;
  architectureId: string;
  rootEntityCode: string;
  period: Period;
  groupCurrency: Currency;
  createdAt: string;
  lines: ConsolidationSnapshotLine[];
  totalsByAccount: Record<AccountCode, number>;
  meta: {
    entityCount: number;
    eliminationCount: number;
    notes: string[];
  };
}

export interface Dataset {
  architectures: Architecture[];
  entities: Entity[];
  accounts: Account[];
  accountMaps: AccountMap[];
  facts: Fact[];
  journals: JournalEntry[];
  fxRates: FxRate[];
  eliminationRules: EliminationRule[];
  allocationRules: AllocationRule[];
  budgetVersions: BudgetVersion[];
  budgetDrivers: BudgetDriver[];
  budgetFormulas: BudgetFormula[];
  kpis: KpiDefinition[];
}
