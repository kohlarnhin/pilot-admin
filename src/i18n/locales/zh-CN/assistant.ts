export default {
  "header": {
    "subtitle": "你的工作搭档",
    "notifications": "助手完成通知",
    "newConfirm": "开启新对话？",
    "start": "开启",
    "newConversation": "新对话",
    "startConversation": "开启新对话",
    "history": "历史会话",
    "collapse": "收起面板",
    "expand": "展开面板",
    "toggle": "打开/关闭",
    "close": "关闭 AI 助手"
  },
  "composer": {
    "attach": "附加文件",
    "reading": "正在读取附件…",
    "parsing": "正在解析…",
    "removeAttachment": "移除附件",
    "unavailable": "助手暂不可用",
    "decision": "请输入你的决定…",
    "placeholder": "描述你的问题或需求…",
    "messageLabel": "发送给 AI 助手的消息",
    "attachHint": "附加文件，最大 5 MB；仅保留名称、大小、类型和文本行数",
    "stopHint": "可随时停止",
    "sendHint": "Enter 发送",
    "stop": "停止生成",
    "send": "发送消息",
    "attachmentPrompt": "请查看这个附件的元数据。",
    "metadata": "{size} 字节{lines} · 仅元数据",
    "lineCount": " · {count} 行"
  },
  "confirmation": {
    "selected": "已选择：{label}",
    "prompts": "试试这些提问",
    "role": "选择角色",
    "waiting": "等待你的确认",
    "selectedHint": "助手已按照你的选择继续处理。",
    "promptHint": "选择一个提问继续对话。",
    "roleHint": "选择后还需确认创建。",
    "activeHint": "确认后，助手将继续执行这一步。",
    "expiredHint": "该确认已进入后续对话，不能重复操作。",
    "groupLabel": "请选择下一步"
  },
  "empty": {
    "enableModel": "请启用一个模型配置后再试。",
    "contactAdmin": "请联系管理员配置可用模型。",
    "settings": "前往助手设置",
    "workspace": "AGENT / 工作空间",
    "modelRequired": "尚未配置可用模型，请前往助手设置页面配置。"
  },
  "plan": {
    "status": {
      "proposed": "待确认",
      "waitingUser": "需要你操作",
      "pending": "待执行"
    },
    "hints": {
      "proposed": "确认后按顺序执行，每一步都会在对话中展示进度。",
      "running": "正在按顺序执行，可随时停止；停止后当前请求结束，不再开始新步骤。",
      "waitingUser": "等待你完成上一步操作。",
      "completed": "全部步骤已完成。",
      "paused": "计划已暂停，可继续执行剩余步骤。"
    },
    "region": "执行计划",
    "title": "执行计划 · {title}",
    "adjust": "调整计划",
    "confirm": "确认执行",
    "stop": "停止",
    "resume": "继续执行",
    "adjustPrompt": "请调整计划："
  },
  "markdown": {
    "code": "代码",
    "copyCode": "复制代码",
    "codeRegion": "{language}代码块，可横向滚动",
    "tableRegion": "表格，可横向滚动"
  },
  "messages": {
    "continuePlan": "继续执行计划",
    "continueBatch": "继续下一批",
    "user": "你的消息",
    "attachment": "{name} · {size} 字节",
    "failed": "助手回复失败",
    "assistant": "助手的消息",
    "retry": "重新尝试",
    "generating": "正在生成",
    "stopped": "已停止生成",
    "copy": "复制回复",
    "loadingOlder": "正在加载更早的消息",
    "region": "助手对话消息",
    "loading": "正在加载会话",
    "log": "对话记录",
    "olderHint": "向上滚动，查看更早的消息",
    "stepsCompleted": "已执行 {count} 个步骤",
    "latestLabel": "滚动到最新消息",
    "latest": "回到最新",
    "typing": "助手正在生成回复",
    "stopReply": "本次回复已停止。",
    "selectedUsers": "选择用户：{names}"
  },
  "pageAction": {
    "saveFailed": "结果保存失败，可重试",
    "completed": "操作已完成",
    "openPage": "打开页面",
    "openPanel": "打开操作面板",
    "retrySave": "重试保存结果"
  },
  "selection": {
    "region": "用户选择",
    "submitted": "已提交选择",
    "count": "已选 {count} / {max}",
    "optionLabel": "选择 {label}",
    "confirm": "确认选择（{count}）",
    "submittedHint": "此表单已提交，请查看下方确认。",
    "inactiveHint": "此表单当前不可提交，请在最新回复中操作。"
  },
  "history": {
    "back": "返回当前对话",
    "escape": "Esc 返回对话",
    "loading": "正在加载历史会话",
    "emptyTitle": "还没有历史会话",
    "emptyHint": "开始一段对话，之后可以随时在这里继续。",
    "count": "{count} 条记录",
    "current": "当前",
    "loadingMore": "正在加载更多会话…"
  },
  "errors": {
    "unavailable": "AI 助手暂时不可用，请稍后再试。",
    "attachmentSize": "文件不能超过 5 MB",
    "attachmentRead": "无法读取文件元数据，请重新选择",
    "loadOlder": "加载历史消息失败",
    "loadHistory": "获取会话列表失败，请重试",
    "loadConversation": "加载会话详情失败",
    "planLimit": "计划续跑次数已达上限，请调整计划",
    "planState": "计划执行状态无效"
  },
  "toast": {
    "newConversation": "已开启新对话"
  },
  "progress": {
    "selection": "正在提交选择…",
    "confirmed": "正在执行已确认的操作…",
    "preparing": "正在准备处理…",
    "nextStep": "正在执行计划的下一步…"
  },
  "notifications": {
    "confirm": "需要你确认：{text}",
    "completed": "已完成：{text}",
    "unsupported": "当前浏览器不支持通知",
    "denied": "浏览器已禁止通知，请在浏览器的网站权限中开启",
    "enabled": "已开启完成通知 · 关闭助手或离开标签页时提醒",
    "disabled": "开启助手完成通知"
  },
  "assignRoles": {
    "selectionRequired": "请选择至少一位用户和目标角色",
    "completed": "已为 **{count}** 位用户分配角色 **{role}**，用户列表已同步更新。",
    "partialError": "{error}（已完成 {count} 位，可重试剩余操作）",
    "cancelledRest": "批量分配已结束，已修改 **{count}** 位用户，其余操作已取消。",
    "save": "保存并返回对话",
    "description": "所选账号的角色将替换为目标角色。",
    "targetRole": "目标角色",
    "searchLabel": "搜索要分配角色的用户",
    "searchPlaceholder": "搜索姓名或账号",
    "selected": "已选 {count} 位用户",
    "listLabel": "选择用户列表",
    "loading": "正在加载用户…"
  },
  "legacyGreeting": "你好！我是领航助手，可以协助你查看概况、查找用户和维护账号。"
} as const;
