中文 | [English](README.en.md)

# Pilot Admin（领航）

可直接 fork 的通用 React 管理端起点，包含设计系统、固定侧栏、Mock 登录与 RBAC、管理页面、组件示例、AI 助手面板和全屏 Agent 模式。所有数据和助手执行都在浏览器中完成；默认没有后端请求或真实模型调用。

## 开箱即用

- 紧凑的白色 / slate 设计体系，固定侧栏、独立滚动区域与通用 UI 控件。
- Mock 登录、三种演示角色、菜单与按钮 RBAC，用户 / 角色 / 菜单 / 设置页面。
- 概览、全局搜索、虚拟化无限列表、路由懒加载与悬停预取。
- 共用会话运行时的 AI 助手与 Agent 模式，包含多轮工具、确认卡、计划执行和附件元数据演示。
- 可替换的 service 数据接缝、HTTP / SSE 工具、持久化演示数据及随仓库分发的 UI 规范。
- ESLint、类型检查、构建 CI，以及贡献、安全和双语入门文档。

## 快速开始

使用 Node 22+ 和 pnpm 10（仓库锁定 pnpm 10.8）。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:3300 。

| 账号 | 密码 | 可用范围 |
| --- | --- | --- |
| admin | admin123 | 全部页面、操作、助手与模型配置 |
| operator | operator123 | 概览、用户查看/编辑、组件示例、助手；无新增/删除用户权限 |
| viewer | viewer123 | 概览与组件示例；无助手权限 |

首次登录可选择管理后台或 Agent 模式，并记住选择；在账号菜单的「Agent 模式偏好」中修改。Ctrl/⌘K 搜索页面与用户，最近访问按账号保存；Ctrl/⌘J 打开助手，Esc 先关闭历史再关闭面板。侧栏折叠状态会保留。

演示数据包含 150 位用户、3 个角色和管理员的 25 个历史会话，其中一个会话有 60 条消息。写操作、偏好、草稿和会话均保存在当前浏览器中。同源标签页共享演示 DB；它不是服务端账号系统。

## 目录

```text
src/
  config/             品牌与静态菜单、按钮权限
  ui/                 基础控件与反馈组件
  components/
    layout/ nav/      管理外壳与导航
    common/ search/   通用组件与全局搜索
    assistant/        面板、共享运行时、交互卡和 actions 注册表
  agent/              全屏 Agent、入口和偏好弹窗
  api/
    http.ts           真实后端 Axios 接缝、Token 与 401 刷新
    sse.ts            真实后端流式事件解析器（默认不用）
    services/         唯一数据接缝；当前调用 mock
  mock/
    seed.ts db.ts     确定性数据、v4 存储与重置
    agent/            通用流式引擎、会话与 tools 工具注册表
  hooks/ store/       无限列表、虚拟化、认证、应用和助手状态
  pages/              登录、概览、系统页面、组件示例与错误页
  routes/             页面注册表、访问判断、悬停预取与路由配置
  types/ utils/       通用类型、错误恢复等
skills/pilot-ui-spec/  可随 fork 复制的 UI 契约、参考资产与实现映射
```

## 换品牌

1. 修改 `src/config/app.ts` 的 `name`、`shortName`、`zhName` 和 `description`。默认介绍的双语文案在 `src/i18n/locales/zh-CN/common.ts` / `src/i18n/locales/en-US/common.ts` 的 `appDescription`；系统设置保存的自定义介绍保留原文。未配置 `helpUrl` 时，所有「使用手册」入口隐藏。
2. 替换 `src/components/logo/index.tsx` 和 `public/favicon.svg`。本地演示助手资料的默认值在 `src/mock/seed.ts`，运行时默认资料在 `agentProfileService.ts`。
3. 按需修改 `tailwind.config.js` 中的 `brand` 色阶。橙色仅表示品牌、当前位置与进行中，按钮、focus、checkbox 和 switch 保持 slate。
4. 已持久化的站点名称优先于种子。改动默认值后，重置演示数据查看新品牌。

## 添加页面与权限

只需三个步骤，无需修改 `routes/index.tsx`、预取映射或图标路径表：

