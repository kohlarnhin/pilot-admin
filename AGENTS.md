# Pilot Admin 开发约定

本仓库是业务无关、纯前端的管理端起点。保留通用账号、角色、菜单、设置、组件示例与助手模式，不把某个业务领域放进基础层。

## 栈与命令

React 19、TypeScript strict、Vite 6、Tailwind 3.4、Radix、zustand 5、react-router 7、Lucide、sonner；pnpm 10，Node 22+。保持现有依赖和组件 API，不主动升级样式框架或增加测试框架。

- `pnpm install --frozen-lockfile`
- `pnpm dev`：http://localhost:3300，无代理
- `pnpm lint`
- `pnpm i18n:check`
- `pnpm typecheck`
- `pnpm build`
- `pnpm preview`

## 修改前先读

UI 工作必须先读 `skills/pilot-ui-spec/SKILL.md`、`references/visual-system.md`，布局与滚动再读 `layout-and-scroll.md`，按功能补充 components、tables-and-loading、page-patterns、overlays-and-feedback。不要重新设计既有视觉系统。

先检查工作树和现有实现，保护无关改动。选择常规实现细节并完成相关修复与验证；不要仅给计划或反复请求批准。只在行为、范围或风险存在不能推断的关键选择时询问。遵从任务明确的只读、等待和提交限制。

## 文件职责

- `src/ui`：通用基础控件，无业务依赖。
- `src/components/common`、`layout`、`nav`、`search`：通用组件、外壳和导航。
- `src/pages`：页面组合；页面不能直接读写 Mock DB。
- `src/config/app.ts`：唯一品牌配置；logo 与 favicon 可独立替换。
- `src/config/menus.ts`：稳定菜单与按钮权限，角色授权不能靠硬编码账号。
- `src/routes/routeModules.ts`：页面注册表、cached lazy loader 与悬停预取；新增页面只注册一次并声明菜单。
- `src/routes/access.ts`：页面访问、首页与导航落点的统一判断。
- `src/api/services`：唯一数据接缝。当前调用 `src/mock`，接真后端时只替换 service 函数体。
- `src/mock`：类型化种子、延迟、分页与持久化；形状升级时 bump 版本并保留损坏数据回退。
- `src/components/assistant` 和 `src/agent`：两个宿主共用路由上层的一个运行时。
- `src/mock/agent/tools/`：工具模块与有序注册表；首轮、选择、确认、弹窗结果和计划步骤由工具拥有，通过现有 service 并接受 RBAC。引擎只管理通用生命周期。
- `src/components/assistant/actions/registry.ts`：客户端弹窗操作注册表。
- `src/api/http.ts`、`sse.ts`：真实后端接缝，默认不发送请求。

## 代码与交互

可见文案放在 `src/i18n/locales`，zh-CN 为源、en-US 同步；静态元数据保存 MessageKey，在订阅语言的渲染处翻译。已有命名和 concise 中文注释保持一致。Mock 和 service 一行一个语句，对象多行排版。不要重构任务无关代码。

列表使用分页无限追加和虚拟化，保留 ID 去重、代次保护、真实滚动容器及失败显式重试。每个可收缩中间层有 min-h-0 / min-w-0。异步提交阻止重复操作，失败保留输入；字段错误内联并关联 ARIA。

助手必须保留 abort/generation 保护、按用户隔离的草稿与会话、共享运行时、停止后当前步骤完成的语义。权限变更后刷新 me；service 始终重新校验，不依赖按钮隐藏。文件内容从不发送给助手，只允许元数据；不要把原始文件或正文写入消息、localStorage 或请求。

## 验证与交付

运行 lint、类型检查、构建和 i18n:check；不得跳过或放宽现有检查。涉及 UI 必须用运行中的真实页面验证，在 **1280×720** 和 **1440×900** 检查操作列、文档不滚动、面板尺寸、长列表、键盘/焦点、错误恢复及三种角色权限。生产预览不应发送外部或后端请求。

如任务指定 artifacts 目录，将截图、日志和临时检查脚本放在那里；不把这些当成项目源码。报告实际执行的检查、结果和限制，不宣称未执行的验证。除非任务授权，不提交、推送、创建分支或改写历史。
