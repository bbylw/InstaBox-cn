# macOS 机器

> macOS 26 Tahoe + Xcode，租用一整台 Mac，至少 24 小时。

macOS 机器运行 macOS 26 Tahoe 并预装 Xcode，宿主是租给工作区至少 24 小时的 Mac。需要 Pro 套餐及以上。

```bash
instabox create --name mac --template macos --accept-24h-minimum
```

创建时必须接受 24 小时最短租期，否则返回 `400 minimum_lease_required`；在终端里 CLI 会询问后再发一次，在 Agent 或 CI 中则直接失败。

## 价格与 24 小时最短租期

Apple 的许可要求一台 Mac 一次只租给一个客户、至少 24 小时，因此你的工作区租下整台 Mac，并为它的全部 vCPU 付费：

- **macOS 附加费 $0.158 / vCPU·小时**，在常规价格之外。
- **最短 24 小时**：即使提前关机或删除也要付。
- 24 小时后按秒计费，直到机器关机。
- 机器自身在运行时照常收 vCPU、内存费用，磁盘按存储计费。

## 机型

一台 macOS 机器占用一整台 Mac，规格就是这台 Mac 的完整规格。用 `--model` 选择，省略时使用模板的第一个机型。

| 机型 | `--model` |
| --- | --- |
| M2 Pro | `m2pro` |
| M4 Pro | `m4pro` |
| M4 | `m4` |
| M2 | `m2` |

```bash
instabox create --name mac --template macos --model m4pro --accept-24h-minimum
```

`instabox templates`（或 `GET /v1/templates` 的 `models`）与控制台的 **Resources** 会显示每个机型的 vCPU 与内存，每小时 macOS 费用等于 vCPU 数乘以 $0.158。

没有空闲机型时创建会立即返回 `503 no_capacity`，不会创建机器；控制台会把该机型置灰。

## 环境变量

```bash
instabox create --name mac --template macos \
  --env API_URL=https://example.com --accept-24h-minimum
```

登录 Shell、`exec` 和桌面里的终端都能看到。zsh 保留了一些名字（例如 `PATH`、`HOME`、`status`），设置它们会被拒绝；需要时为单条 `exec` 用 `--env`。

## 在最短租期内关机或删除

反正都要付满 24 小时，因此在最短租期内关机或删除会被**预约**：机器继续运行，到最短租期结束时才真正关机或删除。

## 套餐要求

只有 Pro 及以上可以创建 macOS 机器。Free 套餐返回 `403 template_not_allowed`，控制台会把 **macOS 26 Tahoe** 列在 **Get Pro to Unlock** 下。

## 常见错误

| 错误 | 含义 |
| --- | --- |
| `400 minimum_lease_required` | 创建时没有接受最短租期 |
| `400 bad_request` | 环境变量名被 zsh 保留 |
| `403 template_not_allowed` | 工作区是 Free 套餐 |
| `402 spend_limit_reached` | 本月消费上限不足以覆盖最短租期 |
| `402 subscription_required` | 套餐会在最短租期结束前到期 |
| `503 no_capacity` | 该机型暂时没有空闲 Mac |

## 其他行为

- 关机后磁盘保留；租期结束后再启动会开始新的租期和新的 24 小时最短租期，启动、分叉、从 macOS 快照创建都需要再次接受。
- macOS 机器**不能暂停**，空闲时也不会自动暂停；它会一直运行到你关机或达到最大运行时长。

## 相关

- [规格与创建参数](./sizes)
- [自动暂停与最大运行时长](./auto-pause)
- [定价与用量](./pricing)