1. 在 `src/pages/<feature>/index.tsx` 导出页面，复用 PageHeader、Card、FixedTable 和现有 UI。先读 `skills/pilot-ui-spec/SKILL.md` 及相关 references。
2. 在 `src/routes/routeModules.ts` 的 `adminPages` 中添加一个 `definePage`：

   ```ts
   definePage({
     path: '/examples/projects',
     load: () => import('../pages/projects').then((module) => ({ default: module.ProjectsPage })),
   }),
   ```

3. 在 `src/config/menus.ts` 添加菜单（稳定 `id`、相同的 `route_path`、`sort_no`、`icon`）及可选按钮权限，默认名称在两种语言的 `menu` / `button` 字典中按 id 定义。图标直接使用 `src/components/icon/registry.ts` 已注册的 Lucide 名称；不需要另一份路径映射。

注册表在模块作用域创建 lazy 组件；路由、已知页面判断与 hover/focus 预取共用缓存 loader。无路由分组不预取，实际重定向沿用统一的可访问首页选择。

默认 `access: 'menu'` 要求已授权、可见且启用的菜单。额外条件写为 `requires: ['project:manage']`，所有权限都满足才可进入；路由守卫、侧栏、搜索、首页和登录落点使用 `src/routes/access.ts` 的同一个规则。`access: 'authenticated'` 用于不需要菜单的登录后页面，可通过链接进入。页面用 `usePermission('project:create')`、`useCan()` 或 `<Access permission={...} fallback={...}>` 控制按钮，service 仍须重新校验权限。`useCan()` / `Access` 支持数组和 `mode="all" | "any"`（默认 all）。`useDataChanged(handler)` 订阅助手写入后的数据变更信号。

Mock DB 的权限目录递归覆盖所有层级。种子只有管理员角色设有内部 `auto_grant: true`；新增角色默认为 false。DB 加载及跨标签页存储重载时，auto_grant 角色只获得目录中新出现的菜单/按钮，已手动撤回的旧权限不会恢复；所有角色都会补齐已授权菜单缺失的无路由祖先，不会自动授予有路由的祖先。历史目录只增不减，删除的声明和残留授权不生效，角色计数只统计当前声明。因此新增页面通常无需改角色种子或重置数据；其他角色仍在角色管理中按需授权，角色种子只用于可选的默认授权。真实后端自行决定并校验授权，不依赖这套 Mock 同步。

非路由权限可放在类似 `ai-permissions` 的独立组中。空组不出现在侧栏，但其按钮会进入 me 的权限集合。`/agent` 通过 `agent:use` 守卫，助手设置同时需要页面菜单与 `agent-config:view`。已持久化的菜单自定义名称始终优先于默认名称。

## 添加 service 与 Mock

页面只从 `src/api/services/*` 获取数据，不直接访问 DB。新增实体时：

1. 在 `src/types/index.ts` 定义类型，在 `src/mock/seed.ts` 添加确定性种子。
2. 在 `db.ts` 补充形状校验；不兼容的存储结构要升级 `MOCK_DB_KEY` 和 `version`。损坏或旧结构回退种子。
3. service 使用 `delay()`、`response()`、`pageResult()`，返回 `ApiResponse<T>` 或 `PageResult<T>`。分页字段为 `records / pageNo / pageSize / total / hasNext`。
4. 使用 `updateMockDb()` 持久化，存储失败会抛错。不要在页面重复实现延迟、分页或权限。
5. 大列表接 `useInfinitePage` 与 `FixedTable`，保留每页 20 条、静默追加、ID 去重、代次隔离和显式重试；不增加页码分页。

`createUser()` 统一生成默认 10 位随机密码并返回 `initial_password`。若密码策略要求更长，则使用策略长度。页面只在创建成功弹窗中展示和复制；查询接口不返回密码。助手新增用户使用同一接口，并在本次创建回复中显示账号和初始密码；该回复随会话保留。

## 接真实后端

逐个替换 `src/api/services/*` 的函数体，页面和 UI 不需要依赖 Mock：

```ts
const response = await http.get<ApiResponse<PageResult<User>>>('/users', { params });
return response.data;
```

