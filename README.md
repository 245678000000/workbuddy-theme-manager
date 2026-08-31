# WorkBuddy 皮肤与主题管理器 (WorkBuddy Skin Manager)

一款专为腾讯 **WorkBuddy** 桌面客户端打造的高颜值、轻量级、跨平台**皮肤与主题热换肤管理工具**。

本项目参考了 `Codex-App-Manager` 的非侵入式热换肤架构设计，采用 **Tauri v2 + Rust + React 19** 构建。

---

## 核心特性

- 🎨 **非侵入式热换肤**：基于 Chrome DevTools Protocol（CDP）协议实时注入 CSS，**不修改 WorkBuddy 任何本体文件，不破坏官方代码签名**。
- ⚡ **秒级试穿与切换**：在 WorkBuddy 运行过程中随时切换皮肤，无需重启应用，即刻见效。
- 🛡️ **一键安全还原**：一键清除所有注入样式，毫秒级恢复 WorkBuddy 官方原生默认外观，零残留。
- 🌈 **内置精选预设**：
  - **赛博霓虹 (Cyberpunk Neon)**：高对比深黑底色 + 青荧紫粉霓虹。
  - **深空毛玻璃 (Frosted Glass)**：透亮半透明质感 + 多层环境光晕。
  - **温润羊皮纸 (Warm Parchment)**：低疲劳护眼书卷米黄质感。
  - **VS Code 极客暗黑 (Dark+ Pro)**：经典开发者纯黑灰度工作台。
  - **官方原味 (Stock Native)**：一键还原官方原生配色。
- 🎛️ **可视化微调器**：支持自定义强调色拾色器、透明度滑块、毛玻璃模糊度（Blur Filter）、字体族以及自定义 CSS 代码。
- 📦 **皮肤包生态**：支持本地皮肤保存到 `~/.workbuddy-skins/`，支持导入与分享。

---

## 项目架构

```
workbuddy-theme/
├── src-tauri/                 # Rust 核心后端 (Tauri v2)
│   ├── src/
│   │   ├── cdp/               # CDP 协议通信与动态注入引擎
│   │   ├── process/           # WorkBuddy 路径与运行状态探测器
│   │   ├── skin/              # 皮肤模型、内置主题与本地库管理
│   │   ├── commands.rs        # Tauri IPC 指令分发
│   │   └── lib.rs
│   └── tauri.conf.json
│
├── src/                       # React 19 + TypeScript + Tailwind 前端界面
│   ├── components/            # Header、SkinGallery、SkinCard、Customizer
│   ├── types/                 # 皮肤与连接状态类型定义
│   ├── utils/ipc.ts           # Tauri IPC 桥接层与浏览器调试适配器
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
浏览器打开 `http://localhost:1420` 即可预览完整界面与调色板交互。

### 3. 启动桌面端应用程序
```bash
pnpm tauri dev
```

### 4. 构建生产安装包
```bash
pnpm tauri build
```
构建产物将在 `src-tauri/target/release/bundle/` 下生成（macOS 生成 `.dmg` / `.app`，Windows 生成 `.msi` / `.exe`）。

---

## 使用指南

1. 打开本管理器，点击右上角的 **「启动 WorkBuddy」**（管理器将自动附加 `--remote-debugging-port=9222` 参数启动客户端）；
2. 看到右上角指示灯变为 **「CDP 调试端口已连接」**；
3. 在画廊中点击任意心仪的皮肤卡片中的 **「一键应用」**，样式即可瞬间注入生效；
4. 点击卡片右下角的调节图标，可进入调色盘进行深度二次微调并保存为你自己的专属皮肤。
