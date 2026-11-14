# 自动暂停与最大运行时长

> 机器什么时候自己暂停、什么操作会把它唤醒，以及达到运行上限后的冷却时间。

默认情况下，机器空闲 **30 分钟**后自动暂停。你可以按任务调整空闲时间，也可以设置最大运行时长，限制一台机器一次连续运行多久。

## 什么会唤醒机器

| 操作 | 唤醒？ | 说明 |
| --- | --- | --- |
| `instabox exec`（`POST /v1/machines/{id}/exec`） | 是 | 等待恢复完成 |
| `instabox ps`（`GET .../processes`） | 是 | 等待恢复；手动暂停或关机的机器显示暂停前的进程列表 |
| 文件列表、读取、写入 | 是 | 等待恢复；签名上传 URL 在被使用时唤醒，而不是创建时 |
| `instabox ssh` 的证书请求 | 是 | 返回 `409` 时 CLI 显示 `Waiting for <name> to wake up…`，最多再等 5 分钟并重试 |
| 通过网关的 SSH 连接 | 是 | 最多等 15 秒；仍在恢复则拒绝，提示稍后重试 |
| 访问公开端口 URL（HTTP） | 是 | 请求会等待恢复；未完成时返回 `503` 并带 `Retry-After` |
| 控制台的 **Computer** 或 **Files** 标签 | 是 | 打开时发送 `POST /v1/machines/{id}/wake` |
| 桌面 `status` 或 VNC 流 | 否 | 返回 `409 machine_not_running` |
| `instabox wake` | 是 | 计入套餐每分钟启动次数 |

手动暂停或关机的机器不会因为收到请求就自动恢复，必须显式恢复或启动。

## 设置空闲时间

```bash
instabox create --name dev --auto-suspend 10m
instabox autosuspend dev 5m          # 修改已有机器
instabox autosuspend dev off         # 关闭空闲暂停
```

- 付费套餐：5 到 30 分钟之间的整分钟，或 `0` 关闭。
- Free 套餐：固定 30 分钟，其他值会被拒绝。

## 设置最大运行时长

空闲暂停与最大运行时长同时生效，**谁先到就暂停**。下一次唤醒会重新开始计时。

```bash
instabox create --name job --max-run-minutes 120
instabox max-run dev 60
```

- 付费套餐默认 `-1`（不限制）。
- Free 套餐每次运行有上限（由服务端管理，可能提前暂停），`instabox get` 会显示当前的 `maxRunMinutes`，从 `runStartedAt` 开始算。
- 设为 `0` 会立即暂停，并且在改回来之前无法唤醒（`409 max_run_disabled`）。

## 达到上限后的冷却

因为达到最大运行时长而暂停时，会进入冷却，期间所有唤醒和启动方式都被拒绝：

```text
409 machine_cooldown
```

冷却时长是 **5 分钟加 0–15 分钟随机**，避免一批机器同时唤醒再次撞上限。暂停、关机或改设置都不会缩短已经开始的冷却。空闲暂停没有冷却。

Free 套餐连续触发上限时冷却会更长：第一次 5–20 分钟，第二次 60–75 分钟，第三次及以后 120–135 分钟。以空闲暂停或手动暂停结束的运行会重置计数。

## 租约

`ttlSeconds` 控制单次租约长度，取值 30 到 3600 秒。租约到期后机器按空闲策略处理。

## 相关

- [生命周期](./lifecycle)
- [规格与创建参数](./sizes)
- [限制](./limits)
