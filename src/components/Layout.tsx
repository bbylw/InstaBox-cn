import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const github = 'https://github.com/InsForge/instabox'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="InstaBox 首页">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="24" height="24" rx="7" stroke="currentColor" strokeOpacity="0.35" />
        <rect x="6" y="6" width="6" height="6" rx="1.6" fill="currentColor" />
        <rect x="14" y="6" width="6" height="6" rx="1.6" fill="currentColor" fillOpacity="0.45" />
        <rect x="6" y="14" width="6" height="6" rx="1.6" fill="currentColor" fillOpacity="0.45" />
        <rect x="14" y="14" width="6" height="6" rx="1.6" fill="currentColor" fillOpacity="0.2" />
      </svg>
      <span>InstaBox</span>
    </Link>
  )
}

export function SiteHeader() {
  const location = useLocation()
  const onDocs = location.pathname.startsWith('/docs')

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <div className="site-header__inner">
        <div className="site-header__left">
          <Logo />
          <span className="site-header__divider" aria-hidden="true" />
          {onDocs ? (
            <span className="site-header__context">中文文档</span>
          ) : (
            <span className="site-header__context">为 AI Agent 打造的云计算机</span>
          )}
        </div>
        <nav className="site-header__nav" aria-label="主导航">
          <Link
            to="/docs/overview"
            className={`nav-link${onDocs ? ' is-active' : ''}`}
            aria-current={onDocs ? 'page' : undefined}
          >
            文档
          </Link>
          <Link to="/docs/pricing" className="nav-link nav-link--secondary">
            定价
          </Link>
          <Link to="/docs/concepts" className="nav-link nav-link--secondary">
            概念
          </Link>
          <a href={github} target="_blank" rel="noreferrer" className="site-header__icon" aria-label="GitHub">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
        </nav>
        <div className="site-header__actions">
          <a className="btn btn--primary btn--sm" href="https://dashboard.instabox.sh/auth/workos/login?screen_hint=sign-up">
            免费开始
          </a>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo />
          <p>为每个 AI Agent 提供一台独立的 Linux 计算机。按运行时间计费，空闲自动暂停。</p>
        </div>
        <div className="site-footer__cols">
          <div>
            <h4>产品</h4>
            <a href="https://instabox.sh/pricing">定价</a>
            <a href="https://instabox.sh/changelog">更新日志</a>
            <a href="https://instabox.sh/blog">博客</a>
            <a href="https://instabox.instatus.com/">系统状态</a>
          </div>
          <div>
            <h4>文档</h4>
            <Link to="/docs/quickstart">快速开始</Link>
            <Link to="/docs/cli">CLI 参考</Link>
            <Link to="/docs/api">API 概览</Link>
            <Link to="/docs/mcp">MCP 集成</Link>
          </div>
          <div>
            <h4>用例</h4>
            <Link to="/docs/overview">编码 Agent</Link>
            <Link to="/docs/desktop">计算机使用</Link>
            <Link to="/docs/ports">预览 URL</Link>
            <Link to="/docs/snapshots">并行分叉</Link>
          </div>
          <div>
            <h4>公司</h4>
            <a href="https://app.vanta.com/insforge.dev/trust/9dxtxcntvvv5ow2tx7e4dm">信任中心</a>
            <a href="https://instabox.sh/terms">服务条款</a>
            <a href="https://instabox.sh/privacy">隐私政策</a>
            <a href="https://discord.gg/instabox">Discord</a>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} InstaBox · 由 InsForge, Inc. 构建</span>
        <span className="site-footer__compliance">SOC 2 Type II · HIPAA</span>
      </div>
    </footer>
  )
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
