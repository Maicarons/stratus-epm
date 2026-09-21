import cors from '@fastify/cors';
import Fastify from 'fastify';
import {
  balanceCheck,
  budgetVsActual,
  buildManagementReport,
  evaluateKpis,
  runAllocation,
  runBudget,
  runConsolidation,
  rollBudgetVersion,
} from '@stratus/core';
import type { Dataset } from '@stratus/schema';
import { loadDataset, resetDataset, saveDataset } from './store.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

let dataset: Dataset = loadDataset();

app.get('/api/health', async () => ({ ok: true, name: 'stratus-epm', version: '0.1.0' }));

app.get('/api/dataset', async () => ({
  architectures: dataset.architectures,
  entities: dataset.entities,
  accounts: dataset.accounts,
  budgetVersions: dataset.budgetVersions,
  eliminationRules: dataset.eliminationRules,
  kpis: dataset.kpis,
  counts: {
    facts: dataset.facts.length,
    journals: dataset.journals.length,
    fxRates: dataset.fxRates.length,
  },
}));

app.get('/api/entities', async () => dataset.entities);

app.get('/api/accounts', async () => dataset.accounts);

app.get('/api/facts', async (req) => {
  const q = req.query as { period?: string; entityCode?: string };
  return dataset.facts.filter(
    (f) =>
      (!q.period || f.period === q.period) &&
      (!q.entityCode || f.entityCode === q.entityCode),
  );
});

app.post('/api/consolidation/run', async (req) => {
  const body = req.body as {
    architectureId?: string;
    rootEntityCode?: string;
    period?: string;
  };
  const architectureId = body.architectureId ?? dataset.architectures[0]?.id ?? 'arch-legal';
  const rootEntityCode = body.rootEntityCode ?? 'HH';
  const period = body.period ?? '2025-01';
  const snapshot = runConsolidation({ dataset, architectureId, rootEntityCode, period });
  const balance = balanceCheck(snapshot.totalsByAccount, dataset);
  return { snapshot, balance };
});

app.get('/api/budget/versions', async () => dataset.budgetVersions);

app.post('/api/budget/run', async (req) => {
  const body = req.body as { versionId?: string };
  const versionId = body.versionId ?? dataset.budgetVersions[0]?.id;
  if (!versionId) return { error: 'no budget version' };
  return runBudget(dataset, versionId);
});

app.post('/api/budget/variance', async (req) => {
  const body = req.body as { versionId?: string; period?: string };
  const versionId = body.versionId ?? dataset.budgetVersions[0]?.id;
  const period = body.period ?? '2025-01';
  if (!versionId) return [];
  const budget = runBudget(dataset, versionId);
  return budgetVsActual(budget, dataset, period);
});

app.post('/api/budget/roll', async (req) => {
  const body = req.body as { baseVersionId?: string; name?: string; growthRate?: number };
  const baseVersionId = body.baseVersionId ?? dataset.budgetVersions[0]?.id;
  if (!baseVersionId) return { error: 'missing base version' };
  const newVersion = {
    id: `bv_${Date.now()}`,
    name: body.name ?? `滚动预测 ${new Date().toISOString().slice(0, 10)}`,
    fiscalYear: '2025',
    status: 'draft' as const,
    basedOnVersionId: baseVersionId,
  };
  const rolled = rollBudgetVersion(dataset, baseVersionId, newVersion, body.growthRate ?? 0.05);
  dataset.budgetVersions.push(rolled.version);
  dataset.budgetDrivers.push(...rolled.drivers);
  dataset.budgetFormulas.push(...rolled.formulas);
  saveDataset(dataset);
  return rolled.version;
});

app.post('/api/allocation/run', async (req) => {
  const body = req.body as { entityCode?: string; period?: string };
  return runAllocation(dataset, body.entityCode ?? 'HH-MFG', body.period ?? '2025-01');
});

app.post('/api/report/management', async (req) => {
  const body = req.body as { architectureId?: string; rootEntityCode?: string; period?: string };
  const snap = runConsolidation({
    dataset,
    architectureId: body.architectureId ?? 'arch-legal',
    rootEntityCode: body.rootEntityCode ?? 'HH',
    period: body.period ?? '2025-01',
  });
  return buildManagementReport(dataset, snap.totalsByAccount, body.period ?? '2025-01');
});

app.post('/api/kpis', async (req) => {
  const body = req.body as { architectureId?: string; rootEntityCode?: string; period?: string };
  const snap = runConsolidation({
    dataset,
    architectureId: body.architectureId ?? 'arch-legal',
    rootEntityCode: body.rootEntityCode ?? 'HH',
    period: body.period ?? '2025-01',
  });
  return evaluateKpis(snap.totalsByAccount, dataset.kpis);
});

app.post('/api/admin/reset', async () => {
  dataset = resetDataset();
  return { ok: true, entities: dataset.entities.length };
});

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';

try {
  await app.listen({ port, host });
  app.log.info(`Stratus API http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
