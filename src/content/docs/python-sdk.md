# Python SDK

> 用 Python 创建、执行、暂停和删除机器。

## 安装与鉴权

```bash
pip install instabox-sdk
export INSTABOX_API_KEY=ibk_...
```

在控制台 **API keys** 创建 key：**Full access**，或包含 `machines:write`、`machines:delete` 的受限 key 即可完成快速开始。快照相关调用还需要 `images:write`（创建）、`images:read`（列出与读取）、`images:delete`（删除）。

`Client()` 读取 `INSTABOX_API_KEY` 与 `INSTABOX_API_URL`（默认 `https://api.instabox.sh`），也可以显式传入 `Client(api_key=..., base_url=...)`。

## 快速开始

```python
from instabox import Client

client = Client()

box = client.machines.create(name="my-box")   # 模板 agent-browser，等到就绪
try:
    r = client.machines.exec(box.id, "uname -a")
    print(r.stdout, end="")

    r = client.machines.exec(box.id, ["sh", "-c", "echo oops >&2; exit 3"])
    print(r.exit_code, r.stderr, end="")      # 3 oops
finally:
    client.machines.delete(box.id)
```

`create` 会等到机器就绪。`exec` 接受 Shell 字符串（用 `bash -lc` 执行）或参数列表（不经过 Shell）。非零退出码是正常结果，从 `r.exit_code` 读取，不会抛异常。

## 之后重新接上机器

机器默认空闲 30 分钟后暂停。`ensure_running` 会启动或恢复它，无论当前状态，并等到就绪：

```python
from instabox import Client

client = Client()
box = client.machines.ensure_running("my-box")
print(client.machines.exec(box.id, "ls /data/home").stdout, end="")
client.machines.update(box.id, metadata={"stage": "review"})
```

`update` 可以修改名称、标签与空闲暂停时间（Free 套餐不支持自定义空闲时间，返回 `403 spec_not_allowed`）。

## 调用一览

所有接受 `machine` 的调用都可以传机器 ID（`m_...`）或名称。

| 调用 | 作用 |
| --- | --- |
| `client.machines.create(name=None, *, template=None, snapshot_id=None, metadata=None, ...)` | 创建机器，等到就绪 |
| `client.machines.list()` / `get(machine)` | 列出 / 读取机器 |
| `client.machines.exec(machine, command, *, cwd=None, env=None, stdin=None, timeout=60)` | 执行命令，返回 `stdout`、`stderr`、`exit_code`、`timed_out` |
| `client.machines.pause` / `resume` / `start` / `stop` / `ensure_running` | 生命周期，均等待操作完成 |
| `client.machines.update(machine, *, name=None, metadata=None, auto_suspend_after_seconds=None, ...)` | 改名、设置标签或空闲暂停 |
| `client.machines.delete(machine, *, confirm=None)` | 删除，`confirm` 用于二次确认 |
| `client.files.write` / `read` / `read_bytes` / `list` / `exists` / `remove` | 文件操作，路径为绝对路径或相对 HOME |
| `client.files.read_stream` / `upload` / `download` | 流式读取与整目录复制（0.4.0 起） |
| `client.snapshots.create(machine, name)` / `list()` / `get(id)` / `delete(id)` | 快照，`status` 从 `pending` 到 `ready` |
| `client.templates.list()` | 模板列表 |

## 错误

所有错误都是 `instabox.InstaboxError`；API 错误是 `instabox.APIError` 的子类，带 `code`、`message`、`request_id`、`retryable` 和 `status`：

```python
from instabox import APIError

try:
    client.machines.create(name="box")
except APIError as error:
    if error.retryable:
        ...
    print(error.code, error.status, error.request_id)
```

## 相关

- [TypeScript SDK](./sdk)
- [API 概览](./api)
- [错误码](./errors)
