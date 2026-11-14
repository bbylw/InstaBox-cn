# ADE

> 让 cmux、Orca、Paradev 或 T3 Code 连接到机器，而不是你的笔记本。

浏览网页版、跑测试、开多个终端，这些都能在机器里完成。ADE（Agent Development Environment）通过 SSH 连接远程主机，所以只要把机器的 SSH 配置交给它即可。

## 通用准备

```bash
instabox create --name dev
instabox ssh-config dev          # 打印可直接粘贴的 ~/.ssh/config 片段
```

或者直接连接：

```bash
instabox ssh dev
```

机器的家目录是 `/data/home`，仓库通常放在这里：

```bash
instabox push dev .
instabox exec dev --cwd /data/home/my-repo -- npm ci
```

## cmux

cmux 通过 SSH 打开远程工作区。把 `instabox ssh-config dev` 的输出加入 `~/.ssh/config`，然后在 cmux 里添加远程主机 `instabox-dev`（Host 别名），选择 `/data/home/my-repo` 作为工作目录。

## Orca

Orca 同样使用 SSH 远程工作区。添加主机时选择 **SSH**，填入 `instabox ssh-config` 给出的 Host、Port、User，认证使用 CLI 生成的证书（`instabox ssh` 会自动处理，证书过期后用 `instabox ssh-cert dev` 刷新）。

## Paradev

Paradev 的远程模式需要一台可通过 SSH 访问的 Linux 主机。用 `instabox ssh-config dev` 添加主机，工作目录指向 `/data/home`。如果要预览端口，在机器里运行 `instabox port publish dev 3000`，把打印的 URL 填进 Paradev 的预览地址。

## T3 Code

T3 Code 支持 SSH 目标。添加远程主机时填 `ssh-config` 里的别名，然后选择仓库目录。为了让 Agent 能持续运行，建议让 T3 Code 在 `tmux` 或 `mosh` 会话里运行：

```bash
instabox ssh dev
tmux new -s t3
```

断线后重新连接：

```bash
instabox ssh dev
tmux attach -t t3
```

## 长连接与断线

- `instabox mosh dev` 能在休眠、切网和丢包时保持会话。
- SSH 连接在机器暂停、关机或删除时关闭；恢复后重新连接即可。
- ADE 自己管理的后台进程会在断线后继续运行；需要跨重启保留时放进 `tmux`，或配置为 systemd 服务。

## 端口与预览

在机器里启动的服务不会自动暴露。需要给 ADE 或同事一个地址时：

```bash
instabox port publish dev 3000 --name 'ADE preview'
instabox port ls dev
```

不需要公开时用 `instabox port-forward dev 3000`，只转发到本机。

## 凭据

ADE 里的 Agent 需要的 API key 用 [Org Secrets](./secrets) 注入，不要让它们出现在 ADE 的配置文件里。需要登录文件的工具（如 OpenCode 的 `auth.json`）用 [Direct Secrets](./direct-secrets)。

## 相关

- [SSH](./ssh)
- [桌面与浏览器](./desktop)
- [编码 Agent](./coding-agents)
