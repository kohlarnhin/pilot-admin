export default {
  "accessDenied": "没有查看 AI 助手配置的权限。",
  "description": "配置模型、助手资料与快捷提问",
  "models": {
    "title": "模型配置",
    "description": "模型配置仅保存于本地演示数据，不会请求所填地址。"
  },
  "profile": {
    "retry": "重新加载助手资料",
    "loading": "正在加载助手资料…"
  },
  "greeting": {
    "title": "开场白",
    "description": "用户打开新对话时看到的介绍，右侧实时预览。",
    "name": "助手名称",
    "introduction": "介绍文案",
    "placeholder": "说明助手能帮用户完成哪些工作。",
    "preview": "开场白实时预览",
    "save": "保存开场白",
    "promptHint": "从一个问题开始，或直接描述你的需求"
  },
  "shortcuts": {
    "title": "快捷提问",
    "description": "最多 6 条；按展示顺序排列，每条包含按钮文案与发送内容。",
    "label": "快捷提问 {index} 文案",
    "prompt": "快捷提问 {index} 内容",
    "moveLabel": "快捷提问 {index} {direction}",
    "moveUp": "上移",
    "moveDown": "下移",
    "deleteLabel": "删除快捷提问 {index}",
    "add": "添加快捷提问",
    "save": "保存快捷提问"
  }
} as const;
