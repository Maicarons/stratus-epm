# 开发计划 · Stratus EPM

## 0. 总览

| 版本 | 主题 | 状态 |
|------|------|------|
| **v0.1** | 可运行骨架：core 引擎 + API + Web 工作台 + VitePress 文档 | ✅ 本仓库 |
| v0.2 | 附注模板、对账工作流、Excel 导入向导 | 规划 |
| v0.3 | 用友/金蝶连接器、权限 RBAC、PostgreSQL | 规划 |
| v0.4 | 披露管理 / ESG 扩展、多租户 | 规划 |

## 1. v0.1 交付范围（当前）

### 1.1 领域引擎 `@stratus/core`

- [x] 组织树构建与后序 roll-up
- [x] 外币折算（closing / average）
- [x] 合并流水线：映射 → 输入/调整 → 折算 → 抵消 → 汇总
- [x] 内部交易抵消（Trading Partner + net_change）
- [x] 试算平衡校验 helper
- [x] 预算：驱动 × 费率 → 财务预算；版本滚动；预实对比
- [x] 分摊引擎与管理报表 / KPI
- [x] 示例数据集「华衡集团」
- [x] Vitest 单测

### 1.2 API `@stratus/api`

- [x] health / dataset / entities / accounts / facts
- [x] POST consolidation/run
- [x] POST budget/run | variance | roll
- [x] POST allocation/run | report/management | kpis
- [x] POST admin/reset
- [x] seed 脚本与 JSON 存储

### 1.3 Web `@stratus/web`

- [x] 总览看板（资产/权益/主体数/预算）
- [x] 合并结果与抵消明细
- [x] 预算汇总与预实对比
- [x] 组织架构表
- [x] 管理分析（分节报表 + KPI）

### 1.4 文档 `docs`

- [x] VitePress 站点
- [x] 项目方案 / 开发计划 / 架构 / 合并 / 预算 / API / 快速开始 / 示例 / 开源治理

## 2. 里程碑与任务拆解

### M1 奠基（Week 1–2）

| 任务 | 产出 | DoD |
|------|------|-----|
| 仓库骨架 | monorepo + Apache-2.0 + CI | pnpm install 通过 |
| Schema 契约 | 类型包 | core/api 可引用 |
| Demo 数据 | 华衡集团 | seed 可重置 |

### M2 引擎（Week 3–5）

| 任务 | 产出 | DoD |
|------|------|-----|
| 合并流水线 | runConsolidation | 单测覆盖 FX/抵消/roll-up |
| 预算引擎 | runBudget / variance | 驱动推导数值正确 |
| 分摊与报表 | runAllocation / management report | API 可返回 |

### M3 产品面（Week 6–8）

| 任务 | 产出 | DoD |
|------|------|-----|
| REST API | Fastify 路由 | curl 可演示 |
| Web 工作台 | 5 个页面 | 一键「运行合并」 |
| VitePress | 全套指南 | dev:docs 可浏览 |

### M4 硬化（Week 9–10）

| 任务 | 产出 | DoD |
|------|------|-----|
| CI | GitHub Actions | test+build 绿 |
| 快速开始 | README | 新人 10 分钟跑通 |
| v0.2 需求池 | Issues 模板 | 社区可认领 |

## 3. 质量门禁

1. **引擎零 IO**：core 不读写文件/网络，全部输入显式传入。  
2. **测试**：合并主路径、FX 缺失提示、抵消产生、预算推导必测。  
3. **类型**：`@stratus/schema` 为唯一契约源。  
4. **演示数据**：`pnpm seed` 可随时恢复干净状态。  
5. **文档同步**：引擎行为变更必须更新 `docs/guide/*`。

## 4. 人员与节奏（建议）

| 角色 | v0.1 投入 | 职责 |
|------|-----------|------|
| 产品/会计领域 | 0.5 | 场景、金样、验收 |
| 架构/引擎 | 1 | core 设计与实现 |
| 后端 | 0.5 | API/存储 |
| 前端 | 0.5 | 工作台 |
| 文档 | 0.3 | VitePress |

节奏：双周迭代 → 演示日（demo day）→ Issue 复盘。

## 5. v0.2+ 待办（优先级）

**P0**

- 附注模板与主表钩稽
- 多准则转换分录（CAS ↔ IFRS 字段）
- Excel/CSV 导入向导
- 合并范围期中变动（生效日期）

**P1**

- 对账协同工作台（差异确认）
- PostgreSQL + 迁移
- RBAC 与数据权限（组织维）
- 报表导出 Excel

**P2**

- ERP 连接器插件协议
- 审批流
- ESG 指标
- 多租户 SaaS

## 6. 风险登记册

| 风险 | 等级 | 缓解 |
|------|------|------|
| 抵消规则覆盖不全 | 高 | 金样测试 + 规则可配置 |
| 外币路径复杂 | 中 | 文档明确 rateType；缺失可见 |
| 范围膨胀 | 中 | 严格按 DoD；定制进插件 |
| 会计合规误解 | 高 | README 声明非会计意见 |

## 7. Definition of Done（版本）

- [ ] `pnpm test` 通过  
- [ ] `pnpm seed && pnpm dev:api` 可访问 `/api/health`  
- [ ] Web 可展示合并与预算结果  
- [ ] docs 构建成功  
- [ ] CHANGELOG / 版本号更新  
- [ ] LICENSE 保持 Apache-2.0  
