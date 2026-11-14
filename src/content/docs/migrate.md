# 从其他平台迁移

> 把 E2B、Daytona 或 Boat 上的代码迁到 InstaBox 机器。

三者的概念都能对应到 InstaBox：一个沙箱就是一台**机器**（完整 Linux VM，持久磁盘在 `/data`，从模板或快照创建）。多数调用一一对应，主要差异在预览链接、环境变量与后台任务。

## 通用步骤

1. 安装 SDK 并换 key：`pip install instabox-sdk` 或 `npm install @insforge/instabox-sdk`，使用 `INSTABOX_API_KEY`。
2. 把 `create` 换成 `client.machines.create(...)` / `Sandbox.create(...)`，默认模板是 `agent-browser`。
3. 执行命令改用 `exec` / `commands.run`；非零退出码在 Python 中是结果，在 TypeScript 中抛 `CommandExitError`。
4. 文件路径从 `/home/user` 改为 `/data/home`。
5. 预览链接改为发布端口；后台任务改为 `--background` 或 `background: true`。
6. 需要自定义环境时，把 Dockerfile 构建成镜像并 `instabox snapshot import`，然后从快照创建。

## 从 E2B

| E2B | InstaBox Python | InstaBox TypeScript |
| --- | --- | --- |
| `E2B_API_KEY` | `INSTABOX_API_KEY` | `INSTABOX_API_KEY` |
| `Sandbox.create(template)` | `client.machines.create(template=...)` | `Sandbox.create(template, opts)` |
| `metadata={...}` | `metadata={...}` | `{ metadata }` |
| `envs={...}` | 每条 `exec(..., env=...)` | `{ envs }` 创建时传入 |
| `commands.run(cmd)` | `client.machines.exec(box.id, cmd)` | `sbx.commands.run(cmd)` |
| `commands.run(cmd, background=True)` | `exec(box.id, "nohup cmd >log 2>&1 &")` | `commands.run(cmd, { background: true })` |
| `run_code(code)` | `exec(box.id, "python3 -", stdin=code)` | `commands.run('python3 -', { stdin: code })` |
| `files.write/read/list/remove/exists` | 同名方法 | 同名方法 |
| `get_host(port)` | `POST /v1/machines/{id}/ports` | `(await sbx.ports.publish(port)).url` |
| `pause()` | `client.machines.pause(box.id)` | `sbx.pause()` |
| `Sandbox.connect(id)` | `client.machines.ensure_running(id)` | `Sandbox.connect(id)` |
| `Sandbox.list()` | `client.machines.list(metadata=...)` | `Sandbox.list({ metadata })` |
| `kill()` | `client.machines.delete(box.id)` | `sbx.kill()` |
| `timeout` / `set_timeout` | `delete_after_seconds` / `archive_seconds` | `archiveMs` |
| `e2b.Dockerfile` | 推送镜像后 `snapshot import` | 同上 |

`sbx.ports` 需要 `@insforge/instabox-sdk` 0.8.0 及以上；Python SDK 目前没有端口调用，可以直接用 `httpx` 调用 API。

## 从 Daytona

| Daytona | InstaBox |
| --- | --- |
| `Daytona()` + `DAYTONA_API_KEY` | `Client()` / `Sandbox` + `INSTABOX_API_KEY` |
| `daytona.create(...)` | `client.machines.create(...)` / `Sandbox.create(...)` |
| Sandbox ID | 机器 ID `m_...` |
| 默认快照、`language="python"` | 默认模板 `agent-browser`（Python 3、Node.js、git、curl、桌面） |
| `fs.upload_file` / `download_file` | `client.files.write` / `read_bytes`；`sbx.files.write` / `read` |
| `fs.list_files` / `delete_file` | `files.list` / `files.remove` |
| `git.clone` / `commit` / `push` | 用 `exec` 运行 `git` |
| `get_preview_link(port)` | 发布端口：`POST /v1/machines/{id}/ports`，或 `sbx.ports.publish(port)` |
| `auto_stop_interval` | `auto_suspend_after_seconds` / `autoSuspendMs` |
| `auto_archive_interval` | 不需要：暂停或关机的机器会一直保留磁盘 |
| `auto_delete_interval` / `ephemeral` | `delete_after_seconds` / `--delete-after` |
| `sandbox.stop()` / `start()` | `stop` / `start`；需要保留内存与进程时用 `pause` / `resume` |
| `sandbox.delete()` | `client.machines.delete(...)` / `sbx.kill()` |
| `labels` / `set_labels` / `list(labels)` | `metadata`，`update(..., metadata=)`，`list(metadata=)` |
| `get_work_dir()` / `get_user_home_dir()` | HOME 是 `/data/home` |

