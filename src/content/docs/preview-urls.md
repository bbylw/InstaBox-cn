# 预览 URL

> 在机器里跑应用，把 HTTPS 链接发给任何人。

机器里运行的应用只有别人能打开才有用：评审、手机、或者需要回调的服务。这篇把 dev server 变成一个可以分享的 HTTPS 地址；应用还没准备好公开时，可以只给拿到链接的人。

## 1. 把应用放进机器

```bash
instabox create --name dev
cd my-app
instabox push dev .
```

`push` 会报告推了多少文件到 `dev:/data/home/my-app`。

## 2. 启动 dev server

用后台任务启动，命令返回后服务继续运行。下面假设服务监听 3000：

```bash
instabox exec --background dev \
  --cwd /data/home/my-app -- npm run dev
```

命令会打印 job ID 和跟随日志的命令：

```bash
instabox jobs logs dev <job-id> -f
```

## 3. 发布端口

```bash
instabox port publish dev 3000 --name 'Web app'
```

会打印 URL，形式如下，直到取消发布都不会变：

```text
https://<port>-<machine id without m_>.<domain>/
```

> 警告：公开 URL 不是秘密。在你取消发布前，任何人都能访问整个服务。

## 4. 分享

在浏览器打开打印出的 URL，请求会转发到机器里 3000 端口的服务。把链接发给需要的人或服务。

## 5. 结束后移除

```bash
instabox port ls dev          # 当前发布的端口、访问级别与 URL
instabox port unpublish dev 3000
```

取消发布会移除 URL 并关闭已建立的连接。

自行空闲暂停的机器会被访问唤醒；**手动暂停**的机器保持离线，直到你恢复。

## 私有链接

只允许拿到链接的人访问时，用私有端口。私有端口只有带 token 的链接能打开，命令会打印带 `?_token=` 的链接：

```bash
instabox port publish dev 3000 --private
```

浏览器打开后会获得 cookie 并转到普通 URL，WebSocket 同样可用；脚本改用 `Authorization: Bearer ibp_...` 请求头，其他请求返回 `401`。

链接泄露后可以轮换 token，旧链接立即失效：

```bash
instabox port publish dev 3000 --private --rotate-token
```

不需要公开或私有链接时，可以只转发到自己的电脑，见 [SSH](./ssh)。

## 从机器内部发布

Agent 在机器里可以用 `instabox-port` 自己发布端口，把链接交给你：

```bash
instabox-port publish 3000 --name 'Web app'
```

机器里没有这个命令时，在自己的电脑上安装：

```bash
instabox port setup dev
```

## 限制

- 每台机器最多 16 个公开端口。
- 响应头有大小限制。
- 公开端口使用平台域名，不能自定义域名。
- 端口不会随机器删除而保留；机器删除后链接失效。

## 相关

- [端口与预览 URL](./ports)
- [自动暂停与最大运行时长](./auto-pause)
- [CI](./ci)
