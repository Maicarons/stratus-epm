# 数据模型

## 关系概览

```text
Architecture 1 ── * Entity (tree)
Entity 1 ── * Fact
Entity 1 ── * JournalEntry
Account 1 ── * Fact
AccountMap: Entity × source → group Account
EliminationRule → sourceAccounts[] → eliminationAccount
BudgetVersion 1 ── * BudgetDriver
BudgetVersion 1 ── * BudgetFormula
```

## Fact 粒度

`entityCode + period + account + dims + scenario + currency + tradingPartner`

这是「万表同源」的基础：合并、预算对比、管理分析共用同一事实层。

## 场景 scenario

| 值 | 含义 |
|----|------|
| actual | 实际数 |
| budget | 预算 |
| forecast | 预测 |
| adjustment | 调整（也可走 Journal） |
| elimination | 抵消结果 |
| translated | 折算后 |
