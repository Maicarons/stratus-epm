# 附注模块规划（v0.2）

## 目标

- 附注模板（会计政策、关联交易、分部信息等）
- 主表科目 → 附注行绑定
- 合并附注与单体附注链路
- 钩稽校验（附注合计 = 主表相关项目）

## 数据草案

```ts
interface NoteTemplate { id: string; title: string; lines: NoteLine[] }
interface NoteLine { code: string; label: string; formula: string }
interface NoteBinding { templateId: string; account: string; noteLine: string }
```
