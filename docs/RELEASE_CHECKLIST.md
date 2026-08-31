# 发版检查清单

macOS 是当前发布门槛。未完成下列门禁前，不得宣称可以发版、签名、公证或分发。

真实 WorkBuddy 验收必须使用一次性、无敏感内容的会话：不要记录 DOM 文本、消息正文、token、cookie 或鉴权头。

## 自动化门禁

- [ ] `pnpm check` passes
- [ ] `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` passes
- [ ] `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` passes
- [ ] `pnpm audit --prod --registry=https://registry.npmjs.org` reports no known vulnerabilities
- [ ] `cargo audit` passes
- [ ] macOS app bundle contains all built-in skin resources
- [ ] release binary contains no developer absolute paths

## 消毒后的真实主机验收

记录 WorkBuddy 版本与测试日期。未填写前视为未签字。

- WorkBuddy 版本：
- 测试日期：
- [ ] clean launch owns port 9333; occupied port is rejected
- [ ] theme A -> theme B -> reset leaves one then zero manager styles
- [ ] reset failure is shown as failure and retains active skin state
- [ ] graceful close preserves an unsent WorkBuddy draft in the sanitized manual test
- [ ] no WorkBuddy application files, cookies, tokens, or databases changed

## 尚未实现 / 不得作为卖点

- `.wbskin` 导入、导出、分享
- 用户上传壁纸与图片尺寸控制
- 自动更新、签名、公证
- Windows / Linux 原生主机验收
- 跨 WorkBuddy 版本的选择器兼容矩阵
