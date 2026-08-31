# WorkBuddy 皮肤包制作与规范指南

## 1. 皮肤包结构 (`.wbskin`)

`.wbskin` 文件本质上是一个标准的 Zip 压缩包，解压后包含以下文件：

```
my-theme.wbskin
├── manifest.json       # 皮肤元数据信息
├── theme.css           # 注入的核心 CSS 样式表
├── config.json         # 皮肤默认调节参数（可选）
└── preview.png         # 预览缩略图（推荐 600x400）
```

---

## 2. `manifest.json` 字段规范

```json
{
  "id": "my-custom-theme",
  "name": "极简深海蓝",
  "version": "1.0.0",
  "author": "创作者名称",
  "description": "专为夜间专注打造的深海蓝配色",
  "themeMode": "dark",
  "accentColor": "#38bdf8",
  "targetVersion": ">=1.0.0"
}
```

---

## 3. `theme.css` 常用样式覆写

可以通过覆盖根变量和常用 UI 组件类来实现深度定制：

```css
:root {
  --wb-accent: #38bdf8 !important;
  --wb-bg-primary: #0b0f19 !important;
}

/* 全局背景与毛玻璃 */
body, .app-container {
  background-color: #0b0f19 !important;
}

/* 聊天气泡与面板毛玻璃 */
.chat-bubble, .panel {
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  background: rgba(15, 23, 42, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}
```
