# InstaBox

> 为每个 AI Agent 提供一台属于它自己的云上 Linux 计算机。

InstaBox 给每个 Agent 一台完整的云端 Linux 虚拟机：独立内核、root 权限和原生 Docker。文件与已安装的软件在会话之间保留；机器空闲时自动暂停，你只为真正运行的时间付费。

它不是共享内核的沙箱，而是一整台可以长期使用的机器：后台进程能活下来，环境能留得住，Agent 大部分时间在等待时也不会按满配计费。

- 官网：<https://instabox.sh>
- 中文文档：<https://instabox.sh/docs>
- 本站点：<https://instabox.ndjp.net>

---

## 为什么需要它

长时间运行的 Agent 需要的东西，传统沙箱往往给不了：

| 需求 | InstaBox 的做法 |
| --- | --- |
| 后台进程要活得久 | 完整 VM，systemd、Docker、常驻服务都能跑 |
| 环境要留得住 | `/data` 与安装的软件跨暂停、跨会话保留 |
| 权限要够 | 独立内核 + root，不是被裁剪的用户空间 |
| 成本要可控 | 按秒计费，暂停/关机只收磁盘 |
| 并行要快 | 运行中的机器可以在几秒内分叉出多台副本 |
| 凭据要安全 | Org Secrets 让真实密钥不落到机器里 |

## 快速开始

```bash
npx instabox@latest sh
```

这条命令会完成登录、安装 `instabox` CLI，并在你的第一台机器上打开一个 Shell。

分步执行也可以：

```bash
npx instabox@latest              # 登录并安装 CLI
instabox create --name dev       # 创建机器
instabox ssh dev                 # 进入机器
instabox exec dev -- uname -a    # 或者只跑一条命令
```

暂停与清理：

```bash
instabox suspend dev    # 暂停：文件、内存和进程都保留
instabox resume dev     # 从上次的位置继续
instabox rm dev         # 删除机器及其文件
```

## 核心概念

| 概念 | 说明 |
| --- | --- |
| **机器（Machine）** | 云上一台独立的 Linux VM，有自己的内核、root 和 Docker，HOME 是 `/data/home` |
| **模板（Template）** | 新机器的起点：`agent-browser`（默认）、`t3`、`herdr`、`orca`、`android`、`omarchy`，以及 GPU 用的 `gpu` |
| **快照（Snapshot）** | 你自己机器的保存副本，仅你可见；新机器可以从它启动 |
| **操作（Operation）** | 对机器的一次变更，一台机器同一时间只运行一个 |
| **API Key** | `ibk_...` 开头，程序、CI 与 Agent 用它鉴权 |
| **Org Secrets** | 加密凭据，机器只看到占位符，出站代理替换成真实值 |

### 机器状态

| 状态 | 文件 | 内存与进程 | 计费 |
| --- | --- | --- | --- |
| Running | 保留 | 保留 | 运行时费用 |
| Paused | 保留 | 保留 | 仅磁盘 |
| Stopped | 保留 | 丢失（下次全新引导） | 仅磁盘 |
| Deleted | 删除 | 删除 | 无 |

机器空闲 30 分钟后会自动暂停；下一次命令、文件读取、SSH 连接或访问公开 URL 会把它唤醒。**你手动**暂停或关机的机器则保持离线，直到你恢复或启动它。

## 你能做什么

- **编码 Agent**：给 Claude Code、Codex、OpenCode 一台独立机器，在你的仓库里干活。
- **运行模型生成的代码**：把模型写出的代码放进机器执行，再把输出交回给模型。
- **计算机使用**：让模型驱动机器里的浏览器和桌面，你随时可以接管。
- **预览 URL**：把机器里的 dev server 变成一个可以分享的 HTTPS 地址。
- **并行实验**：一次配置，分叉出多台机器，各试一种实现。
- **CI 与测试**：在全新机器上跑一条测试命令或 GitHub Actions 任务。
- **Android**：在 Android 14 机器上用 adb 驱动应用。

## 访问机器

### SSH

```bash
instabox ssh dev                 # 自动处理证书与 known_hosts
instabox ssh dev -- uname -a     # 执行一条命令
instabox mosh dev                # 断网也能保持会话
instabox port-forward dev 8080:3000
```

没有 CLI 的终端可以用 `instabox ssh-token dev` 生成一行 `ssh` 命令，默认 7 天有效。

### 公开与私有端口

```bash
instabox port publish dev 3000             # HTTPS URL，任何人可访问
instabox port publish dev 3000 --private   # 只给拿到链接的人
instabox port ls dev
instabox port unpublish dev 3000
```

私有端口只响应带 token 的请求；链接只显示一次，可以随时轮换 token。

### 桌面与浏览器

`agent-browser` 模板自带 Linux 桌面和浏览器。在控制台的 **Computer** 标签里观看，点击即可接管；也可以让 Agent 自己操作：

```ts
await sbx.desktop.open('https://example.com')
const png = await sbx.desktop.screenshot()
await sbx.desktop.click(640, 400)
await sbx.desktop.type('instabox.sh')
await sbx.desktop.press('Enter')
```

### 快照与分叉

```bash
instabox snapshot save dev --name dev-base   # 保存已安装软件与 /data
instabox create --name dev2 --snapshot dev-base
instabox fork dev --name try --count 3       # 运行中分叉，几秒启动
instabox restore dev --snapshot dev-base     # 原地还原
```

