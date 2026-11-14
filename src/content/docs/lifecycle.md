# 生命周期

> 启动、暂停、恢复、关机、重启、还原和删除一台机器。

你可以从 CLI、SDK 或 API 操作机器。CLI 和 SDK 的调用会等到变更完成；API 调用立即返回一个 operation，需要你自己跟踪。

| 状态 | 内存与进程 | 文件 | 运行时计费 |
| --- | --- | --- | --- |
| Running | 保留 | 保留 | 是 |
| Paused | 保留 | 保留 | 否 |
| Stopped | 丢失 | 保留 | 否 |
| Deleted | 删除 | 删除 | 否 |

## 暂停一台机器

暂停会保留内存和正在运行的进程，恢复后从原来的位置继续。机器空闲时也会自行暂停。

```bash
instabox suspend dev
```

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.connect('dev', { resume: false })
await sbx.pause()
```

```bash
curl -X POST https://api.instabox.sh/v1/machines/m_.../suspend \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)"
```

暂停中的机器不能被关机，先恢复或直接删除。TypeScript SDK 的 `stop()` 会先启动暂停中的机器再关机。

## 恢复暂停的机器

```bash
instabox resume dev
```

```ts
const sbx = await Sandbox.connect('dev', { resume: false })
await sbx.resume()
```

如果内存无法恢复，机器会带着文件重新引导。

## 关机与启动

关机（stop）让机器断电：文件保留，进程结束，下次启动是全新引导。

```bash
instabox stop dev     # 关机
instabox start dev    # 启动一台已关机的机器
```

手动暂停或关机的机器会保持离线，直到你恢复或启动它；而**自行暂停**的机器会在被使用时自动唤醒。

## 重启卡住的机器

`restart`（别名 `recover`）会给停止响应的机器断电重启，根盘和 `/data` 保留，进程与内存不保留。

```bash
instabox restart dev
```

关机流程会先请求 Guest 断电，再发 Ctrl+Alt+Del；超时（默认 60 秒，`--timeout` 最长 10 分钟）后直接结束 VM，因此挂死的 Guest 也能回来。Guest 尚未落盘的写入可能丢失。

## 原地还原快照

`restore` 把机器磁盘还原到某个快照的状态。机器保留自己的 ID、名称、hostname、公开端口 URL 和 ssh-config，所有指向它的东西继续有效。

```bash
instabox restore dev --snapshot before-upgrade
```

> 警告：快照之后根盘和 `/data` 上的所有内容都会丢失，包括正在运行的程序。还原后 SSH host key 会变。

运行中的机器会先被关机，再从快照引导，命令会等到它跑起来。加 `--stopped` 可以让它保持关机。

## 删除机器

删除会移除机器及其文件，快照保留。

```bash
instabox rm dev
```

```ts
const sbx = await Sandbox.connect('dev', { resume: false })
await sbx.kill()
```

```bash
curl -X DELETE https://api.instabox.sh/v1/machines/m_... \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "X-Confirm-Delete: m_..."
```

## 在机器内部重启或关机

| 在机器里执行 | 会发生什么 |
| --- | --- |
| `sudo reboot`、`systemctl reboot`、`shutdown -r` | 进入 Starting，然后在同一块磁盘上重新 Running，进程是新的 |
| `sudo poweroff`、`halt`、`shutdown -h` | 保持 Stopped，直到你启动它 |

## 工作原理

对机器的每次变更都是一个 **operation**，一台机器同一时间最多只有一个操作。控制台会显示这些状态：Creating、Starting、Running、Stopping、Stopped、Pausing、Paused、Resuming、Deleting、Failed。

通过 API 调用生命周期接口会返回 `202 Accepted` 和一个 operation，用"获取 operation"接口跟踪，直到 `succeeded` 或 `failed`。CLI 和 SDK 会自动帮你完成这一步。

## 相关

- [快照与分叉](./snapshots)
- [定价与用量](./pricing)
- [API 概览](./api)
