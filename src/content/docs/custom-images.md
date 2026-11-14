# 自定义镜像

> 把 Docker / OCI 镜像导入成快照，再从它启动机器。

可以从镜像仓库导入 Docker 或 OCI 镜像作为快照，然后像普通快照一样创建机器。

```bash
instabox snapshot import node:16-buster --name node16     # 需要几分钟
instabox create --name dev --snapshot node16
instabox exec dev -- node -v                              # v16.20.2，来自镜像
```

导入在所有套餐可用，结果就是一个普通快照。

## 导入过程

`snapshot import` 会启动一台临时机器，在里面用 Docker 拉取镜像，把镜像的文件覆盖到机器自身文件之上，然后重启机器确认它能引导并响应，最后保存为快照并删除临时机器。临时机器是 `agent-browser` 规格，运行期间计费。

## 从镜像创建的机器

- **镜像的文件优先**：它的程序、库、`/usr/local`、`/opt`、`/root`、`/home`、`/app` 以及用户。
- **镜像的 `ENV`** 会进入每个会话（exec、SSH、登录 Shell），其 `PATH` 新增的目录排在最前。
- **镜像的 `ENTRYPOINT` 与 `CMD`** 作为 `instabox-image.service` 由 systemd 运行，使用镜像的 `WORKDIR` 和 `USER`（未设置时为 root），失败会重启。用 `journalctl -u instabox-image.service` 查看输出；`--no-entrypoint` 可以不带这个单元。
- **机器自身的能力保留**：systemd、sshd、sudo、机器用户（UID 1000，因此镜像里 UID 1000 的用户，例如 `node`，就是机器用户）、`/data`，以及机器自身程序依赖的共享库。
- `/etc/instabox/image.json` 记录镜像引用、digest 与配置。

## 限制

- 只支持 `linux/amd64` 镜像。
- 本地构建的镜像必须先推送到仓库（`docker push ghcr.io/you/img:tag`）。
- 镜像的 `EXPOSE` 端口不会自动发布，仍用 `instabox port publish`。
- 快照数量限制同样适用（Free 套餐 5 个）。

## 关于 init、apt 与 C 库

机器以 systemd 作为 init。镜像自己的 init（tini、s6）存在但不会运行，只运行它的 `ENTRYPOINT` 与 `CMD`。`apt` 管理的是机器自身系统，镜像里的软件包只是文件，`apt` 看不到也无法卸载。Debian/Ubuntu 镜像（包括很旧的版本）运行在机器较新的 C 库上；Alpine（musl）镜像只是尽力支持。

## 参数

| 参数 | 作用 |
| --- | --- |
| `--registry-username U` | 私有镜像，配合 `INSTABOX_REGISTRY_PASSWORD` 或 `--registry-password-stdin`；密码不会留在快照里 |
| `--keep-builder` | 保留临时机器（失败时也保留），方便 `instabox ssh` 排查 |
| `--no-verify` | 跳过重启检查 |
| `--timeout` | 限制拉取与覆盖的时间，默认 `30m` |
| `--json` | 以单个对象输出结果 |

## 相关

- [快照与分叉](./snapshots)
- [规格与创建参数](./sizes)
