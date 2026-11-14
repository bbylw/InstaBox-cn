# 错误码

> 每个错误的 HTTP 状态、`code` 与处理方式。

所有错误都有 HTTP 状态和 JSON 响应体：

```json
{
  "error": {
    "code": "operation_conflict",
    "message": "…",
    "requestId": "req_…",
    "retryable": true,
    "retryAfterSeconds": 2,
    "operationId": "op_…",
    "docs_url": "…"
  }
}
```

分支判断请用 `code`，不要依赖 `message`。`retryable` 为真表示同一请求稍后可能成功；有 `retryAfterSeconds`（以及 `Retry-After` 响应头）时，先等待对应秒数。

## 400 Bad Request

| code | 含义 |
| --- | --- |
| `bad_request` | JSON 非法、字段缺失或取值越界；405 表示向只读管理路由写入；408 表示文件传输超时；413 表示反馈内容过大 |
| `feature_disabled` | 路由存在但服务端尚未开启 |
| `unknown_field` | 请求体里有不认识的字段 |
| `spec_not_allowed` | 规格不被当前套餐允许（也可能返回 403 或 409） |
| `resize_restart_off` | 该服务端还不支持 `apply: "restart"`，请先关机再改规格 |
| `authorization_pending` | 设备登录：用户还没批准，按 `interval` 继续轮询 |
| `expired_token` | 设备登录：验证码过期，重新登录 |
| `access_denied` | 用户拒绝了登录请求 |
| `invalid_grant` | 登录码未知、已用、过期，或校验值/回调地址不匹配 |
| `invite_invalid` | 邀请码未知、过期、被吊销或用尽 |
| `invalid_guest_user` | `guestUser` 不是合法 Linux 用户名，或使用了保留名 |

## 401 Unauthorized

| code | 含义 |
| --- | --- |
| `unauthenticated` | 刷新 token、票据等非 API key 凭据无效 |
| `missing_key` | 没有提供 key |
| `malformed_key` | 不是 `ibk_` 加 52 个字符，或 `Authorization` 缺少 `Bearer` |
| `invalid_key` | key 不存在 |
| `expired_key` | key 已过期 |
| `revoked_key` | key 已被吊销（旧服务端用 `api_key_revoked`） |

## 402 Payment Required

| code | 含义 |
| --- | --- |
| `credit_exhausted` | 信用额度用尽 |
| `spend_limit_reached` | 达到工作区消费上限 |
| `subscription_required` | 套餐在操作完成前会到期 |

## 403 Forbidden

| code | 含义 |
| --- | --- |
| `missing_scope` | key 缺少路由需要的 scope，`requiredScopes` 列出可接受的 scope |
| `permission_denied` | 该路由只接受登录，API key 不能使用 |

## 404 Not Found

| code | 含义 |
| --- | --- |
| `not_found` | 机器、快照等资源不存在（含已删除），或属于其他工作区 |
| `missing_parent` | 写文件的父目录不存在，先创建或加 `parents=true` |

## 409 Conflict

| code | 含义 |
| --- | --- |
| `operation_conflict` | 机器上已有操作在进行，读取 `retryable` |
| `machine_not_running` | 机器处于暂停/关机状态，文件、进程或桌面操作被拒绝 |
| `machine_cooldown` | 因最大运行时长暂停，仍在冷却中 |
| `max_run_disabled` | `maxRunMinutes` 为 0，机器拒绝唤醒 |
| `restore_unavailable` | 宿主暂时不能原地还原，改用从快照创建新机器 |
| `delete_confirmation_required` | 删除需要确认，API 传 `X-Confirm-Delete` |
| `fork_unavailable` | 无法分叉（暂停中、无宿主或宿主不可用），读取 `retryable` |
| `not_a_file` | 目标路径是目录或不是普通文件 |
| `disk_too_small` | 缩容后装不下数据，消息里给出最小可用容量 |
| `grow_needs_stop` | 需要先关机才能扩容 |

## 413 / 429 / 507

| code | 状态 | 含义 |
| --- | --- | --- |
| `too_large` | 413 | 上传文件超过 5 GiB，拆分或让机器自己下载 |
| `quota_exceeded` | 429 | 超出配额，读取 `retryable` |
| `rate_limited` | 429 | 触发速率限制，可按 `Retry-After` 重试 |
| `no_space` | 507 | 机器磁盘写满，清理或扩容 `/data` |

## 5xx

| code | 含义 |
| --- | --- |
| `internal` | 500 未知错误；502 依赖服务失败；503 所需服务未配置或未就绪 |
| `restore_failed` | 还原失败，改为从快照创建 |
| `host_unavailable` | 宿主或访问后端无响应；已经开始的 `exec` 不要盲目重试 |
| `no_capacity` | 暂时没有容量（macOS 机型常见），稍后重试 |
| `private_ports_unavailable` | 私有端口功能尚未在该发布中启用，稍后重试 |
| `support_unavailable` | 支持服务不可用 |

遇到持续 500 时，把 `requestId` 附在 `instabox feedback` 里反馈。

## 相关

- [API 概览](./api)
- [API Keys](./api-keys)
- [限制](./limits)