`src/api/http.ts` 默认 baseURL 为 `/api`，附加 access token；401 用 refresh token 单飞刷新，并兼顾跨标签页轮换与未授权退出。`authService` 的 login/getMe/changePassword/patchPreferences 应改为服务端接口，返回现有类型。`authStore` 继续负责 initAuth、generation 隔离、me 刷新与 logout；`tokenStorage.ts` 负责持久化及跨标签页会话变化。真实后端必须自行执行 RBAC；Mock token 只用于本地演示。

在 `agentService.ts` 中将 `chatStream` / `continuePlan` 改为 `runSseStream<AgentChatResult>()`，其余会话与计划方法改用 http。`sse.ts` 默认未被运行时使用，不会发起请求。

```ts
return runSseStream<AgentChatResult>('/api/agent/chat', payload, {
  onStart, onDelta, onProgress, signal,
});
```

SSE 使用 UTF-8、POST JSON、`Authorization: Bearer …`；支持一次 401 刷新重试。每个事件由空行结束，data 可跨行：

```text
event: start
data: {"sessionId":"s1","userMessageId":"m1"}

event: delta
data: {"content":"正在整理"}

event: progress
data: {"stage":"checking","message":"正在检查账号…","elapsedSeconds":1}

event: result
data: {"code":0,"message":"success","data":{"sessionId":"s1","messageId":"m2","message":"完成","data_changed":false,"choices":[]}}

```

错误用 `event: error` 和 `{"code":123,"message":"可读错误"}`。兼容源协议的 `done` 终态别名；缺少结果的断流视为错误。配置超时或 AbortSignal 会取消 reader。真实 agentService 在 `data_changed` 后调用 `triggerDataChangeSideEffects()`，通知概览和用户页刷新。模型配置的 API key 由真实后端保存密文，列表只返回掩码；当前演示配置只保存在浏览器且从不调用。

## 新增助手能力

每个工具是 `src/mock/agent/tools/` 中的独立模块，实现 `types.ts` 的 `AgentTool`，在 `index.ts` 的有序 `agentTools` 注册表中加入；fallback 始终最后。新增多轮工具无需修改 `engine.ts`。以 `createUser.ts` 为完整参考：

1. `match(text, ctx)` 匹配入口，`handle(ctx)` 校验权限并返回角色 choices，同时用 `task: { name }` 保存下一轮所需状态。
2. 引擎将工具 ID 和状态保存在消息的 `task_context: { tool, data }` 中。点击选项时，自动调用该工具的 `onChoice(ctx, choiceId, task)`，不再按输入文字猜测工具。
3. `onChoice` 处理角色选择，返回确认 choices 和新的 `task: { name, roleId }`；确认后通过 `userService` 创建账号并返回 Markdown。每轮继续校验权限，修改成功后调用 `triggerDataChangeSideEffects()`，让已打开页面刷新。

```ts
export const myTool: AgentTool = {
  id: 'my-tool',
  match: text => text.includes('我的任务'),
  handle: async () => ({
    message: '是否继续？',
    choices: [{ id: 'next', label: '继续' }],
    task: { stage: 'ready' },
  }),
  onChoice: async (ctx, choiceId, task) => {
    ctx.signal?.throwIfAborted();
    return { message: `收到 ${choiceId}，上一步状态为 ${task.data.stage}。` };
  },
};
```

`ctx` 含当前用户 ID、菜单、权限、AbortSignal 和附件元数据。可选 hooks 还包括 `onSelection(ctx, selectedIds, task)`（参考 `disableUsers.ts`）与 `onActionOutcome(ctx, outcome, task)`（参考 `assignRoles.ts`）。通用 `prompt:*` choices 会重新匹配注册表，`cancel` 由引擎取消；其他 choice ID 交给工具。只接受最新且未提交的交互，选择数量与选项 ID 由引擎校验，具体操作仍由 service 重新校验。

计划工具参考 `accountAudit.ts`：首轮返回 `execution_plan` 卡片，工具的 `plan.runStep(ctx, plan, stepIndex, task)` 负责每一步读取、计算和最终报告，返回 `ToolReply`。若返回 `task`，引擎会更新原计划的状态数据，供下一步或继续执行时使用。引擎统一管理 executionId、步骤状态、持久化和停止语义；「停止」让当前步骤完成，其余步骤停止，「继续执行」使用新 executionId 跳过已完成步骤。工具处理耗时工作时应检查 `ctx.signal`。

