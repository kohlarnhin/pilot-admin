# 参与贡献

欢迎改进 Pilot Admin 的通用能力、二次开发体验、文档和细节。请保持业务无关的底座定位；较大的功能或交互变化可先通过 Issue 说明问题与范围。

## 本地开发

使用 Node 22+ 和 pnpm 10，具体 pnpm 版本由 `package.json` 的 `packageManager` 锁定。使用 nvm 时可运行 `nvm use` 读取 `.nvmrc`。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

默认地址为 http://localhost:3300，不需要 `.env` 文件或后端服务。演示账号、环境变量和数据重置方式见 [README](README.md)。

| 命令 | 用途 |
| --- | --- |
| `pnpm lint` | ESLint 检查，提交前须无 error |
| `pnpm typecheck` | TypeScript strict 检查 |
| `pnpm build` | 类型检查与生产构建 |
| `pnpm preview` | 预览生产构建 |

## 提交与 PR

1. Fork 仓库，在自己的工作分支完成一个范围明确的改动。
2. 保留无关改动，依赖使用 pnpm 管理并同步 `pnpm-lock.yaml`。
3. 完成下方验证，更新必要文档，向本仓库的 `main` 提交 PR。
4. 在 PR 中说明问题、结果、验证证据和剩余限制，按评审意见继续修改。

提交信息使用 Conventional Commits，可带 scope，主题使用简洁中文。历史中的示例：

```text
feat: AI 助手面板、Agent 模式与 mock 对话引擎，补齐开发文档（M2）
docs(ui-spec): UI 规范改为完整英文版，对齐 Pilot Admin 实际实现
chore: 初始化仓库
```

修复问题可使用 `fix: 修复具体问题`。不要把格式化、依赖升级和不相关功能混在同一变更中。

## 代码与界面约定

先读 [AGENTS.md](AGENTS.md)。涉及 UI 时，再读 [pilot-ui-spec](skills/pilot-ui-spec/SKILL.md) 和相关 references；沿用当前设计体系与组件 API。

- 页面通过 `src/api/services` 访问数据，不直接读写 Mock DB；写操作在 service 重新校验权限。
- 保留分页无限追加、虚拟化、ID 去重、代次保护及失败后的显式重试。
- 助手面板与 Agent 页面共用路由上层运行时；保留取消、账号隔离和计划停止语义。附件只传元数据。
- 不主动升级样式框架或增加测试框架；异步失败保留输入，字段错误内联并关联 ARIA。

扩展步骤请读 README 的 [添加页面与权限](README.md#添加页面与权限)、[添加 service 与 Mock](README.md#添加-service-与-mock)、[接真实后端](README.md#接真实后端)、[新增助手能力](README.md#新增助手能力) 和 [添加助手弹窗操作](README.md#添加助手弹窗操作)。

## 验证与交付

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

UI 改动必须在运行中的真实页面验证，附关键截图；在 **1280×720** 和 **1440×900** 检查操作列、文档不滚动、面板尺寸、长列表、键盘/焦点与错误恢复，并覆盖 admin、operator、viewer 三种角色。生产预览不得发送外部或后端请求。

本项目没有额外测试框架。请提供与改动对应的可复现步骤和实际检查结果；未执行的检查须明确说明。CI 会执行安装、lint、类型检查和构建，真实页面验证仍需在 PR 中记录。安全问题按 [SECURITY.md](SECURITY.md) 私密报告。
