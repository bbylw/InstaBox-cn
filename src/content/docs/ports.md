# 端口与预览 URL

> 给机器里的 Web 服务一个 HTTPS 地址：公开给所有人，或只给拿到链接的人。

发布端口会给机器里的 Web 服务器一个独立的 HTTPS URL。你可以在浏览器里打开应用、分享给同事，或让 webhook 指向它。

选择谁能访问：

- **公开（public）**：拿到 URL 的人都能访问。适合演示或接收 webhook。
- **私有（private）**：只有你发链接的人能访问。适合还没准备好公开的工作。

```bash
instabox port publish dev 3000
```

命令会打印 URL。在你取消发布之前，这个 URL 保持不变。

```text
https://<port>-<不带 m_ 的机器 ID>.<domain>/
```

请求先到 InstaBox 代理，再由代理转发给机器里那个端口的服务。私有端口会先检查请求是否带着该端口的 token。

## 发布端口

默认是公开端口，拿到 URL 的人都能打开。发布只是创建 URL，不会启动服务，所以先把服务跑在那个端口上。可以给端口起个名字，方便在列表里区分。

```bash
instabox port publish dev 3000 --name 'Web app'
```

```bash
# 在机器内部
instabox-port publish 3000 --name 'Web app'
```

```bash
curl -X POST https://api.instabox.sh/v1/machines/m_.../ports \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"port": 3000, "name": "Web app"}'
```

也可以在控制台机器详情的 **Ports** 标签里发布和取消发布。

> 警告：URL 不是秘密。公开端口会让任何人访问整个服务，直到你取消发布。

## 把端口设为私有

私有端口只响应带着 token 的请求。发布时会打印一个包含 token 的链接，链接只显示一次。

```bash
instabox port publish dev 3000 --private
```

```bash
curl -X POST https://api.instabox.sh/v1/machines/m_.../ports \
  -H "X-API-Key: $INSTABOX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"port": 3000, "access": "private"}'
```

API 响应里的链接是 `tokenUrl` 字段。

- **浏览器**：打开一次链接即可，链接会写入 cookie，之后这个浏览器的所有请求（包括 WebSocket）都能通过。
- **脚本**：在 `Authorization: Bearer ibp_…` 头里带上 token。

不带 token 的请求会得到 `401`，而且不会唤醒暂停中的机器。

## 更换私有链接

如果链接泄露给了不该有的人，轮换 token 会生成新链接。旧链接立即失效，使用它的连接也会被关闭。

```bash
instabox port publish dev 3000 --private --rotate-token
```

应用准备好公开时，用 `--public` 重新发布即可（API 里是 `"access": "public"`）。

## 列出与取消发布

```bash
instabox port ls dev
```

```bash
curl https://api.instabox.sh/v1/machines/m_.../ports \
  -H "X-API-Key: $INSTABOX_API_KEY"
```

不再需要访问时取消发布。取消发布移除 URL 并关闭其上已打开的连接。

```bash
instabox port unpublish dev 3000
```

```bash
curl -X DELETE https://api.instabox.sh/v1/machines/m_.../ports/3000 \
  -H "X-API-Key: $INSTABOX_API_KEY"
```

## 直接把一个目录变成网页

在机器内部工作时，Agent 常常想展示一个结果，比如它生成的报告。`instabox-port serve` 会为一个含 `index.html` 的目录启动静态服务器并一步发布。

```bash
instabox-port serve ./report --port 8080
```

如果机器里没有 `instabox-port`，运行 `instabox port setup dev` 安装。

## 访问暂停中的机器

访问 URL 会唤醒因空闲 30 分钟而自行暂停的机器。请求会等待恢复完成，所以手机应用或 webhook 不需要先启动机器。`instabox wake dev` 能在不发请求的情况下做同样的事。

你**手动**暂停或关机的机器则保持离线，直到你恢复或启动它。之后 URL 不变；关机再启动后，需要重新启动你的服务。

## 只从你自己的电脑访问端口

服务完全不应该有 URL 时，可以走 SSH 转发，在本机访问它。这适用于任何 TCP 服务，比如数据库或调试器。

```bash
instabox port-forward dev 8080:3000
```

## 限制

- 每台机器最多 16 个已发布端口。
- 可以发布 1024 到 65535 之间的端口。桌面端口 5901 和 Orca 端口 6768 被保留。
- 私有链接只显示一次，因为服务器只保留 token 的哈希。轮换 token 才能拿到新链接。
- 重命名私有端口仍然是私有的；用 `--public` 设为公开会丢弃 token。
- 私有链接以 `?_token=ibp_…` 携带 token。打开后会写入 cookie `__Host-instabox_port_auth` 并跳转到不带参数的 URL。
- 响应头（状态行和所有字段）最大 24 KiB。超大的响应会得到平台的 `502` 页面。

## 相关

- [SSH](./ssh)
- [桌面与浏览器](./desktop)
- [API 概览](./api)
