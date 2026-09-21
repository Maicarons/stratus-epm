# 合并引擎

## 流水线

```text
1. 圈定合并范围（root 子树）
2. 事实/调整分录 → 集团科目映射
3. 外币折算：资产/负债/权益 closing，损益 average
4. 内部交易识别：Trading Partner 成对科目
5. 抵消：net_change，金额取两侧绝对值较小者
6. 按组织树后序 roll-up（全额=1，比例法=ownershipPct）
7. 输出 Snapshot：totalsByAccount + lines + meta
```

## 关键 API

```ts
import { runConsolidation } from '@stratus/core';

const snap = runConsolidation({
  dataset,
  architectureId: 'arch-legal',
  rootEntityCode: 'HH',
  period: '2025-01',
});
```

## 抵消规则示例

```ts
{
  id: 'el-ic-ar',
  name: '内部往来抵消',
  sourceAccounts: ['1122', '2241', '2202'],
  method: 'net_change',
  eliminationAccount: '6901',
  entryType: 'intercompany_bv',
  active: true,
}
```

匹配逻辑：主体 A 对 B 的科目余额 与 B 对 A 的科目余额配对，向零方向抵消。

## 汇率

| rateType | 典型用途 |
|----------|----------|
| closing | 货币性资产/负债、权益折算 |
| average | 收入/费用等损益 |

若汇率缺失，金额按 1:1 进入结果并在 `meta.notes` 提示——生产环境应阻断关账。

## 多架构

同一套事实可挂在不同 `architectureId` 的组织树下，输出法定合并与管理口径合并。

## 测试建议

- 母公司 + 子公司现金加总是否包含折算后外币  
- 内部应收/应付抵消后集团往来是否下降  
- 持股 80% 全额合并 vs 比例法差异  
