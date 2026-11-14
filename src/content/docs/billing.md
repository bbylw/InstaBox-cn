# 账单与用量

> 本月花了多少、还剩多少额度，以及这些数字怎么算出来。

```bash
instabox usage           # 数量与限制，然后 Cost、Allowance、Credits
instabox usage --json    # 同样的数据，数值在 cost 下
```

API 用任意带 `machines:read` 或 `images:read` 的 key：

```bash
curl -s -H "X-API-Key: $INSTABOX_API_KEY" \
  https://api.instabox.sh/v1/usage \
  | jq '.cost | {costUSD, creditsUSD, ratedUntil}'
```

`GET /v1/usage` 返回个人工作区的数据；用工作区 key 调用则返回该工作区。MCP 的 `get_usage` 工具返回同样的数字。发票、支付方式与收据在账单门户，用 `instabox workspace billing` 或控制台 **Account** 打开。

## 费用如何计算

服务端每小时为刚结束的那一小时计价一次，为每个资源写一行账本；本月费用是所有行的总和，不会在请求时估算。

- **计算**：vCPU 与内存分别单价，按秒累积。
- **存储**：每台机器分配的磁盘容量；Free 套餐的磁盘包含在内。
- **出站**：工作区机器发往互联网、超出套餐每月额度的部分按 GiB 计费；入站免费。

Free 机器从不计费，所以 Free 月份是 $0.00。每一小时按当时生效的价格计算。月份是 UTC 自然月（`periodStart` 到 `periodEnd`），数字覆盖到 `ratedUntil`，因此最多滞后一小时。

## 用量字段

| 字段 | 含义 |
| --- | --- |
| `costUSD` | 本月已产生的用量费用：`runtimeUSD` + `storageUSD` + `egressUSD` |
| `vcpuUSD`、`memUSD` | 计算费用的两部分，`runtimeUSD` 是它们之和 |
| `vcpuHours`、`memGiBHours`、`storageGiBHours`、`egressGiB` | 计价所依据的数量 |
| `allowanceUSD` | 本月包含的额度：付费套餐即当月订阅费 |
| `creditRemainingUSD`、`overageUSD` | 剩余额度，以及超出部分（月底或达到阈值时收取） |
| `remainingUSD` | 设置了消费上限时，本月还能用到多少 |
| `creditsUSD`、`creditsExpireAt` | 余额与最早过期的信用额度 |
| `creditsUsedUSD` | 本月由信用额度支付的部分 |
| `chargedUSD` | 本月已收取的超出额度部分 |

信用额度优先抵扣套餐费与超出额度的用量，最早过期的先用。

## 其他工作区

`GET /v1/orgs/{id}`（`instabox workspace get <name>`）返回你所属的任意工作区，字段与 `usage` 相同，另含 `limits`，计费开启时还有 `billing`。

## 按机器分账

`Sandbox.getUsage(id)`（`GET /v1/machines/{id}/usage`）返回机器本 UTC 月的运行秒数。配合标签可以按客户汇总：

```bash
instabox create --name worker --meta customer=acme
```

## 消费上限

工作区可以设置消费上限（spend limit），达到后新机器与需要付费的操作会被拒绝，返回 `402 spend_limit_reached`；`remainingUSD` 显示距离上限还有多少。上限可以在控制台的 **Account** / 账单门户调整。信用额度耗尽时会返回 `402 credit_exhausted`。

## 相关

- [定价与用量](./pricing)
- [限制](./limits)
- [错误码](./errors)
