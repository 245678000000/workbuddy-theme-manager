# 安全边界

WorkBuddy 皮肤管理器只在本机操作，并且只作用于它自己启动并记录的 WorkBuddy 调试会话。

## 管理器会做什么

- 以 `--remote-debugging-port=9333` 启动本机已安装的 WorkBuddy。
- 仅在端口空闲、且没有已验证的 WorkBuddy 进程时接管该 CDP 端点。
- 向已拥有会话中的 `page` 目标注入 CSS 和皮肤运行时 JavaScript。
- 把自定义皮肤写到 `~/.workbuddy-skins/`。
- 只向已验证属于当前安装路径的 PID 发送终止信号。

## 管理器不会做什么

- 不修改 `/Applications/WorkBuddy.app`、`app.asar`、签名、二进制、cookie、token、消息正文或生产数据库。
- 不连接不是本管理器启动并 `mark_owned` 的调试端口。
- 不根据 `WorkBuddy` / `editor_sdk` 这类名字子串杀进程。
- 不自动删除用户皮肤库里的无效目录。
- 不把 API 密钥、cookie、鉴权头或 WorkBuddy 消息内容写入日志或测试夹具。

## 本地 CDP

调试端口绑定在 `127.0.0.1:9333`。任何能访问该端口的本机进程都可以按 CDP 协议操作对应页面。因此：

- 启动前若 9333 已有 CDP 服务，管理器拒绝连接。
- 注入、预览、还原都不接受调用方传入的端口。
- WorkBuddy 退出或端点不可达时，会话所有权被清除。

## 数据与日志

- 自定义皮肤只保存在本机用户目录。
- 禁止记录凭证、cookie、token 或会话消息。
- 真实主机验收只记录版本、进程身份、端口所有权、目标数量/类型和通过/失败，不记录 DOM 文本。
