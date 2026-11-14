# API 概览

> 基础地址、鉴权、operation、幂等和错误——每个接口共享的部分。

## 基础地址

```text
https://api.instabox.sh
```

所有接口都以 `/v1` 开头，例如 `POST /v1/machines`。响应是 JSON，错误也一样。

> 完整的 OpenAPI 规格在 `https://instabox.sh/docs/api-reference/openapi.yaml`，可以用它生成客户端或查看每个字段。

## 鉴权

程序、CI 和 Agent 使用 API key（`ibk_...`）：

```bash
curl https://api.instabox.sh/v1/machines \
  -H "X-API-Key: $INSTABOX_API_KEY"
```

也可以写成 `Authorization: Bearer ibk_...`。已登录 CLI 的访问令牌同样可以作为 bearer token 使用。

API key 可以在控制台的 **API keys** 页面创建，或用 `instabox keys create --name ci`。创建时只显示一次。

### Scope

key 的权限由 scope 决定，最常用的：

| Scope | 允许 |
| --- | --- |
| `machines:read` | 列出、查看机器、端口、快照元数据和 Secret 元数据 |
| `machines:write` | 创建、启动、暂停、执行命令、发布端口、修改 Secret 选择 |
| `machines:delete` | 删除机器 |
| `images:read` / `images:write` / `images:delete` | 快照的读取、保存与删除 |
| `workspace:admin` | 管理组织级 Secret 的值与下发方式 |

缺少 scope 时返回 `403 permission_denied` 或 `missing_scope`，`message` 会说明需要哪个。

## 变更以 operation 表示

创建、启动、暂停、恢复、关机、删除这类调用返回 `202 Accepted` 和一个 **operation** 对象：

```bash
curl -s -H "X-API-Key: $INSTABOX_API_KEY" \
  "https://api.instabox.sh/v1/operations/op_...?wait=25s"
```

先用 `wait` 长轮询，直到 `state` 是 `succeeded` 或 `failed`，再对该机器发起下一次变更。一台机器同一时间只运行一个操作。

## 幂等

生命周期调用需要 `Idempotency-Key` 头，没有会返回 `400`。用 UUID：

```bash
-H "Idempotency-Key: $(uuidgen)"
```

只有在重试**同一个**请求时才复用同一个 key。用新 key 重试同一个请求会创建第二台机器。

## 删除确认

删除机器需要额外发送 `X-Confirm-Delete`，值必须是机器的 ID 或名称：

```bash
curl -X DELETE "https://api.instabox.sh/v1/machines/m_..." \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "X-Confirm-Delete: m_..."
```

缺少时返回 `409 delete_confirmation_required`。删除会移除机器和它的文件，快照保留。

## 常用接口

| 接口 | 作用 |
| --- | --- |
| `POST /v1/machines` | 创建机器，`{"templateId":"agent-browser"}` 或 `{"snapshotId":"sn_..."}` |
| `GET /v1/machines` | 列出你和你所在组织的机器 |
| `GET /v1/machines/{id}` | 查看一台机器 |
| `POST /v1/machines/{id}/exec` | 执行命令，返回 `stdout`、`stderr`、`exitCode` |
| `POST /v1/machines/{id}/suspend` | 暂停 |
| `POST /v1/machines/{id}/resume` | 恢复 |
| `POST /v1/machines/{id}/start` | 启动已关机的机器 |
| `POST /v1/machines/{id}/stop` | 关机 |
| `DELETE /v1/machines/{id}` | 删除 |
| `GET /v1/machines/{id}/files?path=/data/home/app.py` | 读取文件或目录 |
| `PUT /v1/machines/{id}/files?path=...` | 上传文件，流式请求体，最大 5 GiB |
| `POST /v1/machines/{id}/ports` | 发布端口，`{"port":3000,"access":"private"}` |
| `POST /v1/machines/{id}/snapshots` | 保存快照 |
| `POST /v1/machines/{id}/fork` | 在原地复制机器 |
| `GET /v1/usage` | 账号的机器数、存储、费用与额度 |

### 执行命令

```bash
curl -s -X POST "https://api.instabox.sh/v1/machines/m_.../exec" \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"cmd": "uname -a", "timeoutSeconds": 60}'
```

`cmd` 以登录用户（`dev`，HOME `/data/home`）用 `bash -lc` 执行；`argv` 则不经 shell。只传其中一个。超时后命令会被杀掉，`timeoutSeconds` 最长 600。

带 `Accept: text/event-stream` 时输出会随执行流式返回。

### 创建机器的字段

```json
{
  "name": "box",
  "templateId": "agent-browser",
  "vcpus": 4,
  "memMiB": 8192,
  "metadata": { "customer": "acme" }
}
```

不传规格时使用默认的 4 vCPU / 8 GiB。未知字段返回 `400 unknown_field`，`template` 会被提示改成 `templateId`。字段全集见[定价与用量](./pricing)和各套餐的限制。

## 错误

错误响应把字段放在 `error` 对象里：

```json
{
  "error": {
    "code": "machine_not_running",
    "message": "the machine is not running",
    "requestId": "req_...",
    "retryable": false,
    "docs_url": "https://instabox.sh/docs/reference/errors#machine_not_running"
  }
}
```

| Code | 含义 | 是否重试 |
| --- | --- | --- |
| `missing_scope` | key 缺少所需 scope | 换 key |
| `permission_denied` | 无权访问该资源 | 否 |
| `not_found` | 机器、快照或操作不存在 | 否 |
| `operation_conflict` | 机器上已有操作在进行 | 是，等前一个结束 |
| `machine_not_running` | 机器当前状态不允许该操作 | 先启动 |
| `quota_exceeded` | 超出套餐并发或资源限制（429） | 释放资源或升级后重试 |
| `rate_limited` | 工作区每分钟的启动次数用尽（429） | 按 `retryAfterSeconds` 等待后重试 |
| `idempotency_conflict` | 同一个 `Idempotency-Key` 用在了不同的请求上 | 换一个新 key |
| `delete_confirmation_required` | 缺少 `X-Confirm-Delete` | 补上确认头 |
| `too_large` | 上传文件超过 5 GiB | 分片，或在机器里直接下载 |
| `no_space` | 写入时磁盘已满（507） | 清理空间或扩大 `/data` |
| `unknown_field` | 请求体里有未知字段 | 修正字段名 |

判断是否重试时看响应体里的 `retryable`，而不是只看状态码。`retryAfterSeconds`（以及 `Retry-After` 头）给出建议等待时间。5xx 可以用同一个 `Idempotency-Key` 重试同一个请求；业务变更则要换新 key。

## 相关

- [TypeScript SDK](./sdk)
- [CLI 参考](./cli)
- [快照与分叉](./snapshots)
