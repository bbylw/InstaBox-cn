# 运行命令

> 在机器里执行命令、流式查看输出，并让长时间任务在后台继续跑。

命令以机器的登录用户在 `/data/home` 中执行，返回输出和退出码，脚本或 Agent 可以直接据此判断结果。自行暂停的机器会为命令自动唤醒，不需要先恢复。

## 执行一条命令

```bash
instabox exec dev -- npm test
```

```ts
const result = await sbx.commands.run('npm test')
console.log(result.stdout, result.exitCode)
```

```python
result = client.machines.exec("dev", "npm test")
print(result.stdout, result.exit_code)
```

```bash
curl -X POST https://api.instabox.sh/v1/machines/m_.../exec \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Content-Type: application/json" -d '{"cmd": "npm test"}'
```

退出码会成为调用的结果：CLI 以相同退出码结束，TypeScript SDK 在非零时抛出 `CommandExitError`（含 `stdout`、`stderr`、`exitCode`）。需要自己处理非零退出码时用 `sbx.commands.exec`。

## 目录、环境变量与超时

默认在 `/data/home` 启动，60 秒后终止。可以为单条命令指定目录、变量和最长 600 秒的超时；超时被杀掉时退出码是 **124**。

```bash
instabox exec dev --cwd /data/home/app --env NODE_ENV=test \
  --timeout 300 -- npm test
```

```ts
await sbx.commands.run('npm test', {
  cwd: '/data/home/app',
  envs: { NODE_ENV: 'test' },
  timeoutMs: 300_000,
})
```

## 流式输出

默认命令结束后一次性返回输出；流式模式可以边跑边看，且输出没有大小上限。

```bash
instabox exec dev --stream -- npm run build
```

```ts
await sbx.commands.run('npm run build', {
  onStdout: (out) => process.stdout.write(out),
  onStderr: (err) => process.stderr.write(err),
})
```

## 后台任务

后台命令脱离终端，没有时间限制，适合 dev server、长构建或 Agent 运行。命令立即返回 job ID。

```bash
instabox exec --background dev -- npm run dev
```

```ts
const job = await sbx.commands.run('npm run dev', { background: true })
console.log(job.jobId)
```

CLI 与 SDK 看到的是同一批任务，可以在代码里启动、在终端里跟踪。

```bash
instabox jobs ls dev                    # 列出任务与状态
instabox jobs logs dev <job-id> -f      # 跟随输出，结束时返回任务的退出码
instabox jobs wait dev <job-id> --timeout 10m
instabox jobs kill dev <job-id>         # 向任务启动的所有进程发送 TERM
```

## 在新机器里跑一条命令

```bash
instabox run --push . -- npm test
```

`run` 创建机器、上传目录、执行命令、再删除机器，并以命令的退出码结束，适合做 CI 的一步。`--timeout` 会同时设置归档和删除的截止时间，即使终端关闭也会清理。

## 查看执行历史

机器保留通过 `exec` 执行过的命令及其退出码（最多最近 200 条，每条各保留输出前 64 KiB），机器关机时也可读取。

```bash
instabox history dev
```

## 限制

- 前台命令默认 60 秒、最长 600 秒；后台任务没有时间限制。
- 非流式模式下 stdout 与 stderr 各截断到 1 MiB，结果的 `truncated` 会标记。
- 后台任务的 stdout 与 stderr 写入同一个日志，SDK 统一放在 `stdout` 返回。
- API 的 `stdin` 最多 1 MiB UTF-8 文本；更大或二进制内容请先写文件再重定向。
- 输出是二进制时 `exec` 以 **65** 退出，请改用 `instabox pull` 或 `instabox cp` 复制文件。

## 相关

- [文件](./files)
- [CLI 参考](./cli)
- [TypeScript SDK](./sdk)
