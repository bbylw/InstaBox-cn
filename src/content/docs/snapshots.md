# 快照与分叉

> 保存一次机器，从它启动更多机器、分叉，或者原地还原。

快照保存机器上已安装的软件和 `/data` 下的文件：home、workspace，以及保存下来的登录状态（gh、Claude、Codex、git、SSH）。它不保存内存和正在运行的进程。快照仅你可见。

```bash
instabox snapshot save dev --name dev-base
instabox create --name dev2 --snapshot dev-base
instabox snapshot ls
```

在控制台里，从机器菜单中选择 **Save snapshot**，然后选择 **New machine from it**，或者稍后在 **Snapshots** 页面操作。

> 小技巧：先在 Playground 里启动一台机器，装好工具、仓库和 Agent 登录，再选择 **Save as snapshot**。之后启动的每台机器都已经配置好了。

## 保存运行中或已关机的机器

- **已关机**的机器直接保存，速度快。
- **运行中**的机器会被实时保存，机器继续运行；快照可能遗漏程序尚未写入磁盘的数据。
- **暂停中**的机器会被拒绝（`409`），而且暂停时也不能关机。要保存就先恢复，再实时保存（如果服务器不支持实时保存，则恢复后关机再保存）。

`snapshot save` 会等到保存完成；`--no-wait` 立即返回。`--root-only` 只保存已安装的软件，从它启动的机器 home 和 workspace 是空的。

## 分叉一台机器

```bash
instabox fork dev --name dev2
instabox fork dev --name try --count 3 --json   # try-1 到 try-3
```

`fork`（别名 `clone`）把一台运行中或已关机的机器复制成一台新机器，`--count` 最多复制 5 台。副本使用相同的模板和规格，`fork` 会等到它们跑起来。

服务器在机器所在主机上直接复制磁盘，几秒内冷启动副本，不需要快照。内存和正在运行的进程不会被复制，源机器也不会改变。

> 暂停中的机器不能分叉，也不能关机，先恢复。每台新机器都占用套餐的启动配额；空间不足时 `fork` 一台都不会创建，并告诉你还能放下几台。

## 原地还原

```bash
instabox restore dev --snapshot dev-base
instabox restore dev --yes --stopped
```

`restore` 把机器的磁盘还原到快照的状态。机器保留 ID、名称、hostname、公开端口 URL 和 ssh-config，所以所有引用它的东西继续有效。不带 `--snapshot` 时，还原到创建机器时所用的快照。

> 警告：快照之后根盘和 `/data` 上的内容全部丢失，包括正在运行的程序。`restore` 会先询问，`--yes` 跳过确认。想保留当前状态的话，改用 `create --snapshot` 或 `fork`。

运行中的机器会先关机，再用还原后的磁盘引导，命令会等它跑起来。加 `--stopped` 可以让它保持关机。还原后 SSH host key 会变，固定过它的 SSH 客户端会再次询问。

保存时用了 `--root-only`，或快照的 `/data` 比机器磁盘大，都会被拒绝。先用 `instabox resize <machine> --disk N` 扩容。

## 浏览与删除

```bash
instabox snapshot files dev-base /etc   # 不启动机器，直接看快照里的文件
instabox snapshot rm dev-base
```

删除机器会保留它的快照；删除快照不会影响从它创建的机器。免费套餐保留 5 个快照。

## 通过 HTTP

- `POST /v1/machines/{id}/snapshots` 保存快照，`GET /v1/snapshots` 列出快照。
- `POST /v1/machines` 带 `"snapshotId"` 从快照启动机器。
- `POST /v1/machines/{id}/restore` 带 `{"snapshotId": "sn_..."}` 原地还原。

## 相关

- [生命周期](./lifecycle)
- [核心概念](./concepts)
- [TypeScript SDK](./sdk)
