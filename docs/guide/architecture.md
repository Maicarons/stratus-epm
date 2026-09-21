# 架构说明

## 分层

```text
┌─────────────────────────────────────────┐
│  apps/web     React 工作台（展示/交互）      │
│  docs         VitePress（知识）            │
├─────────────────────────────────────────┤
│  apps/api     Fastify（用例编排/持久化）     │
├─────────────────────────────────────────┤
│  packages/core   领域引擎（纯函数）          │
│  packages/schema 类型契约                  │
└─────────────────────────────────────────┘
```

## 数据流

```text
Seed/Excel → Dataset(JSON/PG)
                ↓
        runConsolidation / runBudget / runAllocation
                ↓
        Snapshot / BudgetResult / ManagementReport
                ↓
              API JSON → Web
```

## 核心实体

| 实体 | 作用 |
|------|------|
| Entity | 法人/合并单元，挂架构树与持股 |
| Architecture | 法定/管理架构 + 集团币 |
| Account / AccountMap | 集团科目与主体映射 |
| Fact | 期间×科目×维度×币种 金额 |
| JournalEntry | 调整分录 |
| FxRate | 汇率 |
| EliminationRule | 抵消规则 |
| BudgetDriver/Formula/Version | 预算模型 |

## 为何引擎独立成包

- 可在 Node / 浏览器 / 测试中直接调用  
- 便于未来 CLI：`stratus consolidate --period 2025-01`  
- 存储可替换（JSON → SQLite → PostgreSQL）而不改计算逻辑  

## 扩展点

1. **连接器**：向 Dataset 灌入 Facts 的适配器（ERP/Excel）  
2. **抵消规则库**：行业模板  
3. **KPI 库**：管理指标包  
4. **认证**：在 API 层接入 OIDC  

## 部署形态

| 形态 | 说明 |
|------|------|
| 本地 Demo | JSON 文件 + 单进程 API |
| 私有化 | Docker + PG + 内网 SSO |
| 云 | 多租户 + 对象存储 + 托管 PG |