内置工具还包括帮助、概况统计、查找用户、打开页面、模拟错误、附件元数据与 fallback。所有读写均通过 service；operator 新增用户会被拒绝，确认不会提升权限。弹窗工具配合下方的**客户端操作注册表**，工具 hook 负责结果续话，弹窗负责交互和 service 调用。

附件规则：仅接收名称、大小、MIME 类型和可选行数。`.txt/.csv/.json` 的行数在浏览器局部计算；不把文件正文、原始文件或解析内容放进消息、持久层或网络。默认最大 5 MB。

## 添加助手弹窗操作

1. 在 `src/components/assistant/actions/` 创建组件，接收 `AssistantActionProps` 的 `onComplete(outcome)` 和 `onCancel()`。
2. 调用 `registerAssistantAction('feature.action', Component)`，并在 `PageActionCard.tsx` 的模块入口引入注册模块。
3. 工具返回 `interaction: { type: 'page_action', version: 1, action: 'modal', actionKey: 'feature.action', title, description }`。
4. 弹窗通过 service 执行业务，完成后 `await onComplete({ status: 'completed', summary, count })`；取消走 `onCancel`。PageActionCard 统一调用 `recordPageActionOutcome`，保存卡片终态并在原会话续上摘要。保存失败可重试，不能重复执行已成功的写入。

内置 `users.assign-role` 演示用户分页选择、角色替换、部分成功后重试与取消。面板和 `/agent` 只有一个 AssistantRuntime；不要在新页面另建聊天实例。执行计划的「停止」等待当前步骤完成，「停止生成」取消当前流。

## 重置与存储边界

系统设置 → 演示数据 →「重置演示数据」恢复所有种子，包含 150 用户、3 角色、模型资料和 25 个管理员历史会话，清理助手草稿/对话缓存并重新载入。也可从 service 调用 `settingsService.resetDemoData()`，内部使用 `resetMockDb()`。

DB key 为 `pilot-admin:mock-db:v4`；本次从 v3 升级会一次性重置演示数据，并在读取时清理旧版本 DB key。每个用户最多保留 60 个会话、每会话 200 条消息；每条正文最多 16000 字符，本地最近对话缓存最多 100 条。附件不缓存正文。浏览器完成通知按用户选择启用，仅对实时完成事件触发；历史恢复不会重复通知。

## 环境变量

默认不需要 `.env` 文件。需要配置真实后端接缝时，可将 `.env.example` 复制为 `.env.local`；`.env*` 文件被 Git 忽略，仅提交 `.env.example`。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | HTTP 两个 Axios 实例及 SSE 相对路径的基础地址，可设根路径或完整 HTTP(S) URL |
| `VITE_DEV_PROXY_TARGET` | 空 | 仅开发服务使用的代理目标，留空不启用代理 |

代理按 API base 的路径部分匹配同源请求，保留路径前缀，设置 `changeOrigin: true`，不代理 WebSocket。例如 base 为 `/api`、target 为 `http://localhost:8080` 时，`/api/users` 转发到 `http://localhost:8080/api/users`。完整 API URL 会直接访问对应地址，不经过开发代理。`pnpm preview` 不启用代理，默认 Mock 流程也不会因为配置了变量而自动调用后端。

HTTP 调用中的 `/users` 由 Axios 结合 API base。SSE 的 `agent/chat`、`./agent/chat` 使用 API base；以 `/` 开头的路径和完整 URL 按原值请求，因此现有 `/api/agent/chat` 不会重复加前缀。需要跟随自定义 base 时，使用无前导斜杠的 SSE 路径。

`VITE_*` 变量可被客户端读取，不得填写密码、Token 或模型密钥。修改环境变量后需重启开发服务；生产配置在构建时生效。

## 国际化

默认语言为 `zh-CN`，不读取浏览器语言。登录页右上角与账号菜单的「语言」入口可切换简体中文 / English，无需刷新页面；选择保存在 `pilot-admin:locale:v1`，同源标签页跟随切换。`src/config/app.ts` 配置默认语言和原生语言名称。

