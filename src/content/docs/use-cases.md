# 用例

> 从运行模型生成的代码到 CI，一步一步的实战指南。

每篇指南都从零走到可运行的结果，包含中间的每条命令或每段代码。挑一个最接近你要做的事。

## 构建 Agent

| 指南 | 你会得到 |
| --- | --- |
| [运行 AI 生成的代码](./run-ai-code) | 让模型写的代码在独立机器里执行，再把输出交回模型 |
| [编码 Agent](./coding-agents) | 让 Claude Code、Codex 或 OpenCode 在你的仓库里干活，密钥不落进机器 |
| [计算机使用](./computer-use) | 给 Agent 一块桌面和浏览器，实时观看或分享屏幕 |
| [并行分叉](./parallel-forks) | 配置一台机器，复制多份，各试一种方案，留下最好的 |

## 发布与测试

| 指南 | 你会得到 |
| --- | --- |
| [预览 URL](./preview-urls) | 在机器里跑应用，把 HTTPS 链接发给别人 |
| [CI](./ci) | 在全新机器上跑 GitHub Actions job，或从任意 CI 执行一条命令 |
| [Android 应用](./android) | 在 Android 14 上安装并用 adb 测试应用，还能看到手机画面 |

## 接入你的工具

| 指南 | 你会得到 |
| --- | --- |
| [ADE](./ade) | 让 cmux、Orca、Paradev 或 T3 Code 连到机器而不是你的笔记本 |
| [MCP](./mcp) | 让 Claude Code、Cursor、Codex 把机器当作工具调用 |

## 共同的前提

所有指南都假设你已经登录并安装了 CLI：

```bash
npx instabox@latest
instabox create --name dev
```

程序化调用需要一把 API key，见 [API Keys](./api-keys)。机器默认空闲 30 分钟后暂停，唤醒是自动的，见 [自动暂停与最大运行时长](./auto-pause)。
