# 限制

> 每个套餐的机器数、规格、磁盘、快照与速率限制。

## 套餐限制

|  | Free | Pro | Builder | Team | Enterprise |
| --- | --- | --- | --- | --- | --- |
| 机器总数 | 1 | 500 | 1,000 | 不限 | 不限 |
| 同时运行 | 1 | 100 | 200 | 500 | 不限 |
| 最大规格 | 4 vCPU / 8 GiB | 8 / 16 GiB | 16 / 32 GiB | 32 / 64 GiB | 32 / 64 GiB |
| 单机磁盘 | 20 GiB（固定） | 最高 200 GiB | 最高 500 GiB | 最高 1 TiB | 最高 1 TiB |
| 包含磁盘 | - | 200 GiB | 1 TiB | 5 TiB | 5 TiB |
| 存储上限 | 200 GiB | 无 | 无 | 无 | 无 |
| 快照 | 5 | 不限 | 不限 | 不限 | 不限 |
| 每月出站 | 100 GiB | 1 TiB | 5 TiB | 50 TiB | 50 TiB |
| 每分钟启动 | 3 | 30 | 50 | 100 | 100 |
| 成员 | 3 | 不限 | 不限 | 不限 | 不限 |

其他限制：

| 项目 | 限制 |
| --- | --- |
| 机器规格 | `GET /v1/orgs` 的 `allowedSpecs`，默认 4 vCPU / 8 GiB |
| 空闲暂停 | Free 固定 30 分钟；付费 5–30 分钟或关闭 |
| 最大运行时长 | Free 每次运行有上限（最多 480 分钟）；付费默认不限 |
| 启动速率 | 创建、启动、恢复、唤醒都计入，超出返回可重试的 `429 rate_limited` |
| API key | 20 把有效 |
| `exec` | 所有机器合计 32 个并发请求；单条命令最长 10 分钟，默认 60 秒 |
| 标签 | 每台 32 个 |
| 公开端口 | 每台 16 个 |

超过机器或存储上限时，新的机器与快照会被拒绝，直到你删除一些。存储达到 80% 时 **Account** 会提示。从快照创建的机器至少拥有保存时那台机器的存储。

## 机器内部规格

除 `ci`（Ubuntu 24.04）与 `omarchy`（Arch Linux）外，所有模板都是 Debian 13（trixie）、amd64、带 systemd，运行在 Firecracker microVM 中，内核为 Linux 6.18.60（`uname -r` 显示 `6.18.60-instabox`，`android` 为 `6.18.60-instabox-android`，`omarchy` 为 `6.18.60-instabox-drm`）。

默认是 4 vCPU / 8 GiB（`free -m` 显示约 7.8 GiB），附一块 20 GiB 的持久 ext4 磁盘挂在 `/data`，家目录是 `/data/home`。

Free 套餐只能从 `agent-browser`、`android`、`omarchy`、`ci` 创建。检查机器可以用：

```bash
uname -r
cat /etc/os-release
nproc
free -m
df -h / /data
```

## 机器内部的限制

**出站带宽**：每台机器约 50 Mbit/s（约 6 MB/s），几乎没有突发。上传、SSH 与端口转发、公开 URL 的响应都受此限制；约 100 MB 文件传出需要 15–20 秒。接收不限速。这个上限按机器计算，与套餐每月出站额度独立。

## 磁盘

```bash
instabox resize dev --disk 50             # 机器必须能在线扩容
instabox resize dev --disk 50 --restart   # 需要关机时自动处理
```

- **扩容**：运行中的机器立即生效，无需重启；无法在线扩容时返回 `409 grow_needs_stop`。
- **缩容**：只能对已关机的机器，且数据加 10%（至少 1 GiB）必须装得下，否则 `409 disk_too_small` 会给出最小可用值。
- REST 字段是 `persistentDiskGiB`，TypeScript SDK 用 `diskGiB`；在 REST 请求体里写 `diskGiB` 会得到 `400 unknown_field`。
- 系统盘由模板决定，不计入你的磁盘；超出套餐包含磁盘的部分按 GiB 计费。

## 快照与规格

`instabox create --snapshot`（或 `Sandbox.create(snapshotId)`）不指定规格时使用套餐默认规格，而不是源机器规格；`instabox fork` 保留源机器规格。

## 相关

- [规格与创建参数](./sizes)
- [定价与用量](./pricing)
- [错误码](./errors)
