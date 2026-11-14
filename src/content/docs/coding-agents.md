# 编码 Agent

> 让 Claude Code、Codex 或 OpenCode 在自己的机器上处理你的仓库，密钥不落进机器。

编码 Agent 需要安装依赖、运行 Docker、随意试错，这不该发生在你的笔记本上。给它在云上一台独立机器：工作成果留在磁盘上，跨会话保留；模型提供商的 key 通过 Org Secret 注入，机器里只有占位符。

以下步骤使用默认模板 `agent-browser`，它预装 Claude Code、Codex 与 OpenCode。

## 1. 保存模型 key

```bash
instabox secrets set ANTHROPIC_API_KEY --ai anthropic
```

`--ai anthropic` 会让出站代理只把真实 key 加到发往 `api.anthropic.com` 的请求里。换成 `openai`、`gemini` 或 `openrouter` 可以匹配其他提供商。

## 2. 创建机器并授权 Secret

```bash
instabox create --name agent --secrets ANTHROPIC_API_KEY
```

命令会等到机器运行，并打印它的信息。

## 3. 推入仓库

```bash
cd my-repo
instabox push agent .
```

在 git 仓库中只复制被跟踪的文件；Agent 也需要未跟踪文件时加 `--all`。不指定目标时落在 `/data/home/my-repo`。

## 4. 运行 Agent

```bash
instabox ssh agent
cd my-repo && claude
```

Codex 用 `codex`，OpenCode 用 `opencode`。

## 不用终端也能驱动

`agent prompt` 把 Claude Code 作为后台任务运行，并可以跟随它的事件：

```bash
instabox agent prompt agent --cwd /data/home/my-repo -f "fix the failing test"
```

换 Codex：

```bash
instabox agent prompt agent --provider codex -f "fix the failing test"
```

需要打断并补充指令：

```bash
instabox agent steer agent 'use the existing helper instead'
```

## 从快照开始，避免重复配置

```bash
instabox snapshot save agent --name agent-base
instabox create --name agent2 --snapshot agent-base
```

快照保存已安装的工具、仓库与登录状态（不含内存与进程）。

## 其他凭据

- **私有仓库**：把 GitHub token 保存为面向 `github.com` 与 `api.github.com` 的 Secret，然后在机器里运行 `gh auth setup-git`。
- **登录文件或 SSH 私钥**：代理无法承载，使用 [Direct Secrets](./direct-secrets)，以文件形式投递。

## 让 Agent 自己管理机器

`npx instabox@latest` 会把 instabox 技能装进你的编码 Agent，于是可以直接说「创建一台机器并在上面跑测试」。客户端没有 CLI 时，用 [MCP](./mcp) 服务器。

## 相关

- [Org Secrets](./secrets)
- [SSH](./ssh)
- [并行分叉](./parallel-forks)
