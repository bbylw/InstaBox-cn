# 日志与标签

> 读取机器控制台日志与最近操作，用 `key=value` 标签给机器分组。

机器起不来、连不上，或者启动/恢复失败时，先看日志。需要重新找到一批机器时，用标签。

## 读取日志

`instabox logs` 打印控制台日志和最近 20 次操作（创建、启动、关机、暂停、恢复及其错误）。任何状态下都能读，而且**不会唤醒机器**。

```bash
instabox logs job                 # 最近 200 行控制台输出与操作记录
instabox logs job --tail 50 -f    # 跟随新输出（Ctrl-C 停止）
instabox logs job --json          # GET /v1/machines/{id}/logs
```

控制台是串口控制台：内核与 systemd 启动信息、写入 `/dev/console` 的内容，以及 VM 监控的错误。宿主保留最近 8 MiB，跨关机、暂停和重启。

命令自身的输出属于它的后台任务：

```bash
instabox jobs logs job <job-id>
instabox exec job -- sudo journalctl -b --no-pager   # 本次启动的完整 journal
```

API 的 `GET /v1/machines/{id}/logs?tail=N` 返回 `console`、`cursor`、`state` 与 `operations`；把 `cursor` 作为 `after` 传入即可只取新内容。磁盘在对象存储中、暂时读不到控制台时仍返回 `200`，并带 `consoleUnavailable`。

## 标签

每台机器最多 32 个 `key=value` 标签（API 里叫 `metadata`），可以按标签筛选。

```bash
instabox create --name job --meta task=review
instabox ls --meta task=review     # GET /v1/machines?metadata=task:review
```

多个 `--meta` 表示必须全部匹配。筛选在服务端完成，只会列出你有权访问的工作区的机器。

```bash
# Agent 给自己创建的每台机器打上会话标签
instabox create --name worker --meta session=abc123
instabox ls --meta session=abc123
```

> 警告：标签以明文存储，只用来分类，不要放敏感信息。

## 操作历史

每台机器保留最近的创建、启动、关机、暂停、恢复操作及其错误。查看单台机器的操作：

```bash
instabox get dev
instabox get dev --json | jq '.operations'
```

操作一直在后台进行时，`instabox get` 会显示当前状态与进行中的操作；需要等待完成可以用 `instabox wait dev`。

## 相关

- [生命周期](./lifecycle)
- [自动暂停与最大运行时长](./auto-pause)
- [API 概览](./api)
