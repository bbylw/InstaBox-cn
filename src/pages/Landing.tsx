import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader } from '../components/Layout'

const installCommand = 'npx instabox@latest sh'

const customers = [
  'Bubble Lab',
  'Nuphos',
  'CoreSpeed',
  'Allowance',
  'YouArt',
  'Cartpanda',
  'TrustLayer',
  'Raft',
  'Signalsurf',
  'Vestra',
]

const machineFeatures = [
  {
    title: '独立内核，真正的 root',
    body: '不是共享内核的沙箱。每台机器有自己的内核、root 权限、systemd 服务和原生 Docker。',
    icon: 'kernel',
  },
  {
    title: '装上就留下来',
    body: '文件在 /data 下跨会话保留，home 目录、仓库、依赖和登录状态下次开工时都还在。',
    icon: 'disk',
  },
  {
    title: 'Agent 工具已就绪',
    body: '默认模板预装桌面与浏览器，Claude Code、Codex、OpenCode 可以直接跑起来。',
    icon: 'terminal',
  },
]

const capabilities = [
  {
    title: '运行中分叉',
    body: '把一台正在运行的机器复制成多台，带文件与磁盘，几秒内启动，用来并行尝试不同方案。',
  },
  {
    title: '暂停保留内存',
    body: '暂停后内存和进程都留着，恢复时接着上次的会话继续，而不是重新登录、重新装环境。',
  },
  {
    title: '快照一次复用',
    body: '把装好工具、仓库和登录状态的机器存成快照，之后每台新机器都从它开始。',
  },
  {
    title: '桌面与浏览器',
    body: '真实 Linux 桌面，Agent 可以截图、点击、输入；你随时接管，也可以分享只读链接。',
  },
  {
    title: 'Org Secrets',
    body: '机器里只看到占位符，出站代理在请求头里换成真实密钥，密钥不会落到磁盘或快照里。',
  },
  {
    title: '预览 URL',
    body: '给机器里任意 HTTP 端口一个 HTTPS 地址，公开分享或用一次性私有链接发给评审。',
  },
]

const useCases = [
  { title: '编码 Agent', body: '给 Claude Code、Codex 或 OpenCode 一台独立机器，在你的仓库里干活。', slug: 'overview' },
  { title: '运行模型生成的代码', body: '把模型写出的代码放进机器执行，再把输出交回给模型。', slug: 'quickstart' },
  { title: '浏览器自动化', body: '让 Agent 驱动桌面里的浏览器，人在需要时接管。', slug: 'desktop' },
  { title: '分享预览链接', body: '跑起 dev server，给评审、手机或 webhook 一个可访问的地址。', slug: 'ports' },
  { title: '并行实验', body: '一次配置，分叉出多台机器，每台试一种实现。', slug: 'snapshots' },
  { title: 'CI 与测试', body: '在全新机器上跑 GitHub Actions 任务或一条测试命令。', slug: 'lifecycle' },
]

const plans = [
  { name: 'Free', price: '$0', note: '永久免费', features: ['1 台机器，4 vCPU / 8 GiB', '20 GiB 磁盘', '5 个快照', '100 GiB 出站流量/月'] },
  { name: 'Pro', price: '$20', note: '/月 + 用量', features: ['$20 月度额度', '最多 100 台并发', '最高 8 vCPU / 16 GiB', '200 GiB 磁盘包含'] },
  { name: 'Builder', price: '$100', note: '/月 + 用量', features: ['$100 月度额度', '最多 200 台并发', '最高 16 vCPU / 32 GiB', '1 TiB 磁盘包含'], featured: true },
  { name: 'Team', price: '$500', note: '/月 + 用量', features: ['$500 月度额度', '500 台并发', '最高 32 vCPU / 64 GiB', '5 TiB 磁盘包含'] },
]

