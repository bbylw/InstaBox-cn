# Agent 自助注册

> 没有浏览器的 Agent 自己注册，打印一个验证码，账号所有人事后批准。

没有 InstaBox 凭据、也没人守在键盘前的 Agent 可以自行注册：它打印一个验证码给账号所有人，然后继续工作。所有人从任意设备批准后，Agent 就持有一把该账号的普通 [API key](./api-keys)，范围由所有人授予。

## 1. Agent 注册

```bash
instabox login --agent
# 或者指定名称、scope 和有效期
instabox login --agent --name 'claude on ci' \
  --scope machines:read,machines:write --expires-in-days 30
```

默认名称是 `agent@<hostname>`，默认 scope 是 `machines:read machines:write machines:delete images:read`。命令会打印领取页面和验证码：

```text
Ask the account owner to approve it:
  open https://dashboard.instabox.sh/dashboard/claim?code=KFXR-7Q2M
  (or https://dashboard.instabox.sh/dashboard/claim and enter the code KFXR-7Q2M)
Waiting for the account owner to approve…
```

把页面和验证码转给人，然后等待。验证码 **24 小时**内有效。

## 2. 所有人批准

打开页面，如果未登录，先用 GitHub 或 Google 登录，页面会回到领取流程。页面显示 Agent 的名称、注册时间与来源地址，以及它申请的权限。取消不需要的权限，然后选择 **Approve** 或 **Deny**。

也可以在自己的电脑上批准：

```bash
instabox claim KFXR-7Q2M                     # 显示申请内容，然后询问
instabox claim KFXR-7Q2M --scope machines:read --expires-in-days 7 --yes
instabox claim KFXR-7Q2M --deny
```

## 3. Agent 继续

批准后命令自行结束，key 保存在 `~/.config/instabox/credentials.json`，之后所有 `instabox` 命令都会使用它。

> 警告：只批准你自己启动的 Agent。key 会以 Agent 的名字出现在 **API keys** 页面；Agent 完成后在页面或 `instabox keys rm` 吊销。

批准前，Agent 没有账号也没有凭据，读不到也创建不了任何东西。它规划所需的模板、规格、价格与限制都在文档和 `/llms.txt` 中。Agent 的 key 永远不能管理 key、工作区或账单。一个账号最多 20 把有效 key。

## 等待、恢复与失败

- `--no-wait` 打印页面和验证码后退出；`--json` 以 JSON 输出。
- 再次运行 `instabox login --agent` 会继续同一个注册，而不是打印第二个验证码。
- 被拒绝或验证码过期会报错，需要重新注册。
- 无法保存 key（例如磁盘已满）时会提示，但不打印 key，并以非零状态退出。
- 10 分钟内重跑，服务端会交出同一把 key；10 分钟内既未使用也未保存的 key 会被吊销。

> 注意：`--json` 会输出密钥本身，`--no-wait --json` 会输出领取 token。不要把输出留在日志或对话记录里。

## 通过 HTTP

`POST /v1/auth/agent` 接受 `{"name", "email", "scopes", "expiresInDays"}`，全部可选，返回 `claimToken`、`userCode`、`verificationUri`、`verificationUriComplete`、`interval` 与 `expiresIn`。

按 `interval` 轮询 `POST /v1/auth/agent/token`，请求体 `{"claimToken"}`。未决定时返回 `400` 和 `authorization_pending`；轮询过快是 `slow_down`（服务端把间隔加 5 秒）；过期是 `expired_token`；被拒绝是 `access_denied`。批准后一次性返回 `200`，包含 `key`（`ibk_...`）、`apiKey`（ID、名称、scope）、账号的 `userId` 与 `login`，之后用 `X-API-Key` 发送 key。

## 相关

- [API Keys](./api-keys)
- [MCP](./mcp)
- [编码 Agent](./coding-agents)
