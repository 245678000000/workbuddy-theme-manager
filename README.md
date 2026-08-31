# WorkBuddy 皮肤与主题管理器 (WorkBuddy Skin Manager)

一款专为腾讯 **WorkBuddy** 桌面客户端打造的轻量级皮肤与主题热换肤管理工具。

本项目参考了 `Codex-App-Manager` 的非侵入式热换肤架构，采用 **Tauri v2 + Rust + React 19** 构建。当前发布门槛是 **macOS**；Windows / Linux 源码保持兼容，但尚未经过原生主机验证。

---

## 已实现能力

- 🎨 **非侵入式热换肤**：基于 Chrome DevTools Protocol（CDP）向管理器自己启动的 WorkBuddy 会话注入 CSS/JavaScript，**不修改 WorkBuddy 任何本体文件，不破坏官方代码签名**。
- ⚡ **运行中切换**：WorkBuddy 运行过程中可切换皮肤，无需重启客户端。
- 🛡️ **一键安全还原**：清除管理器注入的样式与图层，恢复官方原生外观。
- 🌈 **内置精选预设**：
  - **景甜 · STARLIGHT 星蝶光廊**：浅色陪伴主题，含打包壁纸与立绘资源。
  - **赛博霓虹 (Cyberpunk Neon)**：高对比深黑底色 + 青荧紫粉霓虹。
  - **深空毛玻璃 (Frosted Glass)**：透亮半透明质感 + 多层环境光晕。
  - **温润羊皮纸 (Warm Parchment)**：低疲劳护眼书卷米黄质感。
  - **VS Code 极客暗黑 (Dark+ Pro)**：经典开发者纯黑灰度工作台。
  - **官方原味 (Stock Native)**：一键还原官方原生配色。
- 🎛️ **可视化微调器**：强调色、透明度、毛玻璃模糊度（含 `0px`）、字体族，以及只保存一份的自定义 CSS。
- 💾 **本地自定义皮肤**：保存到 `~/.workbuddy-skins/`，可在管理器内删除。

## 计划中（尚未实现）

以下能力在命令、校验、体积限制、路径穿越保护和界面流程完成前，**不可用**：

- `.wbskin` 皮肤包导入 / 导出 / 分享
- 用户上传壁纸与图片尺寸控制
- 自动更新、签名与公证
- Windows / Linux 原生主机验收
- 跨 WorkBuddy 版本的选择器兼容矩阵

详见 `docs/SECURITY.md` 与 `docs/RELEASE_CHECKLIST.md`。

---

## 项目架构

```
workbuddy-theme/
├── src-tauri/                 # Rust 核心后端 (Tauri v2)
│   ├── src/
│   │   ├── cdp/               # 有所有权的 CDP 会话与注入引擎
│   │   ├── process/           # 已验证 PID 的 WorkBuddy 探测与启停
│   │   ├── skin/              # 皮肤模型、打包资源路径与本地库
│   │   ├── commands.rs
│   │   └── lib.rs
│   └── tauri.conf.json
│
├── src/                       # React 19 + TypeScript + Tailwind 前端
│   ├── components/
│   ├── types/
│   ├── utils/
│   └── App.tsx
```

---

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动前端与调试预览
```bash
pnpm dev
```
浏览器打开 `http://localhost:1420` 即可预览界面。浏览器预览使用 mock 数据，不会连接真实 WorkBuddy。

### 3. 启动桌面端应用程序
```bash
pnpm tauri dev
```

### 4. 构建生产安装包
```bash
pnpm tauri build -b app --no-sign
```
macOS 产物在 `src-tauri/target/release/bundle/macos/`。签名、公证和跨平台安装包不在当前范围内。

---

## 使用指南

1. 打开本管理器，点击右上角 **「启动 WorkBuddy」**。管理器只会在调试端口 **9333** 空闲、且本机没有已验证的 WorkBuddy 进程时启动客户端，并附加 `--remote-debugging-port=9333`。
2. 右上角指示灯变为 **「CDP 调试端口已连接」** 后，才允许注入。已被其他进程占用的 9333 会被拒绝。
3. 在画廊中点击 **「一键应用」**。样式注入到管理器拥有的页面目标；部分失败会报错，不会假装成功。
4. 卡片右下角的调节图标可进行强调色、透明度、模糊度和自定义 CSS 微调，并保存为本地自定义皮肤。
5. **「安全还原原生」** 会清除管理器注入。若还原失败，当前皮肤 ID 会保留以便重试。

---

## 验证

日常：

```bash
pnpm check
```

发版前按 `docs/RELEASE_CHECKLIST.md` 执行自动化门禁和（如可行）消毒后的真实 WorkBuddy 验收。