快照保存软件与文件，不保存内存和进程。分叉会复制磁盘并在源主机上冷启动副本，内存和运行中的程序不会复制。

## Org Secrets：真实密钥不落到机器里

机器里的应用看到的是占位符（`ibsec_...`），出站代理在请求头里把它换成真实值，只为允许的主机这样做。真实密钥不会出现在机器磁盘或快照里。

```bash
instabox secrets set ANTHROPIC_API_KEY --ai anthropic
instabox secrets set GH_TOKEN --host api.github.com --host github.com
instabox create --name app --secrets all
```

适合放在 HTTPS 请求头里的 API key 与 token。数据库 URL、SSH 私钥这类代理无法承载的凭据，使用 Direct Secret（`--direct`），此时真实值会进入机器，任何代码都能读取。

## 从代码使用

### TypeScript SDK

```bash
npm install @insforge/instabox-sdk
export INSTABOX_API_KEY=ibk_...
```

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('agent-browser', {
  metadata: { customer: 'acme' },
})

const result = await sbx.commands.run('python3 -c "print(6 * 7)"')
console.log(result.stdout)          // 42

await sbx.files.write('/data/home/app.py', 'print("hi")')
console.log(await sbx.files.read('/data/home/app.py'))

await sbx.pause()                   // 内存、文件和进程都保留
await sbx.resume()
await sbx.kill()                    // 删除机器，快照保留
```

### Python

```python
from instabox import Client

client = Client()
client.machines.pause("dev")
client.machines.resume("dev")
client.machines.delete("dev", confirm="dev")
```

### HTTP API

基础地址 `https://api.instabox.sh`，用 `X-API-Key` 或 `Authorization: Bearer` 鉴权。生命周期调用返回 operation，需要轮询到 `succeeded` 或 `failed`。

```bash
curl -X POST https://api.instabox.sh/v1/machines \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "box", "templateId": "agent-browser"}'
```

```bash
curl -s -H "X-API-Key: $INSTABOX_API_KEY" \
  "https://api.instabox.sh/v1/operations/op_...?wait=25s"
```

## MCP：让客户端把机器当作工具

```bash
npx instabox@latest
instabox keys create --name mcp
instabox mcp init claude --hosted     # 或 cursor、codex、opencode、antigravity
```

托管服务器地址是 `https://api.instabox.sh/mcp`（Streamable HTTP）。工具包括 `list_machines`、`create_machine`、`exec`、`read_file`、`write_file`、`suspend_machine`、`resume_machine`、`save_snapshot`、`delete_machine`、`get_usage`，权限由 API key 的 scope 决定。

## GPU

GPU 机器运行在带 NVIDIA GPU 的主机上，目前支持 NVIDIA L4（24 GiB 显存，每台 1–4 块），模板预装 CUDA 13.0 与 PyTorch 2.8。

```bash
instabox create --name train --gpu l4
instabox create --name train2 --gpu l4:2
```

每块 GPU 附带 11 vCPU 与 36 GiB 内存，规格由 GPU 数量决定。GPU 机器仅付费套餐可用，每个工作区最多 8 块。

## 定价

| 套餐 | 价格 | 包含 |
| --- | --- | --- |
| Free | $0 | 1 台机器，4 vCPU / 8 GiB，20 GiB 磁盘，5 个快照，100 GiB 出站/月 |
| Pro | $20/月 + 用量 | $20 额度，最多 100 台并发，最高 8 vCPU / 16 GiB，包含 200 GiB 磁盘 |
| Builder | $100/月 + 用量 | $100 额度，最多 200 台并发，最高 16 vCPU / 32 GiB，包含 1 TiB 磁盘 |
| Team | $500/月 + 用量 | $500 额度，500 台并发，最高 32 vCPU / 64 GiB，包含 5 TiB 磁盘 |
| Enterprise | 定制 | 99.9% SLA、SSO/SAML 与 SCIM、审计日志、独立资源池或 BYOC |

用量单价：vCPU $0.004/小时，内存 $0.00225/GiB·小时，存储 $0.00011/GiB·小时，出站流量 $0.02/GiB。运行时按秒计费，只在机器运行时收取；快照免费；暂停或关机只收磁盘。

## 常用 CLI

```bash
instabox ls                          # 列出机器
instabox get dev                     # 查看一台机器
instabox restart dev                 # 重启卡住的机器
instabox resize dev --disk 50        # 扩大 /data
instabox push dev .                  # 上传目录
instabox pull dev /data/home/app.py  # 下载文件
instabox files dev /etc              # 不登录直接读文件
instabox ps dev                      # 进程列表
instabox logs dev                    # 控制台日志
instabox usage                       # 本月的机器数、存储与限制
instabox templates                   # 可用模板
```

每个命令都支持 `--help`，例如 `instabox create --help`。

## 资源

- 官网与定价：<https://instabox.sh>
- 英文文档：<https://instabox.sh/docs>（每页加 `.md` 可取 Markdown 原文）
- 文档索引：<https://instabox.sh/docs/llms.txt>
- 中文文档站：<https://instabox.ndjp.net>
- Discord：<https://discord.gg/instabox>
- 系统状态：<https://instabox.instatus.com/>
- 信任中心：<https://app.vanta.com/insforge.dev/trust/9dxtxcntvvv5ow2tx7e4dm>

InstaBox 由 InsForge, Inc. 构建，已完成 SOC 2 Type II 审计。
