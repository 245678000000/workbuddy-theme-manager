#!/usr/bin/env bash
set -e

# ==============================================================================
# WorkBuddy 皮肤管理器 · 一键发布与版本递增脚本
# ==============================================================================

if [ -z "$1" ]; then
  echo "❌ 错误: 请指定要发布的新版本号，例如: ./scripts/release.sh 1.0.1"
  exit 1
fi

NEW_VERSION="$1"
TAG="v$NEW_VERSION"

echo "🚀 准备发布 WorkBuddy 皮肤管理器版本: $TAG"

# 1. 运行本地全栈严格检查
echo "🧪 正在执行本地全栈门禁验证 (Typecheck, Vitest, Cargo Test, Vite Build)..."
pnpm check

# 2. 同步更新各配置文件版本号
echo "📝 正在同步版本号到 package.json, Cargo.toml 与 tauri.conf.json..."
# Node / package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Tauri / tauri.conf.json
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
conf.version = '$NEW_VERSION';
fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
"

# Rust / Cargo.toml
sed -i '' 's/^version = ".*"/version = "'"$NEW_VERSION"'"/' src-tauri/Cargo.toml

# 3. 提交更改并打 Tag
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore(release): bump version to $TAG" || true
git tag -a "$TAG" -m "Release $TAG"

echo "=============================================================================="
echo "🎉 版本 $TAG 已就绪！"
echo "👉 请执行以下命令推送到 GitHub 触发自动发布流水线："
echo ""
echo "   git push origin main --tags"
echo ""
echo "GitHub Actions 将会自动编译全平台 DMG 与安装包并创建 Release，客户端将秒级检测到更新！"
echo "=============================================================================="
