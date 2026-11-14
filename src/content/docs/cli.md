# CLI 参考

> `instabox` 命令与常用参数，按操作对象分组。

安装：

```bash
npx instabox@latest        # 登录并安装 CLI
npm install -g instabox    # 或者全局安装
```

## 机器

| 命令 | 作用 |
| --- | --- |
| `instabox create --name dev` | 创建机器。`--template`、`--snapshot`、`--gpu`、`--secrets all` 可选 |
| `instabox ls` | 列出机器，`--meta K=V` 按标签过滤 |
| `instabox get dev` | 查看一台机器 |
| `instabox ssh dev` | 打开 Shell（自动处理证书和 known_hosts） |
| `instabox mosh dev` | 用 mosh 打开会话，断网也能保持 |
| `instabox exec dev -- uname -a` | 执行一条命令；`--stream` 流式输出 |
| `instabox exec --background dev -- 'npm run build'` | 后台任务，打印任务 ID |
| `instabox suspend dev` | 暂停，保留内存与进程 |
| `instabox resume dev` | 恢复暂停的机器 |
| `instabox stop dev` / `instabox start dev` | 关机 / 启动 |
| `instabox restart dev` | 重启（`recover` 同义），用于卡死的机器 |
| `instabox rm dev` | 删除机器及其文件，`--yes` 跳过确认 |
| `instabox rename dev new-name` | 原地改名，ID、端口 URL 与 SSH 证书不变 |
| `instabox resize dev --disk 50` | 扩大 `/data`，运行中的机器也可以在线扩容 |
| `instabox wake dev` | 唤醒自行暂停的机器 |
| `instabox whoami` | 显示当前登录的账号 |

`instabox run -- uname -a` 是一次性调用：创建机器、执行、删除。`instabox run --push . -- ls` 会先上传当前目录（跳过 git 忽略的文件）。

## 任务与 Agent

| 命令 | 作用 |
| --- | --- |
| `instabox jobs logs dev <job> -f` | 跟踪后台任务的日志，退出码与任务一致 |
| `instabox agent prompt dev --provider codex -f 'fix the failing test'` | 执行一轮编码 Agent，输出 JSONL 事件 |
| `instabox agent events dev -f` | 跟踪当前对话的事件 |
| `instabox agent steer dev 'use the existing helper instead'` | 打断当前 Agent 并追加指令 |
| `instabox agent interrupt dev` | 停止正在运行的一轮对话 |
| `instabox agent ls dev` | 列出该机器的对话 |

## 文件

| 命令 | 作用 |
| --- | --- |
| `instabox cp ./local dev:/data/home/app.py` | 复制文件或目录，本地与机器之间双向 |
| `instabox push dev .` | 上传目录（git 仓库里只传已跟踪文件，`--all` 加上未跟踪文件） |
| `instabox pull dev /data/home/app.py` | 从机器下载，本地路径默认当前目录 |
| `instabox files dev /etc` | 不登录，直接列出机器里的目录或打印文本文件 |

大文件优先用 `cp` / `push`，它们通过 HTTP API 并行传输，比 scp 快。

## SSH 与端口

| 命令 | 作用 |
| --- | --- |
| `instabox ssh-token dev` | 创建 SSH token，默认 7 天，`--ttl` 可设最长 30 天或 `never` |
| `instabox ssh-token --revoke dev` | 吊销该机器的所有 token |
| `instabox ssh-config dev` | 打印 `~/.ssh/config` 的 Host 配置块 |
| `instabox ssh-cert dev` | 只刷新证书 |
| `instabox port-forward dev 8080:3000` | 把机器端口转发到本机（别名 `forward`） |
| `instabox port publish dev 3000` | 发布端口，`--private`、`--name`、`--rotate-token` |
| `instabox port ls dev` | 列出端口 |
| `instabox port unpublish dev 3000` | 取消发布并关闭连接 |
| `instabox port setup dev` | 在机器里安装 `instabox-port` |

## 快照与分叉

| 命令 | 作用 |
| --- | --- |
| `instabox snapshot save dev --name dev-base` | 保存快照，`--no-wait`、`--root-only` 可选 |
| `instabox snapshot ls` | 列出快照 |
| `instabox snapshot files dev-base /etc` | 不启动机器，直接读快照里的文件 |
| `instabox snapshot rm dev-base` | 删除快照 |
| `instabox create --name dev2 --snapshot dev-base` | 从快照启动新机器 |
| `instabox fork dev --name try --count 3` | 分叉出 1 到 5 台机器，`--json` 输出机器列表 |
| `instabox restore dev --snapshot dev-base` | 原地还原，`--yes`、`--stopped` 可选 |

## 密钥与 API key

| 命令 | 作用 |
| --- | --- |
| `instabox keys create --name mcp` | 创建 API key，只显示一次；`--scope`、`--expires-in-days` 可选 |
| `instabox secrets set NAME --host api.example.com` | 保存 proxy Secret，`--ai` 限定到模型提供商的 API |
| `instabox secrets set NAME --direct` | 保存 direct Secret，真实值下发到机器 |
| `instabox secrets ls` / `instabox secrets show dev` | 查看元数据与机器的下发状态 |
| `instabox secrets rm NAME --yes` | 删除 Secret |

## MCP

| 命令 | 作用 |
| --- | --- |
| `instabox mcp init claude --hosted` | 把托管 MCP 服务器写入客户端配置 |
| `instabox mcp init claude` | 使用本地 stdio 服务器，无需 API key |
| `instabox mcp start` | 手动启动本地 stdio 服务器 |

## 其他

| 命令 | 作用 |
| --- | --- |
| `instabox login` | 登录，`--provider github\|google` 指定方式 |
| `instabox templates` | 列出可用的模板 |
| `instabox usage` | 本月的机器数、存储与限制 |
| `instabox logs dev` | 读取机器的控制台日志和最近的操作 |
| `instabox ps dev` | 列出机器里的进程，`--all` 含内核线程 |
| `instabox history dev` | 通过 `exec` 执行过的命令，最新在前 |
| `instabox output dev` | 打印上一条命令的 stdout/stderr，退出码与它一致 |
| `instabox version` | 显示 CLI 版本，`--json` 还能看到是否过期 |
| `instabox update` | 升级 CLI |
| `instabox completion bash` | 输出补全脚本（bash、zsh、fish、powershell） |

标签用 `create --meta team=infra` 在创建时写入，`ls --meta` 按标签过滤。

> 每个命令都支持 `--help`，例如 `instabox create --help`，会列出当前版本的全部参数。

## 相关

- [快速开始](./quickstart)
- [API 概览](./api)
- [TypeScript SDK](./sdk)
