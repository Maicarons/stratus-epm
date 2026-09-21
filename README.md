# Stratus EPM

**层云财务管控** — 开源集团合并报表 · 全面预算 · 管理分析平台

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Stratus（层云）寓意**层层合并、云上管控**：把集团多组织、多准则、多币种的财务数据，
像云层一样有序堆叠、抵消、汇总，最终沉淀为可审计的合并结果与可行动的管理洞察。

> 本项目为**独立开源实现**，功能对标业界 EPM 能力域，不复制任何商业产品品牌、界面或源码。

## 产品能力

| 模块 | 能力 |
|------|------|
| **合并报表** | 多层股权架构、多架构并行、多币种折算、内部交易抵消、调整分录、合并结果快照与追溯 |
| **全面预算** | 多维模型、业务驱动因子、版本/滚动、预实对比 |
| **管理分析** | 分摊规则、KPI、多维汇总、管理报表输出 |
| **平台** | 组织主数据、权限、审计日志、示例数据、VitePress 文档 |

## 仓库结构

```text
stratus-epm/
├── apps/
│   ├── api/          # REST API（Fastify + SQLite）
│   └── web/          # 财务工作台（React + Vite）
├── packages/
│   ├── core/         # 合并 / 预算 / 分摊 / FX 领域引擎（纯 TS）
│   └── schema/       # 共享类型定义
├── docs/             # VitePress：开发计划、项目方案、架构、API
├── examples/         # 示例场景说明
├── .github/          # CI
└── LICENSE           # Apache-2.0
```

## 快速开始

```bash
# 需要 Node.js >= 20
corepack enable
pnpm install

# 跑领域引擎测试
pnpm test

# 初始化示例集团数据并启动 API
pnpm seed
pnpm dev:api        # http://127.0.0.1:8787

# 另开终端启动工作台
pnpm dev:web        # http://127.0.0.1:5173

# 文档站
pnpm dev:docs       # http://127.0.0.1:5174
```

## 核心概念（30 秒）

```text
Entity(法人/合并单元) + ownership%
    ↓ 映射
集团科目 + 多准则
    ↓ 采集
Fact(期间 × 科目 × 维度 × 币种)
    ↓ 调整 → 折算 → 逐层合并 → 抵消
Consolidated Snapshot（可审计）
```

预算侧：`Driver(销量/人数等) → Formula → Budget Fact → 与 Actual 对比`。

## 开发计划与方案

完整文档见 [`docs/`](./docs/)：

- [产品方案](./docs/guide/project-plan.md)
- [开发计划](./docs/guide/dev-plan.md)
- [架构说明](./docs/guide/architecture.md)
- [合并引擎](./docs/guide/consolidation.md)

## 开源许可

[Apache License 2.0](./LICENSE)

Copyright 2026 Stratus EPM Contributors
