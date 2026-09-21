# POST /api/consolidation/run

请求体：

```json
{
  "architectureId": "arch-legal",
  "rootEntityCode": "HH",
  "period": "2025-01"
}
```

响应：`snapshot` + `balance`（assets/liabilities/equity/balanced）。