- 字典按功能存放在 `src/i18n/locales/zh-CN/<namespace>.ts`，以中文 literal 为源，导出 `as const` 对象；`en-US` 对应文件使用 `LocalizedDictionary<typeof source>` 校验。新增 namespace 后在两种语言的 `index.ts` 注册，缺失或多余 key 会导致类型错误。
- React 渲染使用 `const { t, locale } = useT()`；service、store 和事件处理可调用非 hook 的 `t()`，每次调用读取当前语言。静态 METRICS / SECTIONS 等只存 `MessageKey`，在订阅语言的渲染处翻译；翻译后的列定义、格式化器等 memo 必须依赖 `locale`。

  ```tsx
  const { t } = useT();
  t('auth.login');
  t('auth.loginTitle', { name: 'My Admin' });
  // 未知 key、遗漏 name、错误参数名或为无参数 key 传参都会报类型错误。
  ```

- `{name}` 插值参数从中文 literal 推导，值为 string / number。运行时按当前语言 → 中文 → key 回退；开发环境缺少参数会保留占位符并警告。`formatNumber` 使用当前语言，dayjs 随语言切换；已有明确的日期格式保持不变。
- 不引入复数引擎。英文优先使用不依赖单复数的表达，如 `Users: {count}`，避免在数量可能为 1 时固定使用复数名词。
- 默认菜单与按钮名称在 `mockMenus()` 请求时按 `menu.<id>` / `button.<id>` 本地化，重命名覆盖在两种语言下都保留；HTTP 与 SSE 传 `Accept-Language`。概览待办返回稳定 code，页面在渲染时翻译；真实后端可按同一边界返回代码或已本地化错误。
- 切换会更新 html lang / dayjs、清查询缓存、刷新已登录账号的 me，并通过 `useDataChanged` 发出 `locale` 原因。无限列表将 locale 纳入作用域，丢弃旧语言响应，刷新已加载范围并尽量保留滚动位置。路由、助手面板、草稿和已存会话不变；已打开的命令式弹窗 / toast 保留打开时语言。
- 本轮覆盖外壳、登录、搜索、概览、错误页和基础控件；后台管理页面、其他 service、种子及助手正文仍在 M5b / M5c 待迁移列表中。用户、角色、会话和活动等已存数据不随切换重译；按创建/重置时语言生成种子的规则将在 M5b 完成。

运行 `pnpm i18n:check` 检查两种语言的 key / 占位符一致性，以及源代码中的 CJK 字符串、模板、JSX 与正则。注释不参与检查；`scripts/i18n-allowlist.json` 仅接受带原因的文件 + 原文精确例外，`scripts/i18n-pending.json` 是后续里程碑待迁移文件。过时例外和已无 CJK 的 pending 条目会使检查失败，不能靠扩大豁免绕过迁移。

## 脚本与验证

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 0.0.0.0:3300 开发服务，不自动打开浏览器，默认无代理 |
| `pnpm lint` | ESLint 检查，须无 error；保留 Hooks 依赖和 Fast Refresh 警告 |
| `pnpm i18n:check` | 字典 / 占位符一致性和源代码 CJK 门禁 |
| `pnpm typecheck` | TypeScript strict 检查 |
| `pnpm build` | `tsc -b && vite build` |
| `pnpm preview` | 本地预览生产构建，可加 `--port 3300` |

提交前跑 `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build && pnpm i18n:check`。UI 改动必须启动真实页面，在 1280×720 和 1440×900 操作并检查滚动、三种角色权限、焦点与错误恢复；生产预览不应发送外部或后端请求。无测试框架依赖；项目内 AI 工作约定见 AGENTS.md，视觉契约见 `skills/pilot-ui-spec/`。

## 路线图

- 国际化：逐步提供 zh-CN / en-US，覆盖管理页面、助手和工具交互。
- 通用功能：操作日志、标准 CRUD 模板与个人中心。
- 细节与性能：真实页面体验巡检、助手与 Markdown 加载优化、完善使用文档。

以上为后续里程碑，当前功能以代码和本文前述说明为准。

## 参与贡献

开发流程、提交规范和验证要求见 [CONTRIBUTING.md](CONTRIBUTING.md)。安全边界与私密漏洞报告方式见 [SECURITY.md](SECURITY.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

项目代码使用 [MIT 许可证](LICENSE)。第三方依赖遵循各自的许可证。
