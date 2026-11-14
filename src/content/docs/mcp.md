# MCP

> 让 Claude Code、Cursor、Codex、OpenCode 和 Antigravity 把机器当作工具调用。

MCP 让客户端在自己的环境里直接调用 instabox 工具，不需要安装 CLI。推荐使用托管在 `https://api.instabox.sh/mcp` 的服务器。

## 把客户端连接到托管服务器

**1. 安装 CLI**

```bash
npx instabox@latest
```

命令会完成登录并安装 `instabox` CLI。CLI 只用来写客户端配置，客户端本身不需要它。

**2. 创建 API key**

```bash
instabox keys create --name mcp
```

命令只显示一次 key，把它设置到启动客户端的 Shell 或环境里的 `INSTABOX_API_KEY`。

**3. 把服务器加入客户端**

```bash
instabox mcp init claude --hosted      # Claude Code
instabox mcp init cursor --hosted      # Cursor
instabox mcp init codex --hosted       # Codex
instabox mcp init opencode --hosted    # OpenCode
instabox mcp init antigravity --hosted --inline-key   # Antigravity
```

命令会打印它写入的配置文件，并提示你重启客户端。

**4. 重启客户端并试一个工具**

让客户端"列出我的 instabox 机器"，它会调用 `list_machines` 并显示你的机器。

> 警告：Antigravity 不从配置里读取变量，`--inline-key` 会把 key 直接写进文件（只有你能读）。不要把这样的文件提交到 git。

## 不创建 API key，使用本地服务器

```bash
instabox mcp init claude     # 或 cursor、codex、opencode、antigravity
```

客户端之后会启动 `instabox mcp start`，这是一个本地 stdio 服务器。它用 CLI 的凭据把每条消息发给托管服务器：设置了 `INSTABOX_API_KEY` 就用它，否则用 `instabox login` 的登录态并按需刷新。它从不打开浏览器，所以请先登录一次。客户端所在的机器必须保持 CLI 已安装。

### init 写到哪里

`init` 会添加一个名为 `instabox` 的服务器，并保留文件的其他内容。默认写用户配置，加 `--project` 写项目配置：

| 客户端 | 用户配置 | `--project` |
| --- | --- | --- |
| Claude Code | `~/.claude.json` | `./.mcp.json` |
| Cursor | `~/.cursor/mcp.json` | `./.cursor/mcp.json` |
| Codex | `~/.codex/config.toml` | `./.codex/config.toml` |
| OpenCode | `~/.config/opencode/opencode.json` | `./opencode.json` |
| Antigravity | `~/.gemini/config/mcp_config.json` | `./.agents/mcp_config.json` |

## 手动连接托管服务器

URL 是 `https://api.instabox.sh/mcp`（Streamable HTTP）。把 API key 放在 `X-API-Key: ibk_...` 或 `Authorization: Bearer ibk_...`。已登录 CLI 的访问令牌也可以作为 bearer token 使用。

```bash
claude mcp add --transport http instabox https://api.instabox.sh/mcp \
  --header "X-API-Key: $INSTABOX_API_KEY"
```

一次工具调用走和 REST API 相同的路由，所以 key 的 scope、套餐、配额和速率限制都会生效。服务器不保存会话：每个请求都是一条独立凭据的 JSON-RPC 消息，没有 `Mcp-Session-Id`，也没有事件流（`GET /mcp` 返回 `405`）。

被拒绝的调用是一个带 API `code` 和 `message` 的工具错误，例如 `missing_scope` 和它需要的 scope。

## 不登录也能通过 MCP 读这份文档

`https://instabox.sh/docs/mcp` 是一个公开的文档 MCP 服务器，Agent 在安装任何东西之前就能读文档。它不需要账号，也不能访问你的机器。

```bash
claude mcp add --scope user --transport http instabox-docs https://instabox.sh/docs/mcp
```

```bash
codex mcp add instabox-docs --url https://instabox.sh/docs/mcp
```

```json
// ~/.cursor/mcp.json
{"mcpServers":{"instabox-docs":{"url":"https://instabox.sh/docs/mcp"}}}
```

```json
// opencode.json
{"mcp":{"instabox-docs":{"type":"remote","url":"https://instabox.sh/docs/mcp"}}}
```

它的工具是：`search_insta_box` 搜索文档，`query_docs_filesystem_insta_box` 对页面和 OpenAPI 规格做只读查询，`submit_feedback` 报告页面问题。

## 工具与 scope

| 工具 | 作用 | Scope |
| --- | --- | --- |
| `list_machines`、`get_machine` | 列出你的机器，或按 ID / 名称取一台 | `machines:read` |
| `create_machine` | 从模板（默认 `agent-browser`）或快照创建，等到运行 | `machines:write` |
| `exec` | `argv`（不经 shell）或 `cmd`（`bash -lc`），`timeout_seconds` 最长 600。非零退出也是结果。 | `machines:write` |
| `read_file`、`write_file` | 最大 1 MiB。文本按 UTF-8，其他按 base64。 | `machines:write` |
| `suspend_machine`、`resume_machine` | 暂停与恢复，保留内存。会等待操作完成。 | `machines:write` |
| `save_snapshot`、`list_snapshots` | 保存磁盘、列出快照 | `images:write`、`images:read` |
| `delete_machine` | 永久删除。`confirm` 必须是它的 ID 或名称。 | `machines:delete` |
| `get_usage` | 数量、运行时间和限制（也可以查单台） | `machines:read` 或 `images:read` |

给的是名称而不是 ID 时，工具会先查找机器，这需要 `machines:read`。

生命周期工具默认最多等待 120 秒，`wait_seconds` 最大 600（更大的值按 600 处理，0 或负数表示默认值）。`wait: false` 立即返回 operation。`read_file` 默认读 256 KiB，最大 1 MiB。

## 相关

- [TypeScript SDK](./sdk)
- [快速开始](./quickstart)
- [API 概览](./api)
