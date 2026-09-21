# 预算引擎

## 模型

```text
BudgetDriver(销量/人数/…) × BudgetFormula.rate
        → BudgetLine(目标科目金额)
        → totalsByAccount / totalsByPeriod
```

## 示例（华衡）

| 主体 | 驱动 | 数量 | 费率 | 目标科目 | 预算额 |
|------|------|------|------|----------|--------|
| HH-MFG | volume | 10000 | 520 | 6001 收入 | 5,200,000 |
| HH-MFG | volume | 10000 | 360 | 6401 成本 | 3,600,000 |
| HH-MFG | headcount | 40 | 8000 | 6602 管理费用 | 320,000 |

## API

```ts
import { runBudget, budgetVsActual, rollBudgetVersion } from '@stratus/core';

const budget = runBudget(dataset, 'bv-2025');
const variance = budgetVsActual(budget, dataset, '2025-01');
const rolled = rollBudgetVersion(dataset, 'bv-2025', newVersion, 0.05);
```

## 设计取舍

- **先公式驱动，后手编**：保证业财一致；手编表单可在应用层叠加  
- **版本显式**：避免滚动预测覆盖年度预算  
- **与合并同 Dataset**：预实对比使用同一套科目映射  

## 路线图

- 自上而下分解 / 自下而上汇总工作流  
- What-if 情景矩阵  
- 预算合并（与合并引擎共享抵消）  
