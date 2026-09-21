# API 参考

Base URL：`http://127.0.0.1:8787`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/dataset` | 架构/主体/科目/预算版本摘要 |
| GET | `/api/entities` | 主体列表 |
| GET | `/api/accounts` | 科目列表 |
| GET | `/api/facts?period=&entityCode=` | 事实分录 |
| POST | `/api/consolidation/run` | 运行合并 `{architectureId?, rootEntityCode?, period?}` |
| GET | `/api/budget/versions` | 预算版本 |
| POST | `/api/budget/run` | 运行预算 `{versionId?}` |
| POST | `/api/budget/variance` | 预实对比 `{versionId?, period?}` |
| POST | `/api/budget/roll` | 滚动预算 `{baseVersionId?, name?, growthRate?}` |
| POST | `/api/allocation/run` | 费用分摊 `{entityCode?, period?}` |
| POST | `/api/report/management` | 管理报表 |
| POST | `/api/kpis` | KPI |
| POST | `/api/admin/reset` | 重置示例数据 |

## 示例

```bash
curl -s http://127.0.0.1:8787/api/health

curl -s -X POST http://127.0.0.1:8787/api/consolidation/run \
  -H 'content-type: application/json' \
  -d '{"period":"2025-01"}'
```

响应中的 `snapshot.totalsByAccount` 为集团币合并余额；`meta.eliminationCount` 为抵消相关记账次数。
