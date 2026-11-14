# 存储与保留

> 机器与快照保留多久、归档与删除截止时间，以及存储同步。

暂停或关机不会丢文件，InstaBox 也会一直保留机器和你保存的每个快照，直到**你**删除它们。对于 CI 任务或 Agent 创建的临时机器，可以在创建时设置截止时间，即使创建它的程序崩溃，机器也会被自动关机或删除。

```bash
instabox create --name job --delete-after 1h
```

## 数据保留多久

默认情况下，无论机器在运行、暂停还是关机，机器与快照都保留到你删除为止。唯一例外是所属工作区被禁用或删除。

> 警告：工作区被**禁用**（订阅取消或欠费超过宽限期）后，机器与快照保留 30 天，然后删除。**删除**工作区会立即删除，没有恢复窗口。

即使机器关机，保留的数据仍计入套餐限制与账单。Free 套餐的存储上限是 200 GiB；付费套餐按每台机器磁盘的分配容量计费，月度额度优先抵扣。

## 到期删除机器

适合只需要用一段时间的机器：截止时间到达后，机器连同文件一起被**删除**，无论当时是什么状态。

```bash
instabox create --name job --delete-after 1h
```

API 使用秒数：

```bash
curl -X POST https://api.instabox.sh/v1/machines -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" -d '{"name": "job", "deleteAfterSeconds": 3600}'
```

机器会把截止时间显示为 `deleteAt`。

## 到期关机

如果只想停止付费但保留文件，用归档截止时间：到达后运行中的机器被**关机**，磁盘留在对象存储中，之后可以再启动并找到原来的文件。

```ts
const sbx = await Sandbox.create({ name: 'job', archiveMs: 60 * 60 * 1000 })
```

```bash
curl -X POST https://api.instabox.sh/v1/machines -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" -d '{"name": "job", "archiveSeconds": 3600}'
```

截止时间显示为 `archiveAt`。**归档截止时间是一次性的**：恢复机器不会清除它；时间一过（无论是否在运行）就会被清除，当时已经暂停或关机的机器之后启动也不会再被归档。

## 一次性命令的截止时间

`instabox run` 为一条命令创建机器并在结束后删除。它根据 `--timeout` 同时设置归档与删除截止时间，所以即使终端关闭也会被清理：

```bash
instabox run --timeout 10m -- npm test
```

## 等待存储同步

关机或暂停后，最新的磁盘状态会在后台上传到对象存储。通常可以忽略；但如果希望机器能在任何宿主上启动，就需要等上传完成，否则启动只能落在它上次运行的宿主上。上传大约需要 10 秒，排队时可能更久，没有固定上限。

## 限制

- 两个截止时间都是可选的，不设置就留空或传 `0`。
- `archiveSeconds` 与 `deleteAfterSeconds` 取值 60–86400。
- 关机的机器没有强制生命周期，不会在 7 天或 14 天后被清理。
- 不能选择区域：机器没有 `region` 字段，创建请求里带 `region` 会得到 `400 unknown_field`。

## 相关

- [快照与分叉](./snapshots)
- [限制](./limits)
- [定价与用量](./pricing)
