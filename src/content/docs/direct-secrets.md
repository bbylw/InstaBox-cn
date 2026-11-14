# Direct Secrets

> 把凭据的真实值直接放进机器的环境变量或文件，用于代理无法承载的凭据。

Direct Secret 是一种把**真实值**放进机器的 Org Secret，形式是环境变量或文件。代理型 [Org Secret](./secrets) 只在机器里留下占位符，由出站代理把真实值加到 HTTPS 请求头；Direct Secret 则由机器里的程序自己读取，适合数据库 URL、SSH 私钥或登录文件。

保存时加 `--direct`（API 中 `delivery: "env"`），需要是组织的 owner 或 admin。

```bash
instabox secrets set PROD_PG --direct
```

没有通过 stdin 提供值时，CLI 会提示输入。

## 代理还是 Direct

| 用途 | 传递方式 |
| --- | --- |
| HTTPS 请求头里的 API key、token、git over HTTPS | 代理（默认） |
| 登录文件（`~/.local/share/opencode/auth.json`、`~/.config/gh/hosts.yml`）、SSH 私钥 | Direct，作为文件 |
| 数据库、Redis、SMTP URL；请求签名（AWS SigV4、服务账号 JWT、HMAC）；放在 body 或 query 里的密钥；固定协议的客户端 | Direct，作为变量或文件 |

## 把登录文件保存为 Direct Secret

```bash
instabox secrets set OPENCODE_AUTH --direct \
  < ~/.local/share/opencode/auth.json
```

## 在机器上引用

保存本身不会给任何机器授权。保存后，用变量、家目录文件或两者同时引用：

- `--secret-env VAR=SECRET`，或同名时 `--secret-env SECRET`
- `--secret-file PATH=SECRET`

```bash
instabox create --name agent \
  --secret-env DATABASE_URL=PROD_PG \
  --secret-env OPENCODE_AUTH
```

> 注意：文件（`--secret-file`）、变量名与 Secret 名不同的 `--secret-env VAR=SECRET`、以及 `exec --secret-env` 需要一项尚未在 instabox.sh 开放的能力，CLI 会明确拒绝。目前可用的是与 Secret 同名的变量：`--secret-env SECRET`。

HTTP 请求中使用 `directSecrets` 或 `envSecrets` 字段。

## 移除引用

```bash
instabox secrets select agent --secret-env none
```

下次投递时，变量与文件会从机器中移除。

## 真实值放在哪里

变量写入 `/run/instabox/secrets/env`；文件值写入 `/run/instabox/secrets/files/`（tmpfs，权限 0600，属于机器用户），家目录路径成为指向它的符号链接。因此磁盘、磁盘快照和分叉都不会保存该值。

如果目标路径已有机器自己的文件，会保留原文件，`secrets show` 报告错误；请移走文件后重新运行 `secrets push`。工具如果重写自己的登录文件，会用磁盘上的真实文件替换链接，此后就是机器自己的文件。

## 限制

- 变量名遵循 Secret 命名规则，不能是 `PATH`、`HOME`、`BASH_ENV`、`IFS` 或 CA 变量，也不能以 `INSTABOX_`、`SSH_` 开头。
- 路径相对于机器家目录：写 `.ssh/id_ed25519`，不要写 `~/.ssh/id_ed25519`。
- 一台机器最多 64 个 Direct 引用。
- 任何 API 都不会返回值；`secrets show` 与 `GET /v1/machines/{id}/secrets` 只列出 `directSecrets` 的名字与路径。每次引用（创建、选择、分叉、exec）都会按名字审计。

## 相关

- [Org Secrets](./secrets)
- [环境变量](./environment)
- [API Keys](./api-keys)
