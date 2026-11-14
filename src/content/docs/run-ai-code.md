# 运行 AI 生成的代码

> 让模型写的代码在独立机器里执行，再把输出交回模型。

模型生成的代码不该直接跑在你的服务器或笔记本上。把仓库、依赖和一次性的实验放进一台机器，执行完把输出带回给模型；机器可以随时暂停、还原或删除。

## 1. 准备一台机器

```bash
instabox create --name runner
```

默认模板 `agent-browser` 带有 Python 3、Node.js、git、curl 和 Docker。需要固定环境时，先配置好再保存快照：

```bash
instabox snapshot save runner --name py311
instabox create --name runner --snapshot py311
```

## 2. 从代码执行

```ts
import { Sandbox } from '@insforge/instabox-sdk'

const sbx = await Sandbox.create('agent-browser', { name: 'runner' })

const code = `
import json
print(json.dumps({"ok": True, "value": 6 * 7}))
`

const result = await sbx.commands.run('python3 -', { stdin: code, timeoutMs: 30_000 })
console.log(result.stdout)     // {"ok": true, "value": 42}
```

```python
from instabox import Client

client = Client()
box = client.machines.create(name="runner")
result = client.machines.exec(box.id, "python3 -", stdin='print(6 * 7)')
print(result.stdout, result.exit_code)
```

需要隔离运行时，把代码写进文件再执行，避免 Shell 转义问题：

```ts
await sbx.files.write('/data/home/run.py', code)
const result = await sbx.commands.run('python3 /data/home/run.py')
```

## 3. 把结果交回模型

执行结果包含 `stdout`、`stderr` 和 `exitCode`。只把模型需要判断的部分回传，长输出先截断或摘要：

```ts
const output = [result.stdout, result.stderr].filter(Boolean).join('\n').slice(0, 8_000)

const next = await model.chat({
  messages: [
    { role: 'user', content: `代码执行结果：\n${output}\n\n如果失败，给出修正后的代码。` },
  ],
})
```

非零退出码在 TypeScript 中会抛 `CommandExitError`，其中仍有 `stdout`、`stderr`、`exitCode`；需要自己处理时用 `sbx.commands.exec`。

## 4. 文件与依赖

```bash
instabox push runner ./project
instabox exec runner --cwd /data/home/project -- npm ci
instabox exec runner --cwd /data/home/project -- npm test
instabox pull runner /data/home/project/coverage
```

安装的依赖、生成的缓存都留在 `/data`，暂停再恢复仍然存在。下一次实验前可以还原到干净状态：

```bash
instabox snapshot save runner --name clean
instabox restore runner --snapshot clean
```

## 5. 控制成本

- 用 `--max-run-minutes` 限制单次运行时长。
- 一次性任务用 `instabox run`，结束即删除：

```bash
instabox run --push . --timeout 10m -- python3 eval.py
```

- 长期存在的机器设置 `--delete-after`，避免忘记清理。
- 执行结束后 `suspend`，只保留磁盘。

## 安全建议

- 不要把模型提供商的真实 key 写进代码或环境变量，用 [Org Secrets](./secrets)。
- 不可信代码不要发布公开端口；需要访问时用私有端口或 `port-forward`。
- 需要网络隔离的场景，把实验放在独立机器里，删除即彻底清理。

## 相关

- [运行命令](./run-commands)
- [文件](./files)
- [编码 Agent](./coding-agents)
