# 桌面与浏览器

> 观看机器的桌面、让 Agent 驱动它，或分享一个链接。

从 `agent-browser` 模板创建的机器（控制台显示为 **standard**）带 Linux 桌面和浏览器。在控制台打开一台机器并选择 **Computer** 标签即可观看。点击桌面可以接管操作；一分钟没有输入，或关闭标签页 30 秒后，控制权交回 Agent。

## 让 Agent 驱动桌面

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('agent-browser')
await sbx.desktop.start({ width: 1280, height: 800 })

await sbx.desktop.open('https://example.com')        // 打开浏览器
const png = await sbx.desktop.screenshot()           // PNG 字节，可直接给视觉模型
await sbx.desktop.click(640, 400)                    // { button: 'right' }, { double: true }
await sbx.desktop.press(['ctrl', 'l'])               // 单个键或组合键
await sbx.desktop.type('instabox.sh')                // 任意文本，包括引号和 Unicode
await sbx.desktop.press('Enter')
await sbx.desktop.scroll({ direction: 'down', amount: 5 })
```

其他调用还有 `move(x, y)`、`drag([x1, y1], [x2, y2])`、`cursorPosition()` 和 `status()`。`start()` 可以重复调用，已经在运行的桌面不会被重置。

## 一个最小的 Agent 循环

```ts
for (let step = 0; step < 20; step++) {
  const png = await sbx.desktop.screenshot()
  const action = await yourModel.nextAction(png)   // { type: 'click', x, y } | { type: 'type', text } | { type: 'done' }
  if (action.type === 'done') break
  if (action.type === 'click') await sbx.desktop.click(action.x, action.y)
  if (action.type === 'type') await sbx.desktop.type(action.text)
}
```

## 分享桌面链接

`streamUrl()` 生成一个指向单台机器桌面的全屏观看链接。链接不需要登录，可以嵌进 `<iframe>`。

```ts
const { url, expiresAt } = await sbx.desktop.streamUrl({
  viewOnly: true,        // 默认：只能看，不能点击和输入
  ttlSeconds: 3600,      // 60 到 86400，默认一小时
})
```

```html
<iframe src="LINK_URL" width="1280" height="800" style="border:0"></iframe>
```

- **只对一台机器生效。** 链接只打开那台机器的桌面，它不是 API key，不能调用 API。
- **只读由服务端强制。** 只读链接的键盘、鼠标和剪贴板输入永远不会到达机器。传 `viewOnly: false` 才能操作。
- **过期阻止新连接。** 已经连接的观看者会保持连接直到离开。
- **吊销结束一切。** `revokeStreamUrls()` 让该机器的所有链接失效，并在几秒内关闭已打开的观看者。删除机器也会如此。

> 警告：链接属于机器的创建者。只有创建者（登录状态或使用个人 key）可以创建或吊销链接。工作区 API key 或其他成员会得到 `403 permission_denied`。

没有链接时还有两种方式，两者都能用工作区 key：

- 通过 `GET /v1/machines/{id}/vnc` 打开桌面，这是 VNC over WebSocket，可以接 noVNC 之类的查看器，需要 `machines:write`。
- 用 `sbx.desktop.screenshot()` 读取屏幕。

## 为自己的用户做一个服务

把 API key 留在服务器上，绝不放进浏览器。用户每次打开桌面时生成新链接，访问结束时吊销。链接属于创建者，所以这个服务要用创建机器的那个账号的个人 key 运行，并且用它创建机器。

```ts
// 你的服务器，例如 Express
app.get('/api/desktop-link', async (req, res) => {
  const machineId = await machineOf(req.user)       // 你自己的用户与机器映射
  const sbx = await Sandbox.connect(machineId)
  res.json(await sbx.desktop.streamUrl({ viewOnly: !req.user.canControl, ttlSeconds: 600 }))
})

// 用户访问结束时
await (await Sandbox.connect(machineId)).desktop.revokeStreamUrls()
```

之后可以用 `Sandbox.list({ metadata })` 找到机器，创建时打上 `{ customer: 'acme' }` 之类的标签即可。

每个用户最多同时有 8 个终端和桌面连接，工作区 key 按工作区所有者计算。第 9 个 `/vnc` 连接会得到可重试的 `429 quota_exceeded`，所以用户离开时请关闭连接。

## 用 HTTP 启动并分享桌面

```bash
H="X-API-Key: $INSTABOX_API_KEY"
# universal 和 t3 没有桌面：先安装，再等待安装完成（大约半分钟）
curl -s -H "$H" -H 'Content-Type: application/json' \
  -d '{"action": "install"}' "https://api.instabox.sh/v1/machines/m_.../desktop"

curl -s -H "$H" -H 'Content-Type: application/json' \
  -d '{"action": "start", "width": 1280, "height": 800}' "https://api.instabox.sh/v1/machines/m_.../desktop"

curl -s -H "$H" -H 'Content-Type: application/json' \
  -d '{"viewOnly": true, "ttlSeconds": 3600}' "https://api.instabox.sh/v1/machines/m_.../desktop/stream"

curl -s -X DELETE -H "$H" "https://api.instabox.sh/v1/machines/m_.../desktop/stream"   # 吊销
```

通过 HTTP 时 `start` 不会安装任何东西。在没有桌面的模板（`universal`、`t3`）上，先发 `{"action": "install"}`，轮询 `{"action": "status"}` 直到 `installed` 为 true，再 `start`。

## 相关

- [TypeScript SDK](./sdk)
- [端口与预览 URL](./ports)
- [核心概念](./concepts)
