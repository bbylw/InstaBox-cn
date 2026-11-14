# API Keys

> 创建、发送、选择 scope，并确认一把 key 能访问哪个工作区。

API key（`ibk_...`）是代码、CI 任务与 Agent 在无人登录时调用 InstaBox 的凭据。HTTP API、SDK、CLI 和 SSH 都接受它；人则用 GitHub 或 Google 登录控制台并创建 key。

```bash
curl -H "X-API-Key: $INSTABOX_API_KEY" \
  https://api.instabox.sh/v1/machines
```

## 发送 key

HTTP 中用 `X-API-Key: <key>` 或 `Authorization: Bearer <key>`。CLI 与 SDK 从环境变量读取：

```bash
export INSTABOX_API_KEY=ibk_...
```

设置后 CLI 不需要 `instabox login`，适合 CI 与脚本。CLI 与 SDK 也读取 `INSTABOX_API_URL`，默认 `https://api.instabox.sh`。

## 创建 key

- **控制台**：侧栏 **API keys**，选择 **Create Key**（`dashboard.instabox.sh/dashboard/api-keys`）。**Full access** 适合 SDK，**Restricted** 用来挑选 scope。key 属于侧栏当前选中的工作区。
- **CLI**：`instabox keys create --name ci` 创建个人工作区的 key。

只有登录能创建和吊销 key，key 本身无论 scope 如何都不能创建 key。

## 为工作区创建 key

key 只能访问它所属的工作区，团队机器需要团队工作区的 key。用 `--org` 指定工作区，需要该工作区的 owner 或 admin：

```bash
instabox keys create --name ci --org team
```

## 列出与吊销

```bash
instabox keys ls
instabox keys rm <key>
```

列表只显示 key 的元数据，从不显示密钥。吊销会同时终止该 key 的 SSH 证书。

## Scope

scope 限制 key 能做什么，可以只给任务需要的最小权限：

```bash
instabox keys create --name ro --scope machines:read
```

| Scope | 允许 |
| --- | --- |
| `machines:read` | 列出与读取机器、操作、指标和用量 |
| `machines:write` | 创建、启动、关机、暂停、恢复、调整规格、设置自动暂停与标签，exec、文件与 SSH |
| `machines:delete` | 删除机器 |
| `images:read` / `images:write` / `images:delete` | 列出、保存、删除快照 |
| `workspace:admin` | 仅工作区 key：以上全部，加上成员、邀请与该工作区的 Secrets（以 admin 身份） |

write 与 delete 包含 read。不传 `--scope` 时，个人 key 默认得到 `machines:read`、`machines:write`、`machines:delete`、`images:read`；工作区 key 默认 `workspace:admin`。

> 注意：给创建机器的 key 授予 `images:read`，SDK 与 CLI 需要用它按名字查找快照。

## key 属于哪个工作区

每把 key 只属于一个工作区，无法访问其他工作区：

- `instabox keys create`（不带 `--org`）、`POST /v1/keys`、或在控制台选中个人工作区创建的 key 属于个人工作区；带 `--org W`、`POST /v1/orgs/{id}/keys` 或选中 `W` 创建的属于 `W`。
- key 创建的机器进入它的工作区。其他工作区的机器、快照和设置对它返回 `404`，创建时指定其他工作区的 `orgId` 也一样。
- 要在别的工作区工作，请使用该工作区的 key（由其 owner 或 admin 创建）。只有登录状态可以跨所有所属工作区操作（`instabox create --org W`）。

## 确认 key 的工作区

```bash
instabox workspace ls
```

```bash
curl https://api.instabox.sh/v1/orgs -H "X-API-Key: $INSTABOX_API_KEY"
```

因为一把 key 只访问一个工作区，列表里只会有一个。工作区 key 的 `GET /v1/me` 还会返回 `orgId`。

## 错误

无效 key 返回 `401`，`error.code` 说明原因：`missing_key`、`malformed_key`、`invalid_key`、`expired_key`、`revoked_key`。缺少路由需要的 scope 返回 `403 missing_scope`，响应里的 `requiredScopes` 列出该路由接受的范围。完整列表见 [错误码](./errors)。

## key 不能做的事

以下路由需要登录（`instabox login` 或控制台），任何 API key 都会得到 `403 permission_denied`（“API keys cannot be used on this route”）：管理 API key、Vault、GitHub CI 安装与任务、创建与删除工作区、账单、会话。

## 相关

- [Agent 自助注册](./agent-sign-up)
- [TypeScript SDK](./sdk)
- [错误码](./errors)
