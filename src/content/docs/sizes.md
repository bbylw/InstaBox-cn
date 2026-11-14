# 规格与创建参数

> 选择 vCPU 与内存，指定模板版本，以及 `create` 接受的每一个字段。

不指定规格时，机器是 **4 vCPU / 8 GiB**。规格必须同时给出 vCPU 与内存（MiB），并且是当前套餐允许的组合。

## 可用规格

| 套餐 | 规格（vCPU / 内存） | 默认 |
| --- | --- | --- |
| Free | 4 / 8 GiB | 4 vCPU / 8 GiB |
| Pro | 2 / 4 GiB、4 / 8 GiB、8 / 16 GiB | 4 vCPU / 8 GiB |
| Builder | 2 / 4、4 / 8、8 / 16、16 / 32 GiB | 4 vCPU / 8 GiB |
| Team | 2 / 4、4 / 8、8 / 16、16 / 32、32 / 64 GiB | 4 vCPU / 8 GiB |

```bash
instabox create --name big --vcpus 8 --mem-mib 16384
```

`GET /v1/orgs` 会为每个工作区列出 `allowedSpecs`，超出范围的组合返回 `400 spec_not_allowed`。

## 调整规格

付费套餐的机器可以在套餐允许的规格之间调整；Free 套餐的规格固定。

```bash
instabox resize dev --vcpus 8 --mem-mib 16384
```

调整 CPU 与内存需要机器先关机；`--restart` 会让 CLI 自动关机、调整、再启动。

## 创建参数

| 字段 | 类型 | 默认 | 范围 | SDK / CLI |
| --- | --- | --- | --- | --- |
| `name` | string | `box-` 加 8 位随机十六进制 | 1–63 个 `a-z`、`0-9`、`-`，以字母或数字开头 | `--name` |
| `templateId` | string | `agent-browser` | `creatable` 为真的模板，可写成 `id@version` | `--template` |
| `templateVersion` | string | 模板标记为 `latest` 的版本 | - | `--template-version` |
| `snapshotId` | string | 无，从模板创建 | - | `--snapshot` |
| `vcpus` | integer | 规格默认值 | ≥ 1，与 `memMiB` 一起属于 `allowedSpecs` | `--vcpus` |
| `memMiB` | integer | 规格默认值 | ≥ 1 | `--mem-mib` |
| `persistentDiskGiB` | integer | 规格附带的磁盘 | ≥ 1，之后可用 `PATCH` 扩容 | `--disk` |
| `desiredState` | string | `running` | `running` 或 `stopped` | - |
| `maxRunMinutes` | integer | 套餐默认 | -1 到 2147483647 | `--max-run-minutes` |
| `autoSuspendAfterSeconds` | integer | 1800（30 分钟） | 套餐允许的取值，或 0 关闭 | `--auto-suspend` |
| `vault` | boolean | `true` | - | `--no-vault` |
| `env` | object | 无 | 最多 128 个变量、合计 32 KiB | `--env`、`--env-file` |
| `metadata` | object | 无 | 32 个 `key=value` | `--meta` |
| `deleteAfterSeconds` | integer | 无 | 60–86400 | `--delete-after` |
| `archiveSeconds` | integer | 无 | 60–86400 | - |

TypeScript SDK 的中文含义与 REST 略有差异：`diskGiB` 对应 `persistentDiskGiB`，`autoSuspendMs` 用毫秒，`archiveMs` 也用毫秒。REST 请求体里写 `diskGiB` 会得到 `400 unknown_field`。

## 从快照创建时的规格

`instabox create --snapshot` 不指定 `--vcpus` / `--mem-mib` 时使用**套餐默认规格**，而不是源机器的规格；`instabox fork` 则保留源机器的规格。

## 磁盘

`/data` 是唯一需要你设置大小的磁盘，家目录 `/data/home` 位于其中。Free 套餐固定 20 GiB，付费套餐可扩到 200 GiB（Pro）、500 GiB（Builder）、1 TiB（Team 及以上）。

```bash
instabox resize dev --disk 50              # 运行中在线扩容，无需重启
instabox resize dev --disk 50 --restart    # 需要先关机时
```

扩容可以在机器运行时完成；缩容只能对已关机的机器执行，且要求数据加 10%（至少 1 GiB）装得下，否则返回 `409 disk_too_small`。系统盘由模板决定，不占用你设置的磁盘。

## 命名与标签

名称只能包含小写字母、数字和连字符，创建后不能修改；需要改名的场景请用标签区分。标签是纯文本，**不要放密钥**。

## 相关

- [生命周期](./lifecycle)
- [自动暂停与最大运行时长](./auto-pause)
- [存储与保留](./storage)
