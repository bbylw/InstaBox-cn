import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type Heading = { level: number; text: string; id: string }

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = []
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.*)$/.exec(line)
    if (!match) continue

    const text = match[2].replace(/[`*_]/g, '').trim()
    headings.push({
      level: match[1].length,
      text,
      id: slugify(text) || 'section',
    })
  }

  return headings
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const text = ref.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const language = (() => {
    const child = Array.isArray(children) ? children[0] : children
    if (child && typeof child === 'object' && 'props' in child) {
      const className = (child as { props: { className?: string } }).props.className ?? ''
      const match = /language-(\w+)/.exec(className)
      if (match) return match[1]
    }
    return ''
  })()

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{language || 'shell'}</span>
        <button
          type="button"
          className={`code-block__copy${copied ? ' is-copied' : ''}`}
          onClick={copy}
          aria-live="polite"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre ref={ref}>{children}</pre>
    </div>
  )
}

export default function Markdown({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content])

  const components = useMemo(() => {
    const heading =
      (Tag: 'h2' | 'h3') =>
      ({ children }: { children?: ReactNode }) => {
        const text = textOf(children).trim()
        return <Tag id={slugify(text) || 'section'}>{children}</Tag>
      }

    return {
      h2: heading('h2'),
      h3: heading('h3'),
      pre: ({ children }: { children?: ReactNode }) => <CodeBlock>{children}</CodeBlock>,
      a: ({ href, children }: { href?: string; children?: ReactNode }) => {
        if (href?.startsWith('./')) {
          const [path, hash] = href.slice(2).split('#')
          const slug = path.replace(/\.md$/, '')
          return <Link to={`/docs/${slug}${hash ? `#${hash}` : ''}`}>{children}</Link>
        }
        if (href?.startsWith('#')) {
          return <a href={href}>{children}</a>
        }
        const external = href?.startsWith('http')
        return (
          <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
            {children}
          </a>
        )
      },
      table: ({ children }: { children?: ReactNode }) => (
        <div className="table-wrap">
          <table>{children}</table>
        </div>
      ),
      blockquote: ({ children }: { children?: ReactNode }) => (
        <blockquote>{children}</blockquote>
      ),
      code: ({ className, children }: { className?: string; children?: ReactNode }) =>
        className ? <code className={className}>{children}</code> : <code className="inline-code">{children}</code>,
      td: ({ children }: { children?: ReactNode }) => {
        const text = textOf(children).trim()
        return <td>{text === '✓' ? <span className="tick">✓</span> : children}</td>
      },
    }
  }, [headings])

  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
