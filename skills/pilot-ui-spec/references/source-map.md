# Pilot Admin 实现映射

所有路径相对于本仓库，无需访问其他项目。静态 assets 是通用演示；真实行为由下面的文件提供。

| 文件 | 契约 |
| --- | --- |
| `tailwind.config.js`、`src/index.css` | 品牌/状态色、line、圆角、阴影、字体与助手动画 |
| `src/main.tsx` | 本地字体与应用挂载 |
| `src/App.tsx` | 错误边界、TooltipProvider、Toaster、ModalHost |
| `src/components/layout/AppLayout.tsx` | 白色固定外壳、16/24px padding、菜单路由守卫、Agent 返回条 |
| `src/components/layout/Sidebar.tsx` | 224/88px 导航、64px 品牌区、搜索/助手/账号入口 |
| `src/components/nav/` | 展开与 mini 导航、中性选中态与橙色当前位置 |
| `src/components/common/PageHeader.tsx`、`PageSkeleton.tsx`、`EmptyState.tsx`、`CopyButton.tsx` | 页面标题、匹配骨架、空态与约 1800ms 复制反馈 |
| `src/ui/` | 36px 控件、8/12/16px 圆角、ARIA 表单、异步弹窗、表格与反馈 API |
| `src/components/common/FixedTable.tsx` | 实际滚动容器、行虚拟化、操作列与静默预取 |
| `src/hooks/useInfinitePage.ts`、`useInfiniteScrollLoader.ts`、`useFixedRowVirtualizer.ts` | 20 条分批、代次隔离、1200px/0.5 阈值、窗口化 |
| `src/pages/users/index.tsx`、`src/pages/roles/index.tsx` | 标准管理列表、角色权限树、1280px 操作列可见 |
| `src/pages/settings/index.tsx` | 256/288px 分类卡、独立内容滚动、演示重置 |
| `src/pages/assistant/index.tsx`、`src/pages/settings/AgentConfigPanel.tsx` | 助手资料、预览、模型配置与掩码密钥 |
| `src/pages/dashboard/index.tsx` | 主区域滚动、指标卡与活动列表 |
| `src/pages/login/index.tsx` | 380px 居中白色表单、40px 输入、内联错误 |
| `src/components/search/GlobalSearchPalette.tsx` | 720px Cmd+K 搜索、按用户持久化的最近访问 |
| `src/components/assistant/AssistantRuntime.tsx`、`useAssistantChat.ts` | 路由上层唯一运行时、流式处理、竞态保护、草稿与会话 |
| `src/components/assistant/AssistantPanel.tsx`、`AssistantHeader.tsx`、`Composer.tsx` | 440/720px 面板、180ms 入场、固定头尾 |
| `src/components/assistant/SessionHistory.tsx`、`useAssistantScroll.ts` | 历史分组、sentinel 无限追加、向上分页和滚动锚点 |
| `src/components/assistant/SelectionCard.tsx`、`ExecutionPlanCard.tsx`、`PageActionCard.tsx` | 通用交互卡、计划真实状态、客户端操作 |
| `src/agent/AgentPage.tsx` | 56px Agent 顶栏、260px 会话侧栏、与面板共享消息 |
| `src/mock/agent/`、`src/api/services/agentService.ts`、`src/api/sse.ts` | Mock 意图/计划与真实后端 SSE 接缝 |
| `src/config/menus.ts`、`src/mock/access.ts` | 菜单、页面、按钮及独立助手权限组 |

## 实现选择

- 管理外壳没有全局顶栏；56px 只用于独立 Agent 页。
- 导航与卡片保留当前 Lucide 图标、实线边界和 source 组件 API；规范中的旧图标/虚线描述已统一。
- 字体全部本地托管，普通文本与交互层保持中性。
- 标准用户列表查询采用 350ms 防抖的搜索即输入，不需要额外点击搜索。
- 模型配置仅用于演示启用状态，不进行网络请求。文件正文只在浏览器局部计算行数，消息仅带元数据。
- 静态示例不代表真实应用的权限、持久化、会话或所有组件；验证以真实页面为准。
