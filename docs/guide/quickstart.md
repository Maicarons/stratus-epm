# 快速开始

## 环境

- Node.js ≥ 20
- 启用 corepack（推荐）或已安装 pnpm 9

## 安装

```bash
cd stratus-epm
corepack enable
pnpm install
```

## 测试引擎

```bash
pnpm test
```

## 启动 API

```bash
pnpm seed       # 写入示例集团「华衡」数据
pnpm dev:api    # http://127.0.0.1:8787
```

## 启动工作台

```bash
pnpm dev:web    # http://127.0.0.1:5173
```

打开浏览器后点击「运行合并 / 预算」，即可看到：

- 合并资产与负债权益  
- HKD 子公司折算后的现金  
- 内部往来/内部销售抵消明细  
- 预算驱动推导结果与预实差异  

## 文档站

```bash
pnpm dev:docs   # http://127.0.0.1:5174
```

## 重置数据

```bash
pnpm seed
# 或
curl -X POST http://127.0.0.1:8787/api/admin/reset
```

## 常见问题

**Web 提示无法连接 API**  
确认 `pnpm dev:api` 已运行，且通过 vite 代理访问（默认 `/api` → `8787`）。

**合并结果没有抵消**  
检查 Dataset 中 `eliminationRules[].active`，以及事实是否带 `tradingPartner`。
