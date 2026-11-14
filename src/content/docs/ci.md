# CI

> 在全新机器上跑 GitHub Actions job，或从任意 CI 执行一条测试命令。

有两种方式：把 GitHub Actions 的 `runs-on` 换成 InstaBox，每个 job 跑在一台全新机器上，不消耗 GitHub Actions 分钟数；或者在任何 CI 里用 CLI 创建机器、跑一条命令、删除机器。

|  | `runs-on: instabox-medium`（推荐） | 任意 CI + CLI |
| --- | --- | --- |
| 跑在 InstaBox 上的 | 每个 job，各自一台全新机器 | 每一步一条命令 |
| 配置 | 安装 GitHub App，改 `runs-on` | 一个 API key 作为 CI secret |
| 适用 | GitHub Actions | 任何 CI |
| GitHub Actions 分钟 | 不消耗 | 消耗 job 的 runner 分钟 |

## 在 InstaBox 上跑 GitHub Actions

**1. 连接 GitHub**

在控制台的 **CI** 页面点击 **Connect GitHub**，安装 instabox GitHub App。

**2. 修改 `runs-on`**

```yaml
jobs:
  test:
    runs-on: instabox-medium
```

每个使用该标签的 job 得到一台全新的 Ubuntu 24.04 机器，带有 GitHub `ubuntu-24.04` 镜像的工具，job 结束后删除。

`instabox-medium` 是所有套餐都能用的标签。

**3. 查看 job**

控制台的 **CI** 页面会列出这些 job、它们的状态与耗时。

### 从快照启动 job

预先安装依赖并保存快照，可以缩短每次 job 的准备时间。快照只支持私有仓库，并且仓库的 **Settings > Actions > General** 中必须关闭 **Run workflows from fork pull requests**，否则命名快照的 job 会被拒绝。

> 警告：不要把 token、SSH key、`.env` 放进快照。链接仓库任意分支的 workflow 都可能引用该快照。job 仍然从 GitHub Actions 获取 secrets，而且每个 job 拿到的是自己的副本，无法修改快照。

快照会保留保存时的 GitHub Actions runner，GitHub 不再把 job 发给落后超过 30 天的 runner，所以至少每月从一个新的 `ci` 机器重新保存一次。

## 从任意 CI 使用 CLI

不需要 GitHub App：一步创建机器、上传代码、执行命令、删除机器。

**1. 保存 API key**

```bash
instabox keys create --name github-ci --expires-in-days 90 --json \
  | jq -r .key \
  | gh secret set INSTABOX_API_KEY
```

key 直接进入 secret，不会打印出来。

**2. 在流水线里运行**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      INSTABOX_API_KEY: ${{ secrets.INSTABOX_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - name: Install the instabox CLI
        run: npm install -g instabox
      - name: Run the tests
        run: |
          instabox run --push . --timeout 10m -e CI=1 -- \
            'npm ci && npm test'
```

`instabox run` 会创建机器、上传当前目录、执行命令，并以命令的退出码结束，所以失败会让流水线失败。`--timeout` 同时设置归档与删除的截止时间，即使 runner 被中断也会清理。

在任何其他 CI 中，同样的三步：设置 `INSTABOX_API_KEY`、`npm install -g instabox`、`instabox run --push . -- <命令>`。

## 选择哪种

- **GitHub 仓库、希望不占 Actions 分钟**：用 `runs-on: instabox-medium`。
- **其他 CI、或不想安装 GitHub App**：用 `instabox run`。
- **需要预装环境**：两种方式都可以从 `ci` 模板的快照开始。
- **需要更大的规格**：在控制台配置 CI 标签对应的规格（`instabox-medium` 之外还有更大规格）。

## 限制

- `instabox run` 每次只执行一条命令，多条命令用 `sh -c` 串联。
- 上传受 `push` 限制：目录上限 1 GiB，且只包含 git 跟踪的文件。
- 公开仓库或允许 fork PR 运行 workflow 的仓库不能使用快照。
- job 失败时机器仍会被清理；需要排查时可以先用交互方式复现。

## 相关

- [运行命令](./run-commands)
- [快照与分叉](./snapshots)
- [API Keys](./api-keys)
