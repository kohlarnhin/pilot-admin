# 布局与滚动

## 外壳几何

管理侧栏固定，宽 224px / 折叠 88px，品牌区高 64px、横向 padding 20px。主区域没有全局顶栏，直接在视口顶部开始；padding 为 16px，≥1024px 时 24px，占满可用宽度。侧栏宽度与主列水平偏移在同一 300ms 过渡内变化，只选一种 grid/padding/margin 机制，不能重复计算。

Agent 是独立外壳：顶栏 56px，历史侧栏 260px，聊天主列可收缩。不要将这个顶栏带入管理外壳。

```css
.shell { height: 100dvh; display: flex; overflow: hidden; }
.main, .page, .panel { min-height: 0; min-width: 0; display: flex; flex-direction: column; }
.main, .page, .panel-body { flex: 1 1 0; }
.main, .page, .panel { overflow: hidden; }
.panel-header, .panel-footer { flex: 0 0 auto; }
.panel-body { min-height: 0; min-width: 0; overflow: auto; }
```

有限高度必须从视口传递到真实滚动容器。每个可收缩的垂直中间层都有 min-height:0，横向中间层有 min-width:0。Flex/Grid 子项默认 min-size:auto 可能阻止缩小。`overflow:auto` 本身不会创造有限高度；不要用页面上随意的固定像素高度掩盖断链。

720px 的视口中，主区域纵向 padding 48px 后只剩 672px；减掉标题、工具栏和表头，剩余部分给表格 body。标题、filters、表头和必要 footer 是 nonshrinking 子项；不要各自 absolute/fixed 叠放。

## 滚动归属

| 区域 | 谁滚动 |
| --- | --- |
| 管理外壳 | 文档不滚动 |
| 侧栏 | 只有菜单列表，品牌/搜索/账号固定 |
| 标准管理页 | 表格在自己的卡片里滚动 |
| 概览 | main 内单一滚动区域 |
| 设置 | 分类面板与右侧长内容分别受限 |
| 助手 | 消息与历史分别滚动；头和 composer 固定 |
| Agent | 历史和消息各有 scroller；顶栏固定 |
| 弹窗/抽屉 | 有限 body 滚动；标题与操作 footer 可见 |
| 登录 | 独立的自然最小视口页面 |

空态和初始骨架占据同一个有限 body，不能缩成顶部一小块，也不能先闪出“无数据”。增长的列表不能撑高 document 或推动相邻面板。

真实滚动元素用于 listener、IntersectionObserver.root、虚拟化测量和 ResizeObserver；不是外层装饰卡片。滚动条细且克制，悬停加深，避免可见的重复双滚动条。

## 表头与横向溢出

原生表格可用白色 sticky top:0 表头；虚拟表格按 FixedTable 的实际内部结构处理，避免复制一个不同步的表头。表头高 44–45px，操作列固定宽，姓名/代码列可伸缩。

在 1280×720、224px 侧栏展开时，管理卡片可用宽约 996px。标准用户和角色表要完整显示操作列，无横向滚动；先压缩柔性列并截断，不挤掉操作列。真实最小宽度超过容器时，只在表内横向滚动。sticky 列有不透明背景，1px #EDF1F5 固定列分隔仅在横向可滚时显示。

## 多面板与覆盖层

设置分类宽 256px，≥1280px 时 288px，间隔 16–20px；两边都要有限高度。详情弹窗和可复用工作区同样让长文本自己滚动。放大或窄屏时不能让操作 footer 落到不可达位置。

助手 440px / 展开 720px，右下各 24px，高 min(760px, 视口 − 48px)。1280px 展开时左边界至少在侧栏右侧。面板 z 层高于页面，模态操作更高。非模态面板不阻断后台页面，但真正 modal 时后台必须 inert。

排查顺序：检查 document 是否溢出 → 从滚动元素向上逐层检查有限高度和 min-h-0 → 检查 flex-shrink/基准值 → 检查 min-w-0 和真正的 scrollWidth → 检查弹层与焦点。不能靠 document overflow:hidden 掩盖内容或操作已被裁掉的问题。
