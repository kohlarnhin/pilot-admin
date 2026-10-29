# 表格、无限加载与虚拟化

## 呈现

白色 16px 角卡片，nonshrinking 工具栏与表头，body 占满剩余高度且外 padding 为 0。表头约 44–45px、12px/500 slate-500、20px 行高、字距 .01em；数据 13px、横 padding 16px、纵约 12–13px。边界为 #EDF1F5，hover #F8FAFC，无默认斑马条或网格。固定编辑场景可用 56px 实际行高，不能因多行和 padding 撑高。

标准用户/角色表在 1280×720、224px 侧栏时，约 996px 可用宽内完整显示操作列，无横向滚动。操作列固定约 160–172px，checkbox 列固定，姓名/代码列按百分比缩放并截断。真正溢出只在表内滚；sticky 列背景不透明，1px #EDF1F5 分隔只在横向可滚时显示。

普通 checkbox 行选择保持透明或极浅 slate。只有特定编辑工作区的当前记录可用左侧 4px 品牌条（上下各缩进约 10px）；不能把普通选中行涂橙色。

## Service 分页契约

```text
query = { keyword, filters, sort, scope }
page = { records, pageNo, pageSize, total, hasNext }
state = { queryVersion, recordsById, nextPage, initialLoading,
          refreshing, loadingMore, initialError, appendError }
```

默认每批 20 条，真正从 service 逐批获取；不得先全取后切片。稳定 ID 去重，同 ID 原位更新，新 ID 按返回顺序追加。使用 hasNext，不凭“满一页”猜测下一页。总数来自真实服务响应，没有 total 时只能称“已加载 N”。小型枚举、权限树可整体读取。

新查询重置分页与关联选择，旧查询的 success/catch/finally 不得影响新代次。刷新属于同一 query，保留原数据；不能复用旧查询 cursor 或保留超大 scrollTop 导致空白视口。

## 预取、锁与终止

```text
scrollable = max(0, scrollHeight - clientHeight)
remaining = max(0, scrollable - scrollTop)
threshold = max(1200px, scrollable * 0.5)
shouldPrefetch = remaining <= threshold
```

比例相对于可滚距离，不是视口高度。实际表格/历史 scroller 监听 passive scroll，requestAnimationFrame 合并测量，追加、resize 和侧栏折叠后重查。1px aria-hidden sentinel 的 IntersectionObserver.root 必须是真 scroller，bottom rootMargin 1200px；不能观察位于虚拟库 scroller 外的 sentinel。

每 query 同时仅一个请求。scroll 和 observer 共享锁，只有成功合并后才推进 cursor。失败保留同一 cursor，暂停自动加载并提供显式重试。锁释放不能只依赖“行数改变”；重复 ID、空批仍可能完成请求。空批却 hasNext、重复 cursor 或连续无新 ID 且无法证明前进时，停止自动循环并提供可恢复错误。

## 状态

| 状态 | 呈现 |
| --- | --- |
| 初次加载 | 工具栏、表头与约 7 行匹配骨架，无假空态 |
| 正常 | 相同几何替换骨架 |
| 追加 | 保留行且可用，无大遮罩；panel 可有 12px 轻量 spinner 行 |
| 同查询刷新 | 保留旧行和位置，成功后替换、失败保留 |
| 新查询 | 隐藏旧作用域数据，开始新代次与骨架 |
| 无结果 | 在同一 body 中居中说明 |
| 初次失败 | body 中错误和重试，保留工具栏 |
| 追加失败 | 已加载行保留，局部错误与重试同一批 |
| 到底 | 自然结束，没有页码或常驻“加载更多”按钮 |

会话历史也遵守此规则：按日分组、独立滚动、sentinel、单请求锁、正常追加安静。没有更多记录时停止 observer 请求，spinner 消失。

## 虚拟化

分页控制获取量，窗口化控制 DOM 挂载量，两者职责不同。display:none 上千行不算虚拟化。

```text
viewportStart = max(0, scrollTop - headerHeight)
viewportEnd = max(viewportStart, scrollTop + clientHeight - headerHeight)
start = max(0, floor(viewportStart / rowHeight) - overscan)
end = min(count, ceil(viewportEnd / rowHeight) + overscan)
topPadding = start * rowHeight
bottomPadding = max(0, count - end) * rowHeight
```

固定行建议 overscan=8，密集场景可用 10；表头在滚动流内时才减 44px headerHeight，外部固定表头用 0。真实行高必须包含边界和 padding。占位行无 padding/border/交互，aria-hidden，列数匹配。ResizeObserver/scroll/count 变化后重算并在卸载清理 listener。

可变高度内容使用现有 FixedTable 的测量虚拟化；不要套固定 56px 计算到 72px 或展开行。草稿/选择按 ID 存在虚拟行外，焦点行需保留或可靠恢复。合成 10,000 条数据时 DOM 应只约等于可见行加两侧 overscan，初次请求仍小。

## 搜索、选择与操作

普通输入宽约 208–224px、高 36px，工具栏间距 10px。当前用户页采用 350ms 防抖搜索即输入，关键词属于 query identity。批量选择用 ID Set，追加不自动选中；“全选”默认表示已加载项，除非明确实现全结果语义。跨查询选择必须清理或明示保留范围。

行内 Copy/Edit/Delete 是 28–32px 操作，阻止事件穿透。无权限隐藏或禁用并说明原因。复制控件在 hover/focus 下可见且可键盘访问；截断 ID、姓名、代码有 title 或详情路径。
