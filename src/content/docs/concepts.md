# 核心概念

> 控制台、CLI 和 API 共用的几个词。

| 概念 | 是什么 |
| --- | --- |
| **机器（Machine）** | 云上一台属于你的 Linux 虚拟机，有自己的内核、root 和 Docker。`/data` 下的文件（home 是 `/data/home`）与你安装的软件会保留。 |
| **模板（Template）** | 新机器从什么开始：`agent-browser`（默认）、`t3`、`herdr`、`orca`、`android`、`omarchy`（Arch Linux + Omarchy 桌面）。用 `instabox templates` 查看。 |
| **快照（Snapshot）** | 你自己某台机器的保存副本，仅你可见。新机器可以从它启动。 |
| **操作（Operation）** | 对机器的一次变更（创建、启动、停止、暂停、恢复、删除）。你需要跟踪它直到成功或失败。 |
| **API Key** | `ibk_...` 开头，程序、CI 任务和 Agent 用它登录。 |
| **Org Secrets** | 加密凭据。机器里只看到占位符，出站代理在允许的主机上把占位符换成真实值。 |

> 免费套餐只能从 `agent-browser`、`android`、`omarchy`、`ci` 创建机器，但没有快照限制。

## 机器状态

| 状态 | 文件 | 内存与进程 | 用来做什么 |
| --- | --- | --- | --- |
| Running | 保留 | 保留 | 干活 |
| Paused | 保留 | 保留 | 暂时离开，回来继续同一个会话 |
| Stopped | 保留 | 丢失 | 关机。下次启动是全新引导。 |
| Deleted | 删除 | 删除 | 腾出机器名额 |

机器空闲 30 分钟后会自行暂停。下一次命令、读取文件、SSH 连接或访问它的公开 URL 会把它唤醒。**你**手动暂停或关机的机器则保持离线，直到你恢复或启动它。

> API 和 CLI 用 `suspend`、`suspending`、`suspended` 表示暂停相关状态，用 `error` 表示失败。

## 模板

模板决定机器的初始镜像。几个常用的：

- `agent-browser`：默认模板，Linux 桌面 + 浏览器，适合编码 Agent 与计算机使用。
- `t3`：轻量，适合配合 T3 Code 使用。
- `orca`：配合 Orca 工作区。
- `android`：Android 14，可以用 adb 驱动。
- `omarchy`：Arch Linux 加 Omarchy 桌面。
- `gpu`：CUDA 13.0、PyTorch 2.8，带 NVIDIA 驱动。

## GPU 模板

GPU 机器运行在带 NVIDIA GPU 的主机上，可以在代码旁边跑 CUDA 和 PyTorch。目前唯一的 GPU 类型是 `l4`（NVIDIA L4，24 GiB 显存），一台机器可以有 1 到 4 个。

```bash
instabox create --name train --gpu l4
```

```bash
curl -X POST https://api.instabox.sh/v1/machines \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "train", "gpu": "l4:2"}'
```

规格由 GPU 数量决定：每块 GPU 附带 11 vCPU 和 36 GiB 内存，因此不能单独修改 vCPU 或内存。GPU 机器在所有付费套餐可用，每个工作区最多 8 块 GPU，免费套餐不能创建。

## 计费单位

- **运行时**：按秒计费，只在机器运行时收取 vCPU 与内存费用。
- **磁盘**：暂停或关机时仍收取磁盘费用。
- **快照**：免费。
- **出站流量**：每个套餐有月度额度，超出后按量计费。

详见[定价与用量](./pricing)。
