# 环境变量

> 为机器里的每个 Shell 设置普通变量，以及为什么凭据应该放 Org Secrets。

创建机器时可以设置整台机器的普通环境变量。每个登录 Shell（`exec`、SSH、控制台终端）都会导出它们，这些 Shell 启动的进程也会继承。变量从第一条命令起就存在，并在每次启动、恢复后重新注入。

```bash
instabox create --name api --env NODE_ENV=production --env REGION=us-west-2
instabox create --name api --env-file ./app.env      # KEY=VALUE，- 表示读 stdin
instabox exec api --env NODE_ENV=test -- npm test    # 只对这一条命令生效
```

API 中在 `POST /v1/machines` 里发送 `"env": {"NODE_ENV": "production"}`。

> 警告：机器里的任何进程和用户都能读到这些值（`env`、`/run/instabox/env/env`），能执行命令的人也能读到。需要真正保密的 API key 请用 [Org Secrets](./secrets)。

## 工作方式

- **创建时固定。** 分叉的机器继承源机器的变量；从快照创建的机器只拥有自己创建请求里的变量。
- **优先级。** 单条命令的 `--env` 优先；同名的 Vault 项或 env Secret 也优先于机器变量。
- **只返回名字。** `instabox get --json` 只列出 `envNames`，不返回值；值在静态存储时加密。
- **开机服务拿不到。** systemd 在开机时启动的服务不经过登录 Shell，因此没有这些变量；需要时让它自己读取 `/run/instabox/env/env`。

## 限制与被拒绝的名字

变量名匹配 `^[A-Za-z_][A-Za-z0-9_]{0,127}$`，最多 128 个变量、合计 32 KiB。macOS 与 Windows 机器不接受 `env`（`400 bad_request`）。

以下名字会被拒绝（`400 bad_request`）：

- 登录 Shell 自己设置的：`PATH`、`HOME`、`USER`、`LOGNAME`、`SHELL`、`PWD`、`OLDPWD`、`SHLVL`、`HOSTNAME`、`IFS`、`ENV`、`BASH_ENV`
- Bash 只读变量：`UID`、`EUID`、`PPID`、`SHELLOPTS`、`BASHOPTS`、`BASH_VERSINFO`
- 每个会话设置的：`TERM`、`XDG_RUNTIME_DIR`、`DBUS_SESSION_BUS_ADDRESS`，以及 `SSH_` 开头的名字
- `INSTABOX_` 开头的名字
- Org Secrets 管理的信任根：`SSL_CERT_FILE`、`SSL_CERT_DIR`、`REQUESTS_CA_BUNDLE`、`CURL_CA_BUNDLE`、`NODE_EXTRA_CA_CERTS`

这些值可以用 `exec --env` 为单条命令设置。

## 凭据放 Org Secrets

团队共享的具名凭据放到 [Org Secrets](./secrets)：机器只看到占位符，出站代理在发往允许主机的 HTTPS 请求头里替换成真实值。在控制台的 **Secrets** 页面、CLI 或 API 中管理值与授权。

## Vault

每个用户的 Vault 仍然支持环境变量、家目录文件与元数据选择器，和 Org Secrets 并存：

```bash
instabox vault set
instabox vault set-file
instabox vault import
instabox vault ls
instabox vault show
instabox vault rm
instabox vault push dev
```

> 注意：升级不会把 Vault 项迁移成 Org Secrets，也不会让已有机器自动加入 Secrets。

## 相关

- [Org Secrets](./secrets)
- [Direct Secrets](./direct-secrets)
- [规格与创建参数](./sizes)
