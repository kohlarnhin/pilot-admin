export default {
  "accessDenied": "没有查看 AI 助手配置的权限。",
  "description": "按功能管理模型、助手资料、快捷提问与命令能力",
  "workspace": {
    "sectionLabel": "助手设置分区",
    "unsaved": "未保存更改",
    "saved": "已与保存内容同步",
    "reset": "还原已保存",
    "readOnly": "只读权限"
  },
  "models": {
    "title": "模型配置",
    "description": "模型配置仅保存于本地演示数据，不会请求所填地址。"
  },
  "profile": {
    "loadFailed": "加载助手资料失败",
    "retry": "重新加载助手资料",
    "loading": "正在加载助手资料…"
  },
  "greeting": {
    "title": "身份与开场白",
    "description": "设置助手名称与新对话介绍，并实时预览。",
    "name": "助手名称",
    "introduction": "介绍文案",
    "placeholder": "说明助手能帮用户完成哪些工作。",
    "preview": "开场白实时预览",
    "save": "保存开场白",
    "promptHint": "从一个问题开始，或直接描述你的需求",
    "nameRequired": "请输入助手名称",
    "greetingRequired": "请输入介绍文案"
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
    "save": "保存快捷提问",
    "labelRequired": "请输入按钮文案",
    "promptRequired": "请输入提问内容"
  },
  "commands": {
    "title": "命令与能力",
    "description": "查看现有命令、双语触发词与权限；未来工具开关将在此扩展。",
    "prefix": "前缀命令 · 接受参数",
    "noArgument": "无需参数",
    "chinese": "中文触发词",
    "english": "英文触发词",
    "permission": "所需权限",
    "access": {
      "users": "还需访问用户管理页面",
      "destination": "按目标页面的访问权限判断",
      "audit": "还需访问用户管理与概览页面"
    },
    "items": {
      "createUser": "选择角色并确认后创建用户账号。",
      "findUsers": "按姓名、账号或邮箱查找用户并打开管理页面。",
      "disableUsers": "选择匹配账号，确认后停用；不会停用当前账号。",
      "help": "查看助手可用能力与权限说明。",
      "overview": "查看账号概况与按角色汇总的用户统计。",
      "accountAudit": "按计划检查账号状态、角色与密码策略并生成报告。",
      "simulateError": "演示助手处理失败后的错误反馈与重试。"
    }
  }
} as const;
