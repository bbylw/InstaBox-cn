export type DocPage = {
  slug: string
  title: string
  description: string
}

export type DocGroup = {
  title: string
  pages: DocPage[]
}

export const docGroups: DocGroup[] = [
  {
    title: '开始使用',
    pages: [
      { slug: 'overview', title: '概览', description: 'InstaBox 是什么，以及它适合用来做什么。' },
      { slug: 'quickstart', title: '快速开始', description: '安装 CLI，一分钟内启动第一台机器。' },
      { slug: 'concepts', title: '核心概念', description: '机器、模板、快照与操作。' },
    ],
  },
  {
    title: '用例',
    pages: [
      { slug: 'use-cases', title: '用例总览', description: '从运行模型代码到 CI 的实战指南。' },
      { slug: 'run-ai-code', title: '运行 AI 生成的代码', description: '在独立机器里执行模型的代码并取回结果。' },
      { slug: 'coding-agents', title: '编码 Agent', description: '让 Claude Code、Codex、OpenCode 在机器里工作。' },
      { slug: 'computer-use', title: '计算机使用', description: '给 Agent 桌面和浏览器，观看或分享屏幕。' },
      { slug: 'parallel-forks', title: '并行分叉', description: '复制多台机器，各试一种方案。' },
      { slug: 'preview-urls', title: '预览 URL', description: '把机器里的服务变成可分享的 HTTPS 链接。' },
      { slug: 'ci', title: 'CI', description: '在全新机器上运行 GitHub Actions job 或任意 CI 命令。' },
      { slug: 'android', title: 'Android 应用', description: '在 Android 14 上安装并用 adb 测试应用。' },
      { slug: 'ade', title: 'ADE', description: '让 cmux、Orca、Paradev、T3 Code 连接到机器。' },
    ],
  },
  {
    title: '机器',
    pages: [
      { slug: 'lifecycle', title: '生命周期', description: '启动、暂停、恢复、关机、重启与删除。' },
      { slug: 'sizes', title: '规格与创建参数', description: 'vCPU、内存、磁盘与 create 的每个字段。' },
      { slug: 'run-commands', title: '运行命令', description: '执行、流式输出、后台任务与执行历史。' },
      { slug: 'files', title: '文件', description: '上传、下载、读写与路径规则。' },
      { slug: 'snapshots', title: '快照与分叉', description: '保存一次，用快照或分叉复制出更多机器。' },
      { slug: 'auto-pause', title: '自动暂停与最大运行时长', description: '空闲暂停、唤醒条件与冷却时间。' },
      { slug: 'storage', title: '存储与保留', description: '数据保留多久，以及归档与删除截止时间。' },
      { slug: 'environment', title: '环境变量', description: '为机器设置普通变量，以及凭据应该放哪里。' },
      { slug: 'logs-and-labels', title: '日志与标签', description: '读取控制台日志与操作，用标签筛选机器。' },
      { slug: 'custom-images', title: '自定义镜像', description: '把 Docker / OCI 镜像导入成快照。' },
      { slug: 'macos', title: 'macOS 机器', description: 'macOS 26 Tahoe + Xcode，租用整台 Mac。' },
      { slug: 'webhooks', title: 'Webhooks', description: '机器状态变化时发送签名事件。' },
    ],
  },
  {
    title: '访问机器',
    pages: [
      { slug: 'ssh', title: 'SSH', description: '打开 Shell、执行命令、转发端口。' },
      { slug: 'ports', title: '端口与预览 URL', description: '给机器里的 Web 服务一个 HTTPS 地址。' },
      { slug: 'desktop', title: '桌面与浏览器', description: '观看并接管机器的桌面，或让 Agent 自己操作。' },
    ],
  },
  {
    title: '安全与账户',
    pages: [
      { slug: 'secrets', title: 'Org Secrets', description: '真实凭据不落到机器里的密钥管理方式。' },
      { slug: 'direct-secrets', title: 'Direct Secrets', description: '把凭据的真实值放进变量或文件。' },
      { slug: 'api-keys', title: 'API Keys', description: '创建 key、选择 scope、确认所属工作区。' },
      { slug: 'agent-sign-up', title: 'Agent 自助注册', description: '没有浏览器的 Agent 自行注册，由你批准。' },
      { slug: 'pricing', title: '定价与用量', description: '套餐、包含额度和每一项单价。' },
      { slug: 'billing', title: '账单与用量', description: '本月费用、信用额度与消费上限。' },
      { slug: 'limits', title: '限制', description: '机器数、规格、磁盘、快照与速率限制。' },
    ],
  },
  {
    title: '集成与开发',
    pages: [
      { slug: 'mcp', title: 'MCP', description: '让 Claude Code、Cursor、Codex 直接操作机器。' },
      { slug: 'sdk', title: 'TypeScript SDK', description: '用代码创建、执行、暂停和删除机器。' },
      { slug: 'python-sdk', title: 'Python SDK', description: '用 Python 完成同样的操作。' },
    ],
  },
  {
    title: '参考',
    pages: [
      { slug: 'cli', title: 'CLI 参考', description: 'instabox 命令与常用参数。' },
      { slug: 'errors', title: '错误码', description: 'HTTP 状态、错误 code 与处理方式。' },
      { slug: 'api', title: 'API 概览', description: '基础地址、鉴权、操作与错误处理。' },
    ],
  },
  {
    title: '迁移',
    pages: [
      { slug: 'migrate', title: '从其他平台迁移', description: '把 E2B、Daytona、Boat 的代码迁过来。' },
    ],
  },
]

export const allDocs: DocPage[] = docGroups.flatMap((group) => group.pages)

export const defaultDoc = allDocs[0].slug

export function getDoc(slug: string | undefined) {
  return allDocs.find((page) => page.slug === slug)
}

export function getDocNeighbors(slug: string | undefined) {
  const index = allDocs.findIndex((page) => page.slug === slug)
  return {
    previous: index > 0 ? allDocs[index - 1] : undefined,
    next: index >= 0 && index < allDocs.length - 1 ? allDocs[index + 1] : undefined,
  }
}

