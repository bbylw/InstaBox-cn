# 快速开始

> 安装 CLI，一分钟内启动第一台机器。

完成这三步后，你会得到一台名为 `dev` 的机器、一个进入它的 Shell，以及暂停、恢复和删除它的命令。

## 1. 安装 CLI

```bash
npx instabox@latest
```

命令会完成登录、安装 `instabox` CLI，并把 InstaBox 的 skills 添加给你的编码 Agent。

## 2. 启动一台机器

```bash
instabox create --name dev
instabox ssh dev                 # 打开一个 Shell
instabox exec dev -- uname -a    # 或者只跑一条命令
```

也可以直接让你的 Agent "创建一台 instabox 机器并把我送进去"。

## 3. 暂停或删除机器

```bash
instabox suspend dev    # 暂停：文件、内存与进程都保留
instabox resume dev     # 从上次的位置继续
instabox rm dev         # 删除机器及其文件
```

> `npx instabox@latest sh` 可以把前两步一次完成：登录、安装 CLI，并直接给你一个机器上的 Shell。

## 第一次进入机器时

机器以 `dev` 用户登录，HOME 是 `/data/home`，`/data` 之外是系统盘。默认的 `agent-browser` 模板自带桌面和浏览器，并预装了常用的 Agent 工具。

```bash
whoami            # dev
pwd               # /data/home
docker run hello-world
sudo systemctl status
```

## 常见的第一步

### 跑一个仓库

```bash
git clone https://github.com/your/repo.git
cd repo
npm install
npm run dev
```

然后在另一个终端把 3000 端口发布出去：

```bash
instabox port publish dev 3000
```

### 让 Agent 在里面工作

```bash
instabox ssh dev
claude            # 或 codex、opencode
```

Agent 的文件、依赖和登录状态都会留在这台机器上，直到你删除它。

## 接下来

- [核心概念](./concepts)：机器状态、模板和快照。
- [SSH](./ssh)：从任意终端连接，或转发端口。
- [TypeScript SDK](./sdk)：把同样的步骤写进你的应用。
