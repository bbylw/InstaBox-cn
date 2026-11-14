# SSH

> 打开 Shell、执行命令，或把端口转发进机器。

有两种连接方式。用 `instabox` CLI 时不需要 token；没有 CLI 时，先创建一个 SSH token。

| 从哪里连接 | 怎么做 |
| --- | --- |
| 装了 CLI 的电脑 | 运行 `instabox ssh dev`。CLI 会处理证书和 `known_hosts`。 |
| 没有 CLI 的终端 | 创建一个 SSH token，然后粘贴它给出的那一行命令。 |
| 编辑器或 ADE | 参考 ADE 的接入方式。 |

```bash
instabox ssh dev                 # 证书、known_hosts 和登录一步完成
instabox ssh dev -- uname -a     # 只执行一条命令
instabox mosh dev                # 和 instabox ssh 一样，但使用 mosh
instabox ssh-config dev          # 打印 ~/.ssh/config 的 Host 配置块
instabox ssh-cert dev            # 只刷新证书
```

## 在没有 CLI 的终端连接

在控制台或另一台电脑的 CLI 上创建 token：

- **控制台**：在机器的 **Connect** 区域打开 **SSH tokens**，选择 **Create token**，命令行会留在那里供你复制。
- **CLI**：运行 `instabox ssh-token dev`。token 默认 7 天有效，`--ttl` 可设为最长 30 天，或 `never`。

两种方式都会给你一行 `ssh ibssh_…@<host>`，粘贴到任何地方即可，不需要 CLI 或 SSH 私钥。首次连接时 ssh 会让你确认网关的 host key。

> 警告：拿到这行命令的人都能打开机器里的 Shell。要吊销一台机器的所有 token，运行 `instabox ssh-token --revoke dev`。

## 把端口转发到本机

```bash
instabox port-forward dev 8080:3000         # 机器上的 3000 映射到 http://127.0.0.1:8080
instabox port-forward dev 3000              # LOCAL 默认等于 REMOTE
instabox port-forward dev 8080:3000 5432    # 一次转发多个端口
```

转发会一直运行，直到你按 Ctrl-C。`forward` 是别名，`--remote 3000 --local 8080` 用参数表达同样的意思。

转发本质上是带 instabox 证书的 `ssh -N -L`，因此可以到达任何 TCP 服务。默认只监听 `127.0.0.1`，只有你能使用；如果想让别人访问，请发布端口，见[端口与预览 URL](./ports)。

## 用 mosh 保持会话

[mosh](https://mosh.org) 能在休眠、网络切换和丢包中保持会话。先在本机安装（macOS：`brew install mosh`），然后运行 `instabox mosh dev`，或使用 **Create token** 给出的 mosh 命令。

在 mosh 加入之前创建的快照所生成的机器上，先执行一次 `sudo apt install mosh`。

## 粘贴图片

在 macOS 上使用 `instabox ssh`，或在 Linux 上装了 `xclip` / `wl-paste` 时，剪贴板里有 PNG 图片时按 Ctrl+V，CLI 会把图片上传到机器的 `/tmp` 并粘贴它的路径，Claude Code 会当作图片附件读取。

`--no-paste` 或 `INSTABOX_NO_PASTE=1` 可以让 Ctrl+V 照常传给 vim 或 readline。

## 传大文件用 CLI，而不是 scp

大文件上传请用 `instabox push` 或 `instabox cp`。它们走 HTTP API，64 MiB 以上的文件会拆成 4 个并行 PUT。scp 或 rsync 走 `ssh.instabox.sh` 时每个连接大约只有 2 MiB 在途，距离越远越慢。

## 工作原理

instabox 网关终结 SSH。一次连接是 `ssh -p <port> <machine-id>@<host>`，使用短期用户证书，以及一行信任网关的 `known_hosts` 记录：`@cert-authority [<host>]:<port> <host CA key>`。网关也中继 mosh 的 UDP，所以只需要网关可达。

- **支持**：会话（pty、shell、exec、subsystem、env、信号）和本地端口转发。
- **不支持**：agent forwarding、X11 和远程转发。
- 机器停止、暂停或被删除时，连接会关闭。

## 相关

- [端口与预览 URL](./ports)
- [桌面与浏览器](./desktop)
- [CLI 参考](./cli)
