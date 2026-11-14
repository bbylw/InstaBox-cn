# Webhooks

> 机器就绪、暂停、关机、失败或被删除时，向你的 HTTPS 端点发送签名 POST。

为工作区注册一个 HTTPS 端点，工作区的机器或快照状态变化时，InstaBox 会发送签名的 JSON 事件。这样就不必轮询 `GET /v1/machines/{id}`。

```bash
instabox webhooks create https://example.com/hook \
  --event sandbox.started --event sandbox.error
instabox webhooks ls
instabox webhooks test wh_...
instabox webhooks deliveries wh_...
```

```bash
curl -X POST https://api.instabox.sh/v1/orgs/$ORG/webhooks \
  -H "Authorization: Bearer $INSTABOX_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/hook","events":["sandbox.started","sandbox.error"]}'
```

- 不传 `--event` 时订阅所有类型。
- `create` 与 `rotate` 只会打印一次签名密钥（`whsec_…`）。
- URL 必须是公网 `https`，不会跟随重定向。
- 控制台的 **Webhooks** 页面提供同样的能力，并有投递日志。

工作区的 owner 或 admin 可以管理端点。`machines:read` 列出与读取投递，`machines:write` 创建、更新、轮换、测试与重试，`machines:delete` 删除。

## 验证签名

请求遵循 [Standard Webhooks](https://www.standardwebhooks.com/)，可以直接用它的库验证。

| 请求头 | 值 |
| --- | --- |
| `webhook-id` | 事件 ID，重试时不变，用于去重 |
| `webhook-timestamp` | Unix 秒，拒绝偏差超过 5 分钟的请求 |
| `webhook-signature` | `v1,` 加上 `<webhook-id>.<webhook-timestamp>.<原始 body>` 的 HMAC-SHA256（base64），密钥是 `whsec_` 之后的部分做 base64 解码 |

```js
import crypto from 'node:crypto';
const key = Buffer.from(secret.slice('whsec_'.length), 'base64');
const want = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();
const ok = header.split(' ').some((s) => {
  const got = Buffer.from(s.startsWith('v1,') ? s.slice(3) : '', 'base64');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
});
```

轮换后的 24 小时内，请求头会包含两个签名，接受任意一个，并用常量时间比较。

## 及时响应

在连接后 **10 秒**内返回 `2xx`：先回复，再处理。

- **顺序**：同一台机器的事件按顺序到达，重试后也如此；不同机器的事件会交错，按 `createdAt` 排序。
- **重试**：非 2xx 或超时会依次在 5 秒、5 分钟、30 分钟、2 小时、5 小时、10 小时、10 小时后重试，仍失败则投递失败；事件发生 3 天后仍未完成的投递也会过期失败。`instabox webhooks retry` 可以再次发送已完成的投递。
- **日志**：投递记录保留 30 天。

端点连续 5 天所有尝试都失败会被禁用，工作区 owner 与 admin 会收到邮件；用 `instabox webhooks update ID --enable` 重新启用。

## 事件类型

| 类型 | 触发时机 |
| --- | --- |
| `sandbox.created` | 机器被接受（`creating`） |
| `sandbox.started` | 进入 `running`，可以 exec 与 SSH（创建、启动、恢复或唤醒后） |
| `sandbox.stopped` | 进入 `stopped` |
| `sandbox.suspended` | 进入 `suspended`（你手动暂停、空闲暂停或套餐限制） |
| `sandbox.error` | 进入 `error` |
| `sandbox.deleted` | 被删除 |
| `snapshot.created` / `snapshot.failed` / `snapshot.deleted` | 快照就绪、上传失败或被删除 |
| `webhook.test` | 仅测试发送 |

## 事件体

```json
{
  "id": "evt_…",
  "type": "sandbox.suspended",
  "createdAt": "…",
  "orgId": "org_…",
  "data": {
    "sandbox": { "id": "m_…", "name": "worker-1", "metadata": {} },
    "previousState": "suspending",
    "state": "suspended",
    "reason": "idle",
    "operationId": "op_…"
  }
}
```

`reason` 说明变化来源，可能的值包括 `user`、`idle`、`archive`、`wake` 与 `system`（服务端观察到崩溃等情况）。

## 相关

- [生命周期](./lifecycle)
- [自动暂停与最大运行时长](./auto-pause)
- [API 概览](./api)
