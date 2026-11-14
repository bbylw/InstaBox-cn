# 并行分叉

> 配置一台机器，复制成几台，各试一种方案，留下最好的。

先把仓库、依赖和登录配置好一次，再分叉出多台机器，让 Agent 或脚本各做一种尝试，最后比较结果。每份副本的磁盘起点相同，不需要重复配置。

## 1. 配置一台机器

```bash
instabox create --name base
cd my-repo && instabox push base .          # 落在 /data/home/my-repo
instabox exec base --cwd /data/home/my-repo -- npm ci
```

## 2. 分叉

```bash
instabox fork base --name try --count 3 --json
```

这会创建 `try-1`、`try-2`、`try-3`，规格与源机器相同，并等到它们运行。一条命令最多复制 5 台；`--json` 在 `machines` 下返回新机器，否则打印每台的信息和耗时。

磁盘在源机器所在宿主上于几秒内复制完成，不经过快照；内存和正在运行的程序不会被复制。源机器不受影响。同一源的副本只在复制磁盘时排队，之后并行启动。

## 3. 各跑一种方案

```bash
instabox exec --background try-1 --cwd /data/home/my-repo -- ./approach-a.sh
instabox exec --background try-2 --cwd /data/home/my-repo -- ./approach-b.sh
instabox exec --background try-3 --cwd /data/home/my-repo -- ./approach-c.sh
instabox jobs ls try-1
```

任务日志：

```bash
instabox jobs logs try-1 <job-id> -f
```

## 4. 比较并保留

```bash
instabox exec try-1 --cwd /data/home/my-repo -- npm test
instabox pull try-1 /data/home/my-repo/result.json
instabox rm --yes try-2 try-3
```

## 从快照分叉

快照能把配置长期保留下来，并且可以在任何宿主、任何时间启动任意数量：

```bash
instabox snapshot save base --name base-setup
instabox create --name try-4 --snapshot base-setup
```

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('base-setup', { name: 'try-4' })
```

## 限制与行为

- 每份副本都是一台机器，计入套餐的机器数与每分钟启动数，`fork` 会等待启动限速。
- 工作区放不下 `--count` 台时，`fork` 不会创建任何机器，并说明能放下几台。
- **暂停中的机器不能分叉**：服务端返回 `409 fork_unavailable`，需要先恢复；也可以保存快照后从快照创建。
- 分叉只在源机器的宿主上进行。宿主维护或满载时，返回同样的错误码，`reason` 为 `source_host_unavailable` 或 `source_host_full`，此时不会创建任何东西；关机再启动可以把机器迁到其他宿主。
- 副本保留源机器的规格、环境变量、Secret 选择、自动暂停、最大运行时长、标签与删除时间（同一时刻删除）。可以用 `--auto-suspend`、`--max-run-minutes`、`--meta`、`--delete-after` 覆盖。
- 从快照创建的机器只拥有自己创建请求里的变量与 Secret，规格使用套餐默认值（除非显式指定）。

## 相关

- [快照与分叉](./snapshots)
- [限制](./limits)
- [编码 Agent](./coding-agents)
