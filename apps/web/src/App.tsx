import { useCallback, useEffect, useMemo, useState } from 'react';

type Tab = 'dashboard' | 'consolidation' | 'budget' | 'entities' | 'report';

const API = '/api';

interface Snapshot {
  id: string;
  period: string;
  groupCurrency: string;
  rootEntityCode: string;
  totalsByAccount: Record<string, number>;
  meta: { entityCount: number; eliminationCount: number; notes: string[] };
  lines: { stage: string; entityCode: string; account: string; amount: number }[];
}

interface DatasetInfo {
  entities: { code: string; name: string; functionalCurrency: string; consolidateMethod: string; ownershipPct: number }[];
  accounts: { code: string; name: string; type: string }[];
  budgetVersions: { id: string; name: string; status: string }[];
  counts: { facts: number };
}

function fmt(n: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(n);
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [balance, setBalance] = useState<{ assets: number; liabilities: number; equity: number; balanced: boolean } | null>(null);
  const [budget, setBudget] = useState<{ totalsByAccount: Record<string, number>; lines: unknown[] } | null>(null);
  const [variance, setVariance] = useState<{ account: string; entityCode: string; budget: number; actual: number; variance: number }[]>([]);
  const [report, setReport] = useState<{ period: string; sections: { title: string; rows: { label: string; value: number }[] }[]; kpis: { name: string; value: number | null }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('2025-01');

  const loadDataset = useCallback(async () => {
    const res = await fetch(`${API}/dataset`);
    setDataset(await res.json());
  }, []);

  const runAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, bRes, vRes, rRes] = await Promise.all([
        fetch(`${API}/consolidation/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period }),
        }),
        fetch(`${API}/budget/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionId: 'bv-2025' }),
        }),
        fetch(`${API}/budget/variance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionId: 'bv-2025', period }),
        }),
        fetch(`${API}/report/management`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period }),
        }),
      ]);
      const c = await cRes.json();
      setSnap(c.snapshot);
      setBalance(c.balance);
      setBudget(await bRes.json());
      setVariance(await vRes.json());
      setReport(await rRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败，请确认 API 已启动');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDataset().catch(() => setError('无法连接 API，请先运行 pnpm seed && pnpm dev:api'));
    runAll();
  }, [loadDataset, runAll]);

  const accountName = useMemo(() => {
    const map = new Map<string, string>();
    dataset?.accounts.forEach((a) => map.set(a.code, a.name));
    return map;
  }, [dataset]);

  const nav: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: '总览看板' },
    { id: 'consolidation', label: '合并报表' },
    { id: 'budget', label: '全面预算' },
    { id: 'entities', label: '组织架构' },
    { id: 'report', label: '管理分析' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>Stratus EPM</strong>
          <span>层云 · 集团财务管控</span>
        </div>
        <div className="nav">
          {nav.map((n) => (
            <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}>
              {n.label}
            </button>
          ))}
        </div>
      </aside>
      <main className="main">
        <div className="header">
          <div>
            <h1>{nav.find((n) => n.id === tab)?.label}</h1>
            <p>华衡集团（示例） · 期间 {period} · Apache-2.0 开源 EPM</p>
          </div>
          <div className="toolbar">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="btn secondary">
              <option value="2025-01">2025-01</option>
            </select>
            <button className="btn" onClick={runAll} disabled={loading}>
              {loading ? '计算中…' : '运行合并 / 预算'}
            </button>
          </div>
        </div>

        {error && <div className="card span-12 error">{error}</div>}

        {tab === 'dashboard' && (
          <div className="grid">
            <div className="card span-3">
              <h3>合并资产</h3>
              <div className="metric">{balance ? fmt(balance.assets) : '—'}<small>{snap?.groupCurrency ?? 'CNY'}</small></div>
            </div>
            <div className="card span-3">
              <h3>负债 + 权益</h3>
              <div className="metric">{balance ? fmt(balance.liabilities + balance.equity) : '—'}<small>{balance?.balanced ? '试算平衡' : '需检查'}</small></div>
            </div>
            <div className="card span-3">
              <h3>纳入合并主体</h3>
              <div className="metric">{snap?.meta.entityCount ?? '—'}<small>抵消分录 {snap?.meta.eliminationCount ?? 0}</small></div>
            </div>
            <div className="card span-3">
              <h3>预算收入（样例）</h3>
              <div className="metric">{budget ? fmt(budget.totalsByAccount['6001'] ?? 0) : '—'}<small>驱动因子推导</small></div>
            </div>
            <div className="card span-6">
              <h3>科目余额（合并）</h3>
              <table>
                <thead>
                  <tr><th>科目</th><th className="num">金额</th></tr>
                </thead>
                <tbody>
                  {snap &&
                    Object.entries(snap.totalsByAccount)
                      .filter(([, v]) => Math.abs(v) > 0)
                      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                      .slice(0, 8)
                      .map(([code, value]) => (
                        <tr key={code}>
                          <td>{code} {accountName.get(code)}</td>
                          <td className="num">{fmt(value)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <div className="card span-6">
              <h3>合并阶段分布</h3>
              {snap &&
                ['input', 'adjustment', 'elimination', 'consolidated'].map((stage) => {
                  const count = snap.lines.filter((l) => l.stage === stage).length;
                  return (
                    <div className="bar-row" key={stage}>
                      <span>{stage}</span>
                      <div className="bar"><i style={{ width: `${Math.min(100, count * 4)}%` }} /></div>
                      <span className="num">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {tab === 'consolidation' && (
          <div className="grid">
            <div className="card span-12">
              <h3>合并结果快照</h3>
              {snap?.meta.notes?.length ? (
                <p className="muted">提示：{snap.meta.notes.join('；')}</p>
              ) : null}
              <table>
                <thead>
                  <tr>
                    <th>科目</th>
                    <th>名称</th>
                    <th className="num">合并金额</th>
                  </tr>
                </thead>
                <tbody>
                  {snap &&
                    Object.entries(snap.totalsByAccount).map(([code, value]) => (
                      <tr key={code}>
                        <td>{code}</td>
                        <td>{accountName.get(code) ?? code}</td>
                        <td className="num">{fmt(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="card span-12">
              <h3>抵消与调整明细（最近）</h3>
              <table>
                <thead>
                  <tr>
                    <th>阶段</th>
                    <th>主体</th>
                    <th>科目</th>
                    <th className="num">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {snap?.lines
                    .filter((l) => l.stage === 'elimination' || l.stage === 'adjustment')
                    .slice(0, 20)
                    .map((l, i) => (
                      <tr key={i}>
                        <td><span className={`tag ${l.stage === 'elimination' ? 'warn' : ''}`}>{l.stage}</span></td>
                        <td>{l.entityCode}</td>
                        <td>{l.account}</td>
                        <td className="num">{fmt(l.amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'budget' && (
          <div className="grid">
            <div className="card span-4">
              <h3>预算版本</h3>
              {dataset?.budgetVersions.map((v) => (
                <div key={v.id} style={{ marginBottom: 10 }}>
                  <div>{v.name}</div>
                  <span className="tag ok">{v.status}</span> <span className="muted">{v.id}</span>
                </div>
              ))}
            </div>
            <div className="card span-8">
              <h3>预算科目汇总（bv-2025）</h3>
              <table>
                <thead><tr><th>科目</th><th className="num">预算金额</th></tr></thead>
                <tbody>
                  {budget &&
                    Object.entries(budget.totalsByAccount).map(([code, value]) => (
                      <tr key={code}>
                        <td>{code} {accountName.get(code)}</td>
                        <td className="num">{fmt(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="card span-12">
              <h3>预实对比 · {period}</h3>
              <table>
                <thead>
                  <tr>
                    <th>主体</th>
                    <th>科目</th>
                    <th className="num">预算</th>
                    <th className="num">实际</th>
                    <th className="num">差异</th>
                  </tr>
                </thead>
                <tbody>
                  {variance.map((v, i) => (
                    <tr key={i}>
                      <td>{v.entityCode}</td>
                      <td>{v.account} {accountName.get(v.account)}</td>
                      <td className="num">{fmt(v.budget)}</td>
                      <td className="num">{fmt(v.actual)}</td>
                      <td className="num" style={{ color: v.variance < 0 ? 'var(--warn)' : 'var(--accent-2)' }}>{fmt(v.variance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'entities' && (
          <div className="grid">
            <div className="card span-12">
              <h3>合并组织架构</h3>
              <table>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th>本位币</th>
                    <th>合并方法</th>
                    <th className="num">持股</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset?.entities.map((e) => (
                    <tr key={e.code}>
                      <td>{e.code}</td>
                      <td>{e.name}</td>
                      <td>{e.functionalCurrency}</td>
                      <td><span className="tag">{e.consolidateMethod}</span></td>
                      <td className="num">{Math.round(e.ownershipPct * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">示例数据共 {dataset?.counts.facts ?? 0} 条事实分录，含 HKD 子公司以验证外币折算。</p>
            </div>
          </div>
        )}

        {tab === 'report' && (
          <div className="grid">
            <div className="card span-4">
              <h3>KPI</h3>
              {report?.kpis?.map((k) => (
                <div key={k.name} style={{ marginBottom: 14 }}>
                  <div className="muted" style={{ fontSize: 12 }}>{k.name}</div>
                  <div className="metric" style={{ fontSize: 22 }}>{k.value === null ? '—' : fmt(k.value)}</div>
                </div>
              ))}
            </div>
            {report?.sections.map((s) => (
              <div className="card span-4" key={s.title}>
                <h3>{s.title}</h3>
                <table>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.label}>
                        <td>{r.label}</td>
                        <td className="num">{fmt(r.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
