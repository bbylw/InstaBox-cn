# Org Secrets

> 凭据由出站代理注入，真实值永远不会落到机器里。

Org Secret 是一个组织拥有的加密 `key=value` 对，它让机器里的应用拿到凭据，同时不把真实值放进机器。适用于代码在 HTTPS 请求头里发送的 API key 和 token，例如模型提供商密钥或 GitHub token。

机器看到的是值为不透明占位符（`ibsec_...`）的环境变量。你的应用照常把占位符放进请求头，发往平常的 HTTPS URL，出站代理会为这个 Secret 允许的主机换成真实值。真实密钥不会出现在机器的磁盘或快照里。

## 保存一个 Secret

```bash
instabox secrets set SERVICE_API_KEY --org team \
  --host api.example.com
```

保存 Secret 需要是组织的所有者或管理员。CLI 从 stdin 或隐藏回显的提示里读取值。

## 给新机器一个 Secret

创建机器时选择 Secret。传 `--secrets all` 可以给机器该组织当前和将来的所有代理 Secret。

```bash
instabox create --name app --org team --secrets all
```

在控制台创建的机器会自动获得工作区当前和将来的所有代理 Secret（前提是你的账号和服务器已启用 Secrets）。已有机器保留自己的选择，可以用 CLI 或 HTTP API 修改。

> 机器只使用自己所属组织的 Secret。

## 在应用里使用

### Git over HTTPS

Git 用 Basic 认证发送 token，代理能处理，所以对私有仓库的 `git clone` 和 `git push` 可以直接用占位符。保存 token 时，除了 `api.github.com`（`gh` 用），还要把 `github.com`（git 用）加入主机列表。

```bash
printf %s "$TOKEN" | instabox secrets set GH_TOKEN \
  --host api.github.com --host github.com
```

然后给 git 一个返回占位符的 credential helper。对于 `GH_TOKEN`，`gh` 可以用一条命令配置好。

### 在浏览器里关掉 QUIC

代理只处理 443 端口上的 HTTPS over TCP。HTTP/3（QUIC，UDP 443）会绕过代理，API 收到占位符后通常直接拒绝，例如返回 `401`。curl 和大多数 HTTP 库走 TCP，但 Chromium 可能选择 HTTP/3。用 Chromium 系浏览器发送 Secret 时，请在浏览器里关闭 QUIC，从 Playwright 或 Puppeteer 启动时也加上相同参数。

## 选择 Secret 可以发往哪些主机

每个 Secret 都列出它允许发往的确切主机，保存时用 `--host` 指定。不传 `--host` 时，Secret 可以发往任何公开的 HTTPS 目的地（`*`）。不支持 `*.example.com` 这样的部分通配符。

> 警告：用 `*` 时，机器里的任何进程都能把 Secret 发往任何公开 HTTPS 主机，包括它自己控制的机器。凭据必须留给某个服务时，请使用确切主机。

### 把模型密钥限制在它的 API 上

模型提供商的 key 可以用 `--ai` 代替 `--host`，把 key 限制在该提供商的 API 上。代理只对这个主机把 key 放进 `x-api-key` 或 `Authorization`。

```bash
instabox secrets set ANTHROPIC_API_KEY --ai anthropic
```

| `--ai` | 主机 |
| --- | --- |
| `anthropic` | `api.anthropic.com` |
| `openai` | `api.openai.com` |
| `gemini` | `generativelanguage.googleapis.com` |
| `openrouter` | `openrouter.ai` |

`--ai` 可以重复，也可以和 `--host` 组合，让一个 key 到达多个主机。

## 管理机器的 Secret

- `--secrets all` 让机器获得之后新建的 Secret；`--secrets none` 阻止机器使用任何 Secret。
- 轮换值会保留占位符，应用不需要重启。
- 删除一个 Secret 再用同名重建，旧的显式授权不会恢复。

```bash
instabox secrets ls
instabox secrets show dev
instabox secrets rm SERVICE_API_KEY --yes
```

## 用 Direct Secret 把真实值放进机器

Direct Secret（CLI 的 `--direct`，API 的 `delivery: "env"`）会把**真实值**以变量或文件的形式放进机器。适用于代理无法承载的凭据，例如数据库 URL、SSH 私钥或登录文件。任何机器里的代码都能读取和复制 Direct Secret，所以 HTTPS API key 优先使用代理方式。

## 工作原理

代理承载 proxy Secret，文件和变量承载 direct Secret。代理会先检查机器的授权、主机范围和上游 TLS 证书，然后把请求头里的占位符替换掉。它只支持 443 端口的 HTTPS，不替换 URL 参数和请求体。

`Authorization` 里的 Basic 认证会被解码，替换 `user:password` 中的占位符后重新编码。其他编码或签名方式会阻止替换。

代理会拦截所有被支持的 HTTPS 主机，即使请求里没有占位符。客户端必须信任 sandbox CA，不能做证书固定。代理会关闭到私有地址的拦截连接。

WebSocket 可以使用，代理替换握手头里的占位符，不替换消息内容。代理会丢弃中继响应里的 `Alt-Svc`，但 Chromium 仍可能根据 DNS 选择 HTTP/3。

## 参考

`PUT /v1/orgs/{id}/secrets/{name}` 的字段：

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `value` | 是 | 凭据，最多 64 KiB UTF-8。proxy 值必须能放进 HTTP 头。 |
| `delivery` | 是 | `"proxy"` 或 `"env"`，每次写入（包括轮换）都要带，否则 `400 delivery is required`。 |
| `hosts` | 仅 proxy | 最多 32 个确切主机名，不带协议、端口、路径或通配符。`"*"` 表示所有公开 HTTPS 目的地；省略或 `[]` 等同于 `["*"]`。 |

新建返回 `201 Created`，替换返回 `200 OK`。两者都只返回元数据，永远不返回值：`id`、`orgId`、`name`、`delivery`、`hosts`、`version`、`size`、`createdAt`、`updatedAt`。

管理类读取永远不返回值。读取 Secret 元数据和机器的选择需要 `machines:read`；修改选择和刷新下发需要 `machines:write`。

## 相关

- [核心概念](./concepts)
- [API 概览](./api)
- [CLI 参考](./cli)
