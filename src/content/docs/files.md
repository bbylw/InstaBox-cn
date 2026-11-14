# 文件

> 在电脑与机器之间复制文件或目录，并直接读写单个文件。

文件命令用于把项目推进机器再构建、把产物拉回本地，或者在代码里读写单个文件。`/data` 下的内容（含家目录 `/data/home`）在暂停或关机后保留。

## 上传目录

```bash
instabox push dev ./my-app
```

不指定目标时，目录保留原名并落在 `/data/home`。在 git 仓库中，`push` 只复制 git 跟踪的文件，未加入 git 的文件会被跳过；需要时加 `--all`。

```ts
await sbx.files.upload('./my-app', '/data/home/my-app')
```

```python
client.files.upload("dev", "./my-app", "/data/home/my-app")
```

## 下载目录

```bash
instabox pull dev /data/home/my-app/dist
```

不指定本地目标时复制到当前目录，包含点文件与空目录。

```ts
await sbx.files.download('/data/home/my-app/dist', './dist')
```

## 复制单个文件

`cp` 类似 `scp`，机器一侧写成「机器名:路径」。

```bash
instabox cp ./backup.tgz dev:/data/home/backup.tgz
instabox cp dev:/data/home/backup.tgz .            # 从机器复制出来
instabox cp -r dev:/data/home/app ./app            # 目录需要 -r
```

## 从代码写入与读取

SDK 会自动创建父目录；REST 接口只有加 `parents=true` 时才创建，否则返回 `404 missing_parent`。

```ts
await sbx.files.write('/data/home/app/.env', 'NODE_ENV=production\n')
const text = await sbx.files.read('/data/home/app/package.json')
```

```bash
curl -X PUT \
  "https://api.instabox.sh/v1/machines/m_.../files?path=/data/home/app/.env&parents=true" \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @.env
```

大文件请用流式读取，避免整份载入内存。

## 路径如何解析

目录复制的落点取决于目标是否存在、源路径是否以斜杠结尾：

| 你写的 | 文件去哪 |
| --- | --- |
| `push dev app /data/w`，且 `/data/w` 存在 | `/data/w/app`：目录落在目标内部 |
| `push dev app /data/w`，且 `/data/w` 不存在 | `/data/w`：不存在时直接把目录复制成该路径 |
| `push dev app/ /data/w` | `/data/w`：结尾斜杠复制的是内容而不是目录本身 |
| `push dev .` | `HOME/<目录名>`：不指定目标时保留目录名 |

目标本身不必存在，但父目录必须存在，否则返回 `missing_parent`；加 `-p` 可以创建缺失的父目录。

## 限制

- `push` 单个文件最大 5 GiB，更大请拆分后上传再用 `cat` 合并。
- `pull` 单个文件不限大小。
- 目录会打包成一个压缩归档，`push` 上限 1 GiB，`pull` 上限 32 MiB；更大的目录请通过 `instabox ssh` 复制。
- 大文件请用 `push` 或 `cp`，不要用 `scp` / `rsync`，原因见 [SSH](./ssh)。
- 文件接口会唤醒自行暂停的机器；已关机或手动暂停的机器返回 `409 machine_not_running`。

## 在机器里不登录也能看文件

```bash
instabox files dev /etc/os-release     # 路径是文件时直接打印内容
instabox files dev /data/home/app      # 路径是目录时列出条目
```

## 相关

- [运行命令](./run-commands)
- [快照与分叉](./snapshots)