Daytona 的 `result` 对应 InstaBox 的 `stdout`；InstaBox 另外返回 `stderr`。

## 从 Boat

| Boat | InstaBox |
| --- | --- |
| Sandbox（`bx_...`） | 机器（`m_...`） |
| `BOAT_API_KEY`、`boat login` | `INSTABOX_API_KEY`，无需登录步骤 |
| `boat new --name dev` | `instabox create --name dev`，规格用 `--vcpus` / `--mem-mib` |
| `boat new --from S` | `instabox create --snapshot S` |
| `boat new -e KEY=VALUE` | `instabox create --env KEY=VALUE` 或 `--env-file` |
| `boat new --setup-file F` | `instabox create --setup-file F` |
| `boat list` / `info` | `instabox ls` / `instabox get` |
| `boat exec ID CMD` | `instabox exec NAME -- CMD` |
| `boat exec --detach` | `instabox exec --background`，再用 `instabox jobs logs` |
| `boat run --from S --push . -- CMD` | `instabox run --from S --push . -- CMD` |
| `boat ssh ID` | `instabox ssh NAME` |
| `boat push ID ./app --to app` | `instabox push NAME ./app app` |
| `boat scp ./f bx_ID:/path` | `instabox cp ./f NAME:/path` |
| `boat forward ID` | `instabox port-forward NAME 8080:3000` |
| `boat stop` / `resume` | `instabox stop` / `start`；`suspend` / `resume` 会保留内存与进程 |
| `boat fork` / `delete --yes` | `instabox fork` / `instabox rm --yes` |

### Boat CI 迁移

```yaml
jobs:
  test:
    runs-on: instabox-medium
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```

每个 job 得到一台全新的 Ubuntu 24.04 机器，带有 GitHub `ubuntu-24.04` 镜像的工具，任务结束后删除。

## 用 Agent 完成迁移

把仓库交给编码 Agent 时，可以直接给它这样的指令：

```text
把这个仓库从 E2B 迁移到 InstaBox。

1. 找出所有 e2b、e2b-code-interpreter、@e2b/code-interpreter 的用法、E2B_API_KEY 和 e2b.Dockerfile。
2. 换成 pip install instabox-sdk / npm install @insforge/instabox-sdk，使用 INSTABOX_API_KEY。
3. 按上表替换调用，文件路径改为 /data/home，预览链接改为发布端口。
4. 保留非零退出码的处理语义；TypeScript 里捕获 CommandExitError。
5. 迁移完成后运行现有测试。
```

## 常见问题

- **`403 missing_scope`**：key 缺少调用所需的 scope。`snapshot import` 需要 `images:write`，按名字从快照创建需要 `images:read`。
- **找不到文件**：E2B 的 `/home/user` 在 InstaBox 是 `/data/home`。
- **后台任务立即结束**：请使用 `--background` 或 `background: true`，不要只加 `&`。
- **预览链接 404**：端口要等服务开始监听后再访问，首次请求重试几秒。

## 相关

- [快速开始](./quickstart)
- [TypeScript SDK](./sdk)
- [Python SDK](./python-sdk)
