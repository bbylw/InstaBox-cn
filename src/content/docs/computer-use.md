# 计算机使用

> 给 Agent 一块桌面和浏览器，实时观看，或把屏幕分享出去。

需要看屏幕、用鼠标键盘的 Agent，需要一块真正的桌面。每台 `agent-browser` 机器（默认模板）都有 Linux 桌面和浏览器。代码截图、点击、输入。

## 1. 安装 SDK

```bash
npm install @insforge/instabox-sdk
export INSTABOX_API_KEY=ibk_...
```

key 只放在你的服务器上，永远不要放进浏览器。

## 2. 启动桌面

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('agent-browser')
await sbx.desktop.start({ width: 1280, height: 800 })   // 重复调用安全
await sbx.desktop.open('https://example.com')           // 打开浏览器
```

## 3. 让模型操作

```ts
for (let step = 0; step < 20; step++) {
  const png = await sbx.desktop.screenshot()            // PNG 字节，交给视觉模型
  const action = await yourModel.nextAction(png)        // click / type / done
  if (action.type === 'done') break
  if (action.type === 'click') await sbx.desktop.click(action.x, action.y)
  if (action.type === 'type') await sbx.desktop.type(action.text)
}
```

桌面还支持：

```ts
await sbx.desktop.press('Enter')
await sbx.desktop.press(['ctrl', 'l'])
await sbx.desktop.scroll({ direction: 'down', amount: 5 })
await sbx.desktop.move(640, 400)
await sbx.desktop.drag([100, 100], [400, 300])
await sbx.desktop.click(640, 400, { button: 'right' })
await sbx.desktop.click(640, 400, { double: true })
await sbx.desktop.cursorPosition()
await sbx.desktop.status()
```

## 4. 观看与接管

在控制台打开机器，选择 **Computer** 标签，就能看到桌面并实时观看。点击桌面即可接管；一分钟没有输入，或关闭标签 30 秒后，控制权回到 Agent。

## 5. 分享链接

```ts
const { url, expiresAt } = await sbx.desktop.streamUrl({
  viewOnly: true,     // 默认：只能看，不能操作
  ttlSeconds: 3600,   // 60 到 86400，默认一小时
})
```

链接是全屏观看器，不需要登录，**不是 API key**。`sbx.desktop.revokeStreamUrls()` 会结束所有链接并在几秒内关闭观看者。

> 警告：链接属于机器的创建者。只有创建者（登录或使用个人 key）可以创建和吊销；工作区 key 会得到 `403 permission_denied`，应改用 `GET /v1/machines/{id}/vnc` 中继。

## 为自己的用户提供桌面

每次用户打开桌面时，在服务器上生成新链接，并在权限结束时吊销：

```ts
app.get('/api/desktop-link', async (req, res) => {
  const machineId = await machineOf(req.user)
  const sbx = await Sandbox.connect(machineId)
  res.json(await sbx.desktop.streamUrl({
    viewOnly: !req.user.canControl,
    ttlSeconds: 600,
  }))
})
```

每个用户同时最多 8 个终端与桌面；工作区 key 视为该工作区的 owner。

## 直接调用 HTTP

```bash
H="X-API-Key: $INSTABOX_API_KEY"
curl -s -H "$H" -H 'Content-Type: application/json' \
  -d '{"action": "start", "width": 1280, "height": 800}' \
  "$INSTABOX_API_URL/v1/machines/m_.../desktop"

curl -s -H "$H" -H 'Content-Type: application/json' \
  -d '{"viewOnly": true, "ttlSeconds": 3600}' \
  "$INSTABOX_API_URL/v1/machines/m_.../desktop/stream"

curl -s -X DELETE -H "$H" \
  "$INSTABOX_API_URL/v1/machines/m_.../desktop/stream"
```

## 相关

- [桌面与浏览器](./desktop)
- [TypeScript SDK](./sdk)
- [Android 应用](./android)