const sdkSnippet = `import { Sandbox } from '@insforge/instabox-sdk'

// 从模板创建一台机器，等它跑起来
const sbx = await Sandbox.create('agent-browser', {
  metadata: { customer: 'acme' },
})

// 在里面执行命令、读写文件
const result = await sbx.commands.run('python3 -c "print(6 * 7)"')
console.log(result.stdout)        // 42

// 暂停：内存、文件和进程都保留
await sbx.pause()
await sbx.resume()

// 用完删掉，只留快照
await sbx.kill()`

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactElement> = {
    kernel: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </>
    ),
    disk: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3M13 15h4" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function CopyCommand() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(installCommand)
      ok = true
    } catch {
      const field = document.createElement('textarea')
      field.value = installCommand
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      ok = document.execCommand('copy')
      field.remove()
    }
    setState(ok ? 'copied' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  return (
    <div className="install-line">
      <span className="install-line__prompt">$</span>
      <code>{installCommand}</code>
      <button
        type="button"
        className="install-line__copy"
        onClick={copy}
        data-state={state}
      >
        复制
      </button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? '已复制' : state === 'failed' ? '复制失败' : ''}
      </span>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__glow" />
      <div className="machine-card">
        <div className="machine-card__head">
          <span className="machine-card__dot" />
          <span className="machine-card__name">dev</span>
          <span className="pill pill--running">running</span>
          <span className="machine-card__id">m_7f3a9c21</span>
        </div>
        <div className="machine-card__specs">
          <div>
            <span>vCPU</span>
            <strong>4</strong>
          </div>
          <div>
            <span>内存</span>
            <strong>8 GiB</strong>
          </div>
          <div>
            <span>磁盘</span>
            <strong>20 GiB</strong>
          </div>
          <div>
            <span>模板</span>
            <strong>agent-browser</strong>
          </div>
        </div>
        <div className="machine-card__term">
          <div>
            <span className="t-dim">$</span> instabox ssh dev
          </div>
          <div className="t-dim">dev@m_7f3a9c21:~$ claude</div>
          <div>
            <span className="t-accent">✻</span> 已连接机器，仓库与工具链准备就绪
          </div>
          <div>
            <span className="t-dim">dev@m_7f3a9c21:~$</span> <span className="t-caret" />
          </div>
        </div>
        <div className="machine-card__foot">
          <span>桌面已开启</span>
          <span className="machine-card__url">https://3000-7f3a9c21.box.run</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    document.title = 'InstaBox · 为 AI Agent 打造的云计算机'
  }, [])

  return (
    <div className="page">
      <SiteHeader />

      <main id="main">
        <section className="hero">
          <div className="hero__bg" />
          <div className="container hero__inner">
            <div className="hero__copy">
              <div className="badge">
                <span className="badge__dot" />
                完整 Linux VM · 空闲自动暂停
              </div>
              <h1>
                <span>给每个 Agent 一台</span>
                <span>属于它自己的</span>
                <span className="accent">Linux 计算机</span>
              </h1>
              <p className="hero__sub">
                InstaBox 为每个 Agent 提供一台完整的云上 Linux 虚拟机：独立内核、root 与 Docker。文件与已安装的软件跨会话保留，
                空闲时自动暂停，你只为真正运行的时间付费。
              </p>
              <CopyCommand />
              <div className="hero__actions">
                <a className="btn btn--primary" href="https://dashboard.instabox.sh/auth/workos/login?screen_hint=sign-up">
                  免费开始使用
                </a>
                <Link className="btn btn--ghost" to="/docs/quickstart">
                  阅读文档 <span className="arrow">→</span>
                </Link>
              </div>
              <p className="hero__meta">
                <span className="hero__live">
                  <span className="hero__live-dot" />
                  10,791
                </span>{' '}
                台机器正在运行 · 免费套餐即可开始
              </p>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section className="logos">
          <div className="container">
            <p className="logos__label">InstaBox 为这些团队的 Agent 运行时提供算力</p>
            <div className="logos__row">
              {customers.map((name) => (
                <span key={name} className="logos__item">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="machine">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">完整的机器</p>
              <h2>不是共享内核的沙箱，是一整台机器</h2>
              <p className="section__sub">
                长时间运行的任务需要的东西，沙箱通常给不了：后台进程、Docker、系统服务，以及下次开工还在的东西。
              </p>
            </div>
            <div className="card-grid card-grid--3">
              {machineFeatures.map((item) => (
                <article className="card" key={item.title}>
                  <div className="card__icon">
                    <Icon name={item.icon} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--split">
          <div className="container split">
            <div className="split__copy">
              <p className="eyebrow">为长时运行而生</p>
              <h2>Agent 停下，机器也停下</h2>
              <p className="section__sub">
                机器空闲 30 分钟后自动暂停：内存和进程都留着，磁盘继续保留。下一次命令、SSH 连接或访问公开 URL 时自动唤醒，
                从上次的位置继续。
              </p>
              <ul className="check-list">
                <li>暂停时不收运行时费用，只收磁盘</li>
                <li>恢复通常在一秒左右，会话不中断</li>
                <li>按秒计费，跑多久算多久</li>
                <li>也可以手动暂停、关机、重启或彻底删除</li>
              </ul>
              <Link className="link-arrow" to="/docs/lifecycle">
                了解生命周期 <span className="arrow">→</span>
              </Link>
            </div>
            <div className="split__code">
              <div className="snippet-head">
                <span className="snippet-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>agent.ts</span>
              </div>
              <pre className="snippet">
                <code>{sdkSnippet}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">能力</p>
              <h2>做 Agent 基础设施需要的一切</h2>
            </div>
            <div className="card-grid card-grid--3 card-grid--tight">
              {capabilities.map((item) => (
                <article className="card card--bordered" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="use-cases">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">用例</p>
              <h2>人们用它做什么</h2>
            </div>
            <div className="usecases">
              {useCases.map((item) => (
                <Link className="usecase" key={item.title} to={`/docs/${item.slug}`}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <span className="usecase__arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--pricing" id="pricing">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">定价</p>
              <h2>按运行时间付费，随时开始</h2>
              <p className="section__sub">
                暂停或关机的机器只收磁盘费用。付费套餐包含月度额度，用量先走额度。vCPU $0.004/小时，内存 $0.00225/GiB·小时。
              </p>
            </div>
            <div className="plans">
              {plans.map((plan) => (
                <article className={`plan ${plan.featured ? 'plan--featured' : ''}`} key={plan.name}>
                  {plan.featured && <span className="plan__tag">最受欢迎</span>}
                  <h3>{plan.name}</h3>
                  <p className="plan__price">
                    {plan.price}
                    <span>{plan.note}</span>
                  </p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <a
                    className={`btn ${plan.featured ? 'btn--primary' : 'btn--outline'} btn--full`}
                    href="https://dashboard.instabox.sh/auth/workos/login?screen_hint=sign-up"
                  >
                    选择 {plan.name}
                  </a>
                </article>
              ))}
            </div>
            <p className="plans__note">
              需要 Enterprise？99.9% SLA、SSO / SAML 与 SCIM、审计日志、独立资源池或 BYOC。
              <Link to="/docs/pricing">查看完整定价与用量说明 →</Link>
            </p>
          </div>
        </section>

        <section className="cta">
          <div className="container cta__inner">
            <div>
              <h2>给每个 Agent 一台机器</h2>
              <p>一条命令完成登录、安装 CLI，并打开第一台机器的 Shell。</p>
            </div>
            <div className="cta__actions">
              <a className="btn btn--primary" href="https://dashboard.instabox.sh/auth/workos/login?screen_hint=sign-up">
                免费开始
              </a>
              <Link className="btn btn--ghost" to="/docs/overview">
                阅读文档
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
