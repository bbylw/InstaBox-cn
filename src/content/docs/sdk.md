# TypeScript SDK

> 用代码创建、执行、暂停和删除机器。

本页是 SDK 的快速参考，所有调用都在你的服务器上用 API key（`ibk_...`）执行。

## 安装与鉴权

```bash
npm install @insforge/instabox-sdk
export INSTABOX_API_KEY=ibk_...
export INSTABOX_API_URL=https://api.instabox.sh   # 默认值
```

SDK 会读取 `INSTABOX_API_KEY` 和 `INSTABOX_API_URL`，也可以传 `{ apiKey, apiUrl }` 使用自己的密钥存储。没有 key 时，每个调用都会在发请求前抛出 `InstaboxAuthError`（`missing_api_key`）。

## 创建机器

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('agent-browser', {  // 模板、快照名称或快照 ID
  metadata: { customer: 'acme' },                    // 你自己的标签，方便以后查找
  vault: false,                                      // 不接收个人 Vault 下发
})
console.log(sbx.sandboxId)                           // m_...：和你的用户一起存起来
```

`Sandbox.create` 会等到机器运行，所以脚本打印出的是新机器的 ID。`agent-browser` 是默认模板：Linux、桌面和浏览器。

之后在另一个请求里：

```ts
const sbx = await Sandbox.connect(sandboxId)                 // 按 ID 连接，会恢复机器
await Sandbox.list({ metadata: { customer: 'acme' } })     // 按标签查找机器
```

> 通过 HTTP 时，生命周期调用（创建、暂停、恢复、删除）返回 **operation**。在下一步变更之前轮询它直到 `succeeded` 或 `failed`。生命周期调用需要 `Idempotency-Key` 头，没有会返回 `400`。同一个 key 只用于重试同一个请求。

## 执行命令与文件操作

```ts
const r = await sbx.commands.run('python3 -c "print(6 * 7)"', {
  cwd: '/data/home',
  timeoutMs: 60_000,
})
console.log(r.stdout, r.exitCode)   // 非零退出会抛 CommandExitError（stdout、stderr、exitCode）

await sbx.files.write('/data/home/app.py', 'print("hi")')
console.log(await sbx.files.read('/data/home/app.py'))
```

不想在非零退出时抛异常，用 `sbx.commands.exec`。HTTP 上的 `exec` 可以传 `cmd`（用 `bash -lc` 执行的 shell 字符串）或 `argv`（程序与参数，不经 shell），不能同时传。`timeoutSeconds` 默认 60，最大 600。

带 `Accept: text/event-stream` 时（`instabox exec --stream`），输出会随命令执行流式返回。

## 暂停与恢复

```ts
await sbx.pause()                     // 内存、文件和正在运行的进程都保留
await sbx.resume()                    // 从上次的位置继续，通常一秒左右

const peek = await Sandbox.connect(sbx.sandboxId, { resume: false })  // 只看一眼，不唤醒
console.log((await peek.getInfo()).state)
```

## 删除机器

```ts
const id = sbx.sandboxId
console.log(await sbx.kill())           // 删除机器及磁盘；已经不存在时返回 false
console.log(await Sandbox.kill(id))     // 之后任意请求里按 ID 删除
```

## 打开 SSH 会话

`sbx.sshCredentials(publicKey)` 接收你的公钥并返回短期证书。HTTP 上是把公钥发到 `POST /v1/machines/{id}/connections`（需要 `Idempotency-Key`），返回证书和 host CA。

```ts
const ssh = await sbx.sshCredentials(publicKey, { ttlSeconds: 3600 })
console.log(`ssh -i ${keyPath} -p ${ssh.port} ${ssh.username}@${ssh.host}`)
```

## 驱动桌面

```ts
await sbx.desktop.start()                     // 重复调用是安全的
console.log(await sbx.desktop.status())       // { installed, running, width, height }
await sbx.desktop.open('https://example.com')
const png = await sbx.desktop.screenshot()
await sbx.desktop.click(640, 400)
await sbx.desktop.type('hello')
await sbx.desktop.press('Enter')
```

任何有 `machines:write` 的 key（包括工作区 key）都可以通过 `GET /v1/machines/{id}/vnc` 打开桌面。分享链接（`sbx.desktop.streamUrl()`）只属于机器创建者。详见[桌面与浏览器](./desktop)。

## 按客户读取用量与指标

```ts
const machines = await Sandbox.list({ metadata: { customer: 'acme' } })
let seconds = 0
for (const m of machines) {
  const u = await Sandbox.getUsage(m.sandboxId)        // 本月 UTC 运行秒数
  seconds += u.runningSeconds
  const samples = await Sandbox.getMetrics(m.sandboxId) // CPU 和内存，每 30 秒一个采样，最旧在前
  console.log(m.sandboxId, samples.at(-1)?.cpuUsedPct)
}
console.log(machines.length, seconds)
```

`getUsage` 默认统计当前 UTC 月份，只算运行时间，不算暂停和关机时间。`Sandbox.usage()` 返回账号维度的数量、存储和限制。

## 错误处理

调用会抛出 `InstaboxError`，带有 `status` 和 `code`，例如 `not_found` 或 `quota_exceeded`。缺失或错误的 key 抛出 `InstaboxAuthError`。

```ts
try {
  const sbx = await Sandbox.create('agent-browser')
  // ...
} catch (error) {
  console.error(error.code, error.status)
}
```

## SDK 调用与 HTTP 端点

| SDK | HTTP |
| --- | --- |
| `Sandbox.create` | `POST /v1/machines` |
| `pause`、`resume` | `POST /v1/machines/{id}/suspend`、`.../resume` |
| `kill` | `DELETE /v1/machines/{id}` |
| `commands.run` | `POST /v1/machines/{id}/exec` |
| `sshCredentials` | `POST /v1/machines/{id}/connections` |
| `desktop.start` | `POST /v1/machines/{id}/desktop` |
| `desktop.streamUrl` | `POST /v1/machines/{id}/desktop/stream` |
| `getMetrics` | `GET /v1/machines/{id}/metrics` |
| `getUsage` | `GET /v1/machines/{id}/usage` |
| `Sandbox.usage` | `GET /v1/usage` |

## Python

Python 的用法与之对应：

```python
from instabox import Client

client = Client()
client.machines.pause("dev")
client.machines.resume("dev")
client.machines.stop("dev")
client.machines.delete("dev", confirm="dev")
```

安装包为 `instabox-sdk`。

## 相关

- [API 概览](./api)
- [快照与分叉](./snapshots)
- [MCP](./mcp)
