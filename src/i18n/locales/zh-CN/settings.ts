export default {
  "sections": {
    "basic": {
      "title": "基本设置",
      "description": "站点名称与基本信息"
    },
    "security": {
      "title": "安全设置",
      "description": "账号密码与安全策略"
    },
    "notifications": {
      "title": "通知设置",
      "description": "管理系统通知偏好"
    },
    "demo": {
      "title": "演示数据",
      "description": "恢复初始演示环境"
    }
  },
  "errors": {
    "load": "加载设置失败"
  },
  "toast": {
    "saved": "设置已保存"
  },
  "demo": {
    "confirmContent": "用户、角色、菜单名称、系统设置和个人偏好将恢复初始状态，所有演示账号的密码也将重置。确定继续吗？",
    "warning": "重置将覆盖当前浏览器中保存的所有演示数据，此操作无法撤销。",
    "initialData": "初始数据",
    "summary": "150 名用户 · 3 个角色 · 6 个功能页面",
    "description": "包含超级管理员、运营人员和访客账号，以及默认菜单、安全策略与通知偏好。"
  },
  "description": "配置站点信息、安全策略与通知偏好",
  "sectionLabel": "设置分类",
  "basic": {
    "name": "站点名称",
    "nameHint": "显示在侧边栏与浏览器标题中",
    "description": "站点说明",
    "descriptionPlaceholder": "简要介绍这个管理端"
  },
  "security": {
    "title": "密码策略",
    "policyHint": "策略应用于新增账号、重置密码和修改密码；已有密码不会被自动修改。",
    "minLength": "密码最少长度",
    "lengthHint": "可设置为 6–32 位",
    "requireNumber": "必须包含数字",
    "numberHint": "新密码至少包含一个数字",
    "requireLetter": "必须包含字母",
    "letterHint": "新密码至少包含一个英文字母"
  },
  "notifications": {
    "description": "选择您希望接收的通知类型，演示环境仅保存偏好。",
    "systemNotices": "系统公告",
    "noticesHint": "接收系统更新与维护公告",
    "accountChanges": "账号变更提醒",
    "accountHint": "账号资料或角色发生变化时提醒",
    "weeklySummary": "每周摘要",
    "summaryHint": "汇总一周的系统使用情况"
  }
} as const;
