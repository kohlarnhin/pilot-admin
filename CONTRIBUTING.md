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
| `pnpm i18n:check` | 字典、占位符一致性及 CJK 门禁 |
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
pnpm i18n:check
```

UI 改动必须在运行中的真实页面验证，附关键截图；在 **1280×720** 和 **1440×900** 检查操作列、文档不滚动、面板尺寸、长列表、键盘/焦点与错误恢复，并覆盖 admin、operator、viewer 三种角色。生产预览不得发送外部或后端请求。

本项目没有额外测试框架。请提供与改动对应的可复现步骤和实际检查结果；未执行的检查须明确说明。CI 会执行安装、lint、i18n:check、类型检查和构建，真实页面验证仍需在 PR 中记录。安全问题按 [SECURITY.md](SECURITY.md) 私密报告。

## 国际化约定与术语

可见系统文案放在 `src/i18n/locales`，中文 literal 是类型来源，英文保持 key 与 `{placeholder}` 集合完整一致。功能拥有自己的 namespace，新增时在两种语言根字典注册。React 使用 `useT()` 订阅；事件、service、store 使用实时读取语言的 `t()`。静态元数据只存 key，翻译后的 memo / 格式化器依赖 locale。不要把翻译文本作为状态、分组或错误类型的判别依据，应使用稳定代码或 HTTP 状态。

key 使用简短的语义名称，按列、表单、提示、对话框等用途嵌套分组（如 `users.columns.user`、`users.deleteDialog.content`），不截取或缩短原句来生成键名。每段必须符合 camelCase（`/^[a-z][a-zA-Z0-9]*$/`），长度不超过 24 个字符；门禁会报告违规路径。相同的通用词句放入 `common` 并复用（如 `common.actions.retry`、`common.toast.saveFailed`），措辞确有差异时才保留功能专用 key。服务错误按领域组织在 `serverErrors`，审计动作按稳定代码存储，渲染句子放在 `audit`。插值句子应保留为完整消息；需保留节点样式时使用 `tNode`，不要用多个翻译片段拼接句子。

英文按钮、标签用 sentence case，页面标题用 Title Case；按下表保留既定导航名称。没有复数引擎，优先 `Users: {count}` 等数量中性表达。数字使用 `formatNumber`，明确的日期格式保持原样。默认菜单 / 操作名与错误由服务边界本地化，稳定系统代码由界面翻译；用户输入、已存数据不随切换改写。已打开的命令式弹窗和 toast 保留打开语言。完整流程见 README 的「国际化」。

| 中文 | English | 中文 | English |
| --- | --- | --- | --- |
| 概览 | Overview | 系统管理 | System |
| 用户管理 | Users | 角色管理 | Roles |
| 菜单管理 | Menus | 系统设置 | Settings |
| 助手设置 | Assistant settings | AI 助手 | AI assistant |
| Agent 模式 | Agent mode | 示例 | Examples |
| 组件示例 | Components | 权限 | Permission |
| 按钮权限 | Action permission | 演示数据 | Demo data |
| 会话 | Conversation | 重置 | Reset |
| 新增 | Add / Create | 编辑 | Edit |
| 删除 | Delete | 启用 / 停用 | Enable / Disable |

提交前运行 `pnpm i18n:check`。allowlist 只用于有原因的原文精确例外（如原生语言名称），pending 当前为 `[]`，仅在分阶段迁移时使用。不要扩大例外规避检查；完成迁移后同步删除条目，过时条目会失败。

助手命令短语放在 `agentCommands`，匹配与取参统一使用 `src/agent/commands.ts`；不要在工具中写中文正则或按翻译后的文字判别交互。命令目录与 UI 标签用途不同，独立维护。工具回复按生成时语言保存，历史消息及已返回的卡片文案不随语言切换重译。
