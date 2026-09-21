# 连接器规划

## 目标源系统

- Excel / CSV 模板包
- 用友 U8/BIP（科目余额）
- 金蝶云星空
- SAP FI（标准表/BAPI）
- 通用 REST/SQL

## 插件接口（草案）

```ts
interface Connector {
  id: string;
  name: string;
  pull(ctx: { period: string; entityCode: string }): Promise<RawRow[]>;
}
```

RawRow 经映射后写入 Dataset.facts。
