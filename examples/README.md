# 示例说明

`examples/` 提供业务场景叙述；可运行数据与引擎逻辑在 `packages/core`。

## demo-group-huaheng

见文档 [示例场景](../docs/guide/demo-scenario.md) 与 `packages/core/src/sample/demo.ts`。

场景覆盖：

- 多币种（HKD→CNY）
- 多持股（80% 销售公司）
- 内部往来 / 内部收入抵消
- 审计调整分录
- 业务驱动预算

## 如何新增示例

1. 在 `packages/core/src/sample/` 增加 `createXxxDataset()`  
2. 在 `apps/api/src/seed.ts` 或测试中引用  
3. 补充文档与断言  
