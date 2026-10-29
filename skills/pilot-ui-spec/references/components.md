# 组件契约

## 导航与侧栏

展开侧栏 224px，折叠 88px，品牌区域 64px。导航文字约 13px，组标题 11px；普通项圆角 8px，图标 18–20px。hover/active 背景为中性 slate，当前位置只以橙色图标或点表达。长名称可截断但必须提供 title。

mini 项的最小高度 58px、圆角 12px，图标 22px 在上、11px 标签在下、间隔约 6px。32px logo 仍居中，品牌文字隐藏，子菜单可由键盘和鼠标访问。

底部顺序为 AI 助手、可选使用手册、账号。入口约 36–40px 高；助手带快捷键与生成中的橙色点，没有悬浮启动球。账号下拉白底细框、12px 角、紧凑摘要和 13px 菜单项，退出为红色语义。

## 标题与卡片

管理列表使用 nonshrinking 的卡片标题：横 padding 24px、纵 20px，左侧 40px 图标槽和标题/描述/总数，右侧 search/actions 相隔 10px。标题常见 16px/500–600，描述 12px，标题 body 间细分隔。不要在卡片完整标题上方重复放页面标题。

独立 PageHeader 为 20px/600，back 控件 28px 方形、8px 圆角；描述 13px。主 Card 16px 圆角；内部 Card 12px。紧凑标题可用横 20/24px、纵 16px。

## 按钮、输入与选择

- 普通按钮高 36px、8px 圆角，白底 #E2E8F0 框，slate-800 字。hover slate-50 / slate-300 / slate-900。主要 filled 只使用 slate-900；危险红色。
- 常规按钮字 12–13px/500；图标操作 28–32px 方形、14–18px 图标、相隔 4px。禁用有语义 disabled 和减淡，不只是变灰。
- 输入高 36px、13px 字，8px 角；login large 高 40px。focus 是 slate ring/halo，prefix 为 slate-400。计数器使用 `12 / 100` 风格。
- Select 沿用相同高度与中性选中态。转发 id、aria-describedby、aria-required、aria-invalid，支持键盘。
- checkbox 和 switch 的选中颜色为 slate-900，普通行选中用 slate-100/透明；不使用橙色。
- 表单控件有真实 label，字段错误在下方，aria-invalid=true 且 aria-describedby 指向错误。错误不能只用 toast。

## 标签与小组件

Badge/Tag 默认白底细框、中性字，语义色点 6px；强状态可用 soft tint。ID、时间、版本使用等宽 CodeTag，完整值有 title。CopyButton 阻止事件穿透，约 1800ms 的已复制状态不改变布局，并始终能通过键盘操作。

Tabs 的选中背景/字色中性，可用橙色下划线表示当前位置。Tooltip 为截断内容、仅图标操作提供完整说明；不能把关键错误只藏在 hover 中。Popover、Dropdown、Dialog 要有清晰名称、Esc 行为和可见 focus，打开/关闭时归还触发点。

EmptyState 统一 48px 图标块、12px 角、24px slate-400 图标、14px/500 标题、12px slate-500 描述，间距约 12px，横 padding 24px、纵 32px；填满可用 body 并居中。没有数据、没有匹配、没有权限与失败必须区分。

全部基础控件的实际 API、variants、loading/disabled/validation 状态可在 `/examples/components` 查看。优先复用现有组件，不另建相似按钮或第二套 toast 系统。
