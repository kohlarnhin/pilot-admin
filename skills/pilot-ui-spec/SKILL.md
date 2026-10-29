---
name: pilot-ui-spec
description: 延续 Pilot Admin 的管理端视觉与交互规范：白色与 slate、中性控件和橙色品牌信号、固定外壳、独立滚动、虚拟化无限列表与共享 AI 助手。
---

# Pilot Admin UI 规范

在当前技术栈内延续本项目的布局比例、信息密度、字体、边界、控件状态与滚动行为。此规范是仓库内可直接复制的契约；证据路径见 [source-map.md](references/source-map.md)。整目录随 fork 保留，不依赖其他项目或个人技能目录。

## 工作流程

1. 检查现有路由、组件 API、样式与本次范围，保留现有技术选择。
2. 所有 UI 工作先读 [visual-system.md](references/visual-system.md)。涉及高度、侧栏和滚动时再读 [layout-and-scroll.md](references/layout-and-scroll.md)。
3. 按需读 [components.md](references/components.md)、[tables-and-loading.md](references/tables-and-loading.md)、[page-patterns.md](references/page-patterns.md) 与 [overlays-and-feedback.md](references/overlays-and-feedback.md)。
4. 先建立有限高度与滚动归属，再添加内容和状态。
5. 按 [acceptance.md](references/acceptance.md) 在运行中的真实页面验证，报告真实结果和限制。

## 必须保留的契约

- 管理侧栏宽 **224px**，折叠后 **88px**；品牌区高 **64px**。管理外壳没有独立全局顶栏，主区域直接开始。
- 外壳固定于视口；主区域 padding 为 **16px / 24px**，占满可用宽度。每个可收缩中间层必须有 `min-h-0` / `min-w-0`。
- 标题、工具栏、表头、必要操作栏固定；表格、会话消息、历史和长表单分别在自己的容器内滚动。数据增长不能撑高文档。
- 白色表面、浅 slate 一像素边界、克制阴影。控件、focus、checkbox、switch、选中背景全部中性 slate。普通按钮白底描边，唯一最强操作可用 slate-900 实心；危险操作用红色。
- 橙色 **#FDA92D** 仅用于品牌、当前位置、tab 下划线、进行中与新内容信号；不是通用交互色。完成进度用 **#10B981 / 80%**。可读品牌文字用 **#A85D13**。
- 字体为本地 **Open Sans Variable + Noto Sans SC**；标识、时间与代码为本地 **JetBrains Mono**。正文 **12–14px**；有意义的文字不低于 **11px**。PageHeader 为 20px/600。
- 普通控件高 **36px**、圆角 **8px**；内部卡片 **12px**、主卡片 **16px**；表头 **44–45px**。固定行编辑场景可用 **56px**，实际行高必须等于计算值。
- 大列表采用 service 分页的无限追加，加行虚拟化；不能先取全量再切片。默认每页 **20**，单请求锁、稳定 ID 去重、查询代次隔离、失败显式重试。
- 预取阈值为剩余滚动距离 ≤ **max(1200px, 可滚动距离 × 0.5)**。首屏用匹配骨架，刷新保留数据，正常追加安静。
- 标准管理表格在 **1280×720、侧栏展开**时可见操作列且无横向滚动；真正溢出只在表内滚动。长文本截断必须有 `title` 或完整查看/复制路径。
- 助手没有悬浮启动球，入口在侧栏底部。面板宽 **440px**、展开 **720px**，右/下距 **24px**，高 **min(760px, 视口高 − 48px)**，圆角 **16px**。头部和输入框固定，消息与历史各自滚动。
- 助手面板与 `/agent` 共用一个路由上层运行时。保留 Ctrl/⌘J、Esc 层级关闭、归还焦点、停止保护与历史 1px sentinel 无限滚动。
- 所有写操作有权限校验与确认；表单错误在字段内展示并关联 ARIA。异步弹窗提交期间阻止重复保存与关闭，失败保留输入。
- 动画遵循 reduced-motion；颜色不是唯一的状态提示。

## 参考资产

[reference.html](assets/reference.html) 是通用资源列表的静态示例，包含本地合成数据、分页追加、行窗口化与详情弹窗；不是应用截图。tokens.css 与 console.css 保留可移植数值，真实组件以 source-map.md 所指文件为准。项目使用 Lucide 图标和实线边界，以当前实现为准。
