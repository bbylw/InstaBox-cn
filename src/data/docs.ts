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
    title: '机器',
    pages: [
      { slug: 'lifecycle', title: '生命周期', description: '启动、暂停、恢复、关机、重启与删除。' },
      { slug: 'snapshots', title: '快照与分叉', description: '保存一次，用快照或分叉复制出更多机器。' },
      { slug: 'pricing', title: '定价与用量', description: '套餐、包含额度和每一项单价。' },
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
    title: '安全与集成',
    pages: [
      { slug: 'secrets', title: 'Org Secrets', description: '真实凭据不落到机器里的密钥管理方式。' },
      { slug: 'mcp', title: 'MCP', description: '让 Claude Code、Cursor、Codex 直接操作机器。' },
      { slug: 'sdk', title: 'TypeScript SDK', description: '用代码创建、执行、暂停和删除机器。' },
    ],
  },
  {
    title: '参考',
    pages: [
      { slug: 'cli', title: 'CLI 参考', description: 'instabox 命令与常用参数。' },
      { slug: 'api', title: 'API 概览', description: '基础地址、鉴权、操作与错误处理。' },
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

const contentModules = import.meta.glob('../content/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getDocContent(slug: string | undefined): string {
  const entry = Object.entries(contentModules).find(([path]) => path.endsWith(`/${slug}.md`))
  const raw = entry?.[1] ?? ''
  // 页面标题由文档头部渲染，正文里的第一个 H1 只用于导航元数据。
  return raw.replace(/^#\s+.*(?:\r?\n)+/, '')
}
