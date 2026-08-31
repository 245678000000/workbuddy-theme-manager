# WorkBuddy 皮肤制作与规范指南

WorkBuddy 的 DOM 选择器随客户端版本变化。本指南对应当前仓库里的 `src-tauri/src/skin/kernel.css`。换 WorkBuddy 大版本后，选择器可能失效，需要对照内核样式重新验证，而不是照抄通用类名。

`.wbskin` 压缩包导入 / 导出尚未实现。当前自定义皮肤以本地目录保存。

## 1. 当前本地皮肤目录

自定义皮肤写在 `~/.workbuddy-skins/<id>/`，其中 `<id>` 形如 `custom-deadbeef`：

```
~/.workbuddy-skins/custom-deadbeef/
├── manifest.json
├── theme.css
└── config.json
```

内置带资源的皮肤（如 `jingtian-starlight`）由应用打包到 `$RESOURCE/skins/<id>/`，运行时不得依赖开发机绝对路径。

## 2. 计划中的 `.wbskin` 包（未实现）

未来若提供导入 / 导出，预期是带路径穿越保护、体积限制和校验的 Zip：

```
my-theme.wbskin
├── manifest.json
├── theme.css
├── config.json
└── preview.png
```

在对应命令、校验和界面完成前，不要把 `.wbskin` 当作可用功能。

## 3. `manifest.json` 字段

```json
{
  "id": "custom-deadbeef",
  "name": "极简深海蓝",
  "version": "1.0.0",
  "author": "创作者名称",
  "description": "专为夜间专注打造的深海蓝配色",
  "themeMode": "dark",
  "accentColor": "#38bdf8",
  "targetVersion": ">=1.0.0"
}
```

自定义皮肤 ID 必须是 `custom-` 前缀加不超过 64 个 ASCII 字母、数字、`-` 或 `_`。目录名必须与 `id` 一致。

## 4. 已实现的 CSS 变量

覆盖这些 `--wb-*` 变量。没有 `--wb-bg-primary`。

```css
:root {
  --wb-bg: #0b0f19;
  --wb-surface: #111827;
  --wb-text: #f8fafc;
  --wb-text-muted: #94a3b8;
  --wb-accent: #38bdf8;
  --wb-border: rgba(148, 163, 184, 0.22);
  --wb-panel-opacity: 0.82;
  --wb-blur: 16px;
  --wb-chat-bg: #0b0f19;
  --wb-main-opacity: 0.78;
  --wb-bubble-user: #38bdf8;
  --wb-bubble-user-text: #0b1220;
  --wb-bubble-assistant: rgba(15, 23, 42, 0.86);
  --wb-bubble-assistant-text: #f8fafc;
  --wb-color-scheme: dark;
  --wb-font: inherit;
  --wb-bg-image: none;
}
```

## 5. 当前内核维护的选择器

不要使用未接入内核的通用类，例如 `.chat-bubble` 或 `.panel`。当前 `kernel.css` 实际覆盖的包括：

```css
html[data-wb-skin] .conversation-sidebar,
html[data-wb-skin] .sidebar-next,
html[data-wb-skin] .main-content,
html[data-wb-skin] .chat-container,
html[data-wb-skin] .knowledge-sidebar-pc {
  background-color: color-mix(
    in srgb,
    var(--wb-surface) calc(var(--wb-panel-opacity) * 100%),
    transparent
  ) !important;
  backdrop-filter: blur(var(--wb-blur)) saturate(140%) !important;
}

html[data-wb-skin] [class*="userMessageBubble"] {
  background-color: var(--wb-bubble-user) !important;
  color: var(--wb-bubble-user-text) !important;
}

html[data-wb-skin] [class*="assistantMessage"] {
  background-color: var(--wb-bubble-assistant) !important;
  color: var(--wb-bubble-assistant-text) !important;
}
```

舞台层由管理器注入，ID 为 `#wb-skin-stage` 与 `#wb-skin-portraits`。用户自定义 CSS 只应写在 `config.json` 的 `custom_css` 中，不要再复制进 `theme.css`。
