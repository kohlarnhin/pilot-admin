export default {
  "errors": {
    "load": "加载AI助手配置失败"
  },
  "providers": {
    "openai": "OpenAI 兼容",
    "local": "本地模型",
    "other": "其他"
  },
  "columns": {
    "model": "模型"
  },
  "fields": {
    "provider": "提供方",
    "modelCode": "模型编号",
    "modelName": "模型名称"
  },
  "actions": {
    "disable": "停用配置",
    "enable": "启用配置",
    "edit": "编辑配置",
    "delete": "删除配置",
    "create": "新增配置"
  },
  "access": {
    "editDenied": "无修改权限",
    "createDenied": "无新增权限"
  },
  "deleteDialog": {
    "title": "删除模型配置？",
    "content": "即将删除 {name}"
  },
  "description": "本地演示配置 · 不会发起模型调用",
  "empty": {
    "title": "暂无 AI 助手配置",
    "description": "添加一个演示模型配置后即可使用助手"
  },
  "form": {
    "editTitle": "编辑 AI 助手配置",
    "createTitle": "新增 AI 助手配置"
  },
  "validation": {
    "providerRequired": "请选择提供方",
    "urlRequired": "请输入 Base URL",
    "codeRequired": "请输入模型编号",
    "codeLength": "模型编号最多 150 字符",
    "nameRequired": "请输入模型名称",
    "nameLength": "模型名称最多 150 字符"
  },
  "hints": {
    "url": "仅保存用于展示，不会访问该地址。",
    "keepKey": "留空保留已有密钥；密钥仅以掩码展示。",
    "demoKey": "演示配置无需真实密钥。"
  },
  "placeholders": {
    "name": "例如：演示模型",
    "apiKey": "仅本地保存"
  },
  "modelPicker": {
    "placeholder": "选择或输入模型编号",
    "toggle": "显示可用模型",
    "label": "可用模型",
    "loading": "正在获取模型列表…",
    "empty": "暂无匹配模型，可直接输入模型编号"
  }
} as const;
