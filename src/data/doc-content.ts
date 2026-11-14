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
