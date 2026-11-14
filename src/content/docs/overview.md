# InstaBox 概览

> 为每个 Agent 提供一台属于它自己的云上 Linux 计算机。

InstaBox 给每个 Agent 一台完整的云上 Linux 虚拟机：独立内核、root 权限和 Docker。文件与已安装的软件在会话之间保留；机器空闲时会自动暂停，所以你只为真正运行的时间付费。

```bash
npx instabox@latest sh
```

这条命令会完成登录、安装 `instabox` CLI，并在你的第一台机器上打开一个 Shell。

## 它解决什么问题

长时间运行的 Agent 需要的东西，传统沙箱往往给不了：

- **后台进程要活得久。** 安装依赖、跑 dev server、等待测试，这些都不是一次请求能完成的事。
- **环境要留得住。** 下次开工时仓库、依赖、登录状态还在，而不是从头再来一遍。
- **权限要够。** 原生 Docker、systemd、`sudo`，而不是被裁剪过的用户空间。
- **成本要可控。** Agent 大部分时间在等待，等待的时候不应该按满配收费。

## 你可以用它做什么

| 场景 | 说明 |
| --- | --- |
| 编码 Agent | 给 Claude Code、Codex 或 OpenCode 一台独立机器，在你的仓库里干活。 |
| 运行模型生成的代码 | 把模型写出的代码放进机器执行，再把输出交回给模型。 |
| 计算机使用 | 让模型驱动机器里的浏览器和桌面，你随时可以接管。 |
| 预览 URL | 把机器里的 dev server 变成一个可以分享的 HTTPS 地址。 |
| 并行实验 | 一次配置，分叉出多台机器，各试一种实现。 |
| CI 与测试 | 在全新机器上跑一条测试命令或 GitHub Actions 任务。 |

## 接下来

- [快速开始](./quickstart)：安装 CLI，启动第一台机器。
- [核心概念](./concepts)：机器、模板、快照与操作。
- [TypeScript SDK](./sdk)：用代码创建、暂停和删除机器。
- [MCP](./mcp)：让 Claude Code、Cursor、Codex 直接操作机器。

> 提示：英文原版文档的每个页面都可以在 URL 后加 `.md` 得到 Markdown 原文，整站索引位于 `/llms.txt` 和 `/llms-full.txt`。
