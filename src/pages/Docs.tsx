import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { ScrollToTop, SiteFooter, SiteHeader } from '../components/Layout'
import Markdown, { extractHeadings } from '../components/Markdown'
import { getDocContent } from '../data/doc-content'
import { docGroups, getDoc, getDocNeighbors } from '../data/docs'

export default function Docs() {
  const { slug } = useParams()
  const [navOpen, setNavOpen] = useState(false)
  const [query, setQuery] = useState('')
  const page = getDoc(slug)
  const content = getDocContent(slug)
  const { previous, next } = getDocNeighbors(slug)
  const headings = useMemo(() => extractHeadings(content).filter((heading) => heading.level === 2), [content])

  const filteredGroups = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return docGroups
    return docGroups
      .map((group) => ({
        ...group,
        pages: group.pages.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(keyword)),
      }))
      .filter((group) => group.pages.length > 0)
  }, [query])

  useEffect(() => {
    document.title = page ? `${page.title} · InstaBox 中文文档` : '页面不存在 · InstaBox 中文文档'
  }, [page])

  useEffect(() => {
    setNavOpen(false)
  }, [slug])

  return (
    <div className="page">
      <SiteHeader />
      <ScrollToTop />

      <details
        className="docs-mobile-nav"
        open={navOpen}
        onToggle={(event) => setNavOpen(event.currentTarget.open)}
      >
        <summary>文档目录</summary>
        <div className="docs-mobile-nav__groups">
          {docGroups.map((group) => (
            <div key={group.title}>
              <p>{group.title}</p>
              {group.pages.map((item) => (
                <NavLink
                  key={item.slug}
                  to={`/docs/${item.slug}`}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </details>

      <div className="docs-shell">
        <aside className="docs-sidebar">
          <div className="docs-sidebar__inner">
            <label className="docs-sidebar__search">
              <span className="visually-hidden">筛选文档</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="筛选文档…"
                aria-label="筛选文档"
              />
            </label>
            {filteredGroups.length === 0 && <p className="docs-nav-empty">没有匹配的文档</p>}
            {filteredGroups.map((group) => (
              <div className="docs-nav-group" key={group.title}>
                <p>{group.title}</p>
                <ul>
                  {group.pages.map((item) => (
                    <li key={item.slug}>
                      <NavLink
                        to={`/docs/${item.slug}`}
                        className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="docs-sidebar__foot">
              <a href="https://instabox.sh/docs" target="_blank" rel="noreferrer">
                英文原版文档 ↗
              </a>
              <a href="https://dashboard.instabox.sh" target="_blank" rel="noreferrer">
                控制台 ↗
              </a>
            </div>
          </div>
        </aside>

        <main className="docs-main" id="main">
          {page ? (
            <>
              <div className="docs-head">
                <p className="docs-head__crumb">
                  <Link to="/docs/overview">文档</Link>
                  <span>/</span>
                  {page.title}
                </p>
                <h1>{page.title}</h1>
                <p>{page.description}</p>
              </div>

              <div className="docs-body">
                <article className="docs-article">
                  <Markdown content={content} />

                  <nav className="docs-pager" aria-label="翻页">
                    {previous ? (
                      <Link className="docs-pager__item" to={`/docs/${previous.slug}`}>
                        <span>上一篇</span>
                        <strong>← {previous.title}</strong>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {next ? (
                      <Link className="docs-pager__item docs-pager__item--next" to={`/docs/${next.slug}`}>
                        <span>下一篇</span>
                        <strong>{next.title} →</strong>
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                </article>

                {headings.length > 0 && (
                  <aside className="docs-toc">
                    <p>本页目录</p>
                    <ul>
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <a href={`#${heading.id}`}>{heading.text}</a>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
              </div>
            </>
          ) : (
            <div className="docs-missing">
              <h1>页面不存在</h1>
              <p>这个文档页还没有写。</p>
              <Link className="btn btn--primary" to="/docs/overview">
                回到概览
              </Link>
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}
