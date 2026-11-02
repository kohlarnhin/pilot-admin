# 安全说明

## 支持范围

目前仅支持最新 `main` 分支；旧提交请先在最新代码中确认问题是否仍可复现。

## 演示环境边界

本项目是纯前端起点。Mock 登录、密码、角色、权限与 Token 均在浏览器中处理，数据保存在 localStorage，可由使用者查看或修改。Mock 认证与 RBAC **不是安全边界**，不能用于保护真实业务数据。

接入真实部署时，必须在服务端验证身份、Token 和每一次读写操作的 RBAC 权限，不能依赖页面隐藏按钮或前端路由守卫。真实模型密钥应由后端保存并仅返回掩码；`VITE_*` 环境变量会进入客户端可读取的配置，不得存放密钥。

## 安全报告

本仓库不启用 GitHub 私密漏洞报告，也不公开联系邮箱。请先[创建空白 Issue](https://github.com/kohlarnhin/pilot-admin/issues/new)，只写「存在安全问题，请安排私下联系」，由维护者 [kohlarnhin](https://github.com/kohlarnhin) 后续安排私下沟通。

**公开 Issue 不得包含漏洞细节、PoC、复现步骤、日志、截图、密钥或其他敏感信息。** 在维护者安排好私下联系前，不要公开补充这些内容。

私下报告时，请提供受影响的提交或版本、复现步骤、预期与实际结果及可能影响；提交任何材料前，先移除密码、Token、密钥和个人数据。贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，社区行为问题见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## Reporting in English

GitHub private vulnerability reporting is not enabled, and no contact email is published. [Open a blank issue](https://github.com/kohlarnhin/pilot-admin/issues/new) stating only that a security concern exists and requesting private contact. Maintainer [kohlarnhin](https://github.com/kohlarnhin) will follow up to arrange it. **Do not include vulnerability details, PoCs, reproduction steps, logs, screenshots, secrets or personal data in the public issue or its replies.** Share a sanitized report only after private contact is arranged.

The mock login, passwords, RBAC and tokens live in browser localStorage and are not a security boundary. Real backends must verify identity and authorize every operation; model keys must stay on the server, outside client-readable `VITE_*` variables. See [CONTRIBUTING.en.md](CONTRIBUTING.en.md) for the contribution workflow.
