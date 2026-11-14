# Android 应用

> 机器里运行 Android 14，用 adb 安装和测试应用。

`android` 模板用于测试 Android 应用，也用于让 Agent 操作手机。Android 作为容器运行在机器自己的 Linux 内核上，没有模拟器，也没有嵌套 VM。机器同时拥有 `agent-browser` 的全部能力：Docker、Node.js、Python 与桌面。

## 1. 创建 Android 机器

```bash
instabox create --name phone --template android
```

机器启动后约 20 秒 Android 可用。使用默认或更大的规格；Android 运行时会占用 1–2 GiB 内存。

## 2. 等待 Android 启动

```bash
instabox exec phone -- 'until [ "$(docker exec instabox-android getprop sys.boot_completed 2>/dev/null)" = 1 ]; do sleep 1; done'
```

命令在 Android 报告 `sys.boot_completed` 后返回。创建或分叉后的短时间内 `adb devices` 为空，直到 Android 启动完成。

## 3. 安装应用

```bash
instabox push phone ./app-debug.apk
instabox exec phone -- adb install app-debug.apk
```

`push` 把 APK 放到机器家目录，`adb install` 在安装结束时打印结果。

## 4. 操作与测试

```bash
instabox ssh phone
adb devices                               # emulator-5554（或 127.0.0.1:5555）
adb shell input tap 360 640
adb exec-out screencap -p > screen.png
```

`adb devices` 列出手机，`screencap` 把截图保存到机器里的 `screen.png`。

## 5. 看到手机画面

在控制台打开机器，选择 **Computer** 标签。手机是桌面上的 **Android** 窗口，可以点击和输入。Agent 用桌面 API 或 `adb shell input` 以同样方式操作，见[计算机使用](./computer-use)。

> 注意：Free 套餐可以从 `agent-browser`、`android`、`omarchy`、`ci` 创建，因此 `android` 在所有套餐都能用。

## android 模板的限制

- **没有 Google Play 与 Google 服务。** 用 `adb install` 安装应用；依赖 Google 服务登录、地图或推送的应用无法完整工作。
- **只有 x86_64。** 只提供 ARM 原生库的应用无法运行（没有 ARM 转译）；没有原生代码或带 x86_64 库的应用可以运行。
- **软件渲染。** 适合应用测试与 UI 自动化，游戏和重 3D 会慢。

## 常见问题

**`adb devices` 仍为空**

启动完成后运行一次 `adb connect 127.0.0.1:5555`。不要在 `emulator-5554` 已列出时连接，否则同一台手机会出现两次，`adb shell` 会询问使用哪一个。

**暂停、空闲暂停与分叉**

暂停与恢复、空闲暂停与唤醒都会保留正在运行的 Android，应用、状态和时钟继续。分叉会复制 Android 的数据（已安装应用及其数据），约 20 秒后启动自己的 Android；正在运行的应用不会带过去。

**释放 Android 占用的内存**

```bash
sudo systemctl stop instabox-android
sudo systemctl disable instabox-android   # 跨重启保持关闭
```

## 相关

- [计算机使用](./computer-use)
- [并行分叉](./parallel-forks)
- [规格与创建参数](./sizes)
