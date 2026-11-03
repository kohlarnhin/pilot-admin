export default {
  "description": "查看账号、权限和配置变更的结构化记录",
  "module": {
    "auth": "账号认证",
    "user": "用户",
    "role": "角色",
    "menu": "菜单",
    "settings": "设置",
    "agentConfig": "模型配置",
    "agentProfile": "助手资料",
    "profile": "个人中心",
    "example": "示例项目"
  },
  "action": {
    "auth": {
      "login": "登录了系统",
      "loginFailed": "登录失败",
      "logout": "退出了登录",
      "passwordChange": "修改了登录密码"
    },
    "user": {
      "create": "创建了用户「{target}」",
      "update": "更新了用户「{target}」",
      "status": "将用户「{target}」设为{status}",
      "resetPassword": "重置了用户「{target}」的密码",
      "delete": "删除了用户「{target}」"
    },
    "role": {
      "create": "创建了角色「{target}」",
      "update": "更新了角色「{target}」",
      "status": "将角色「{target}」设为{status}",
      "delete": "删除了角色「{target}」",
      "permissions": "更新了角色「{target}」的权限（菜单 {menuCount}，按钮 {buttonCount}）"
    },
    "menu": {
      "rename": "将菜单重命名为「{target}」"
    },
    "button": {
      "rename": "将按钮重命名为「{target}」"
    },
    "settings": {
      "update": "更新了{section}",
      "resetDemo": "重置了演示数据"
    },
    "agentConfig": {
      "create": "新增了模型配置「{target}」",
      "update": "更新了模型配置「{target}」",
      "delete": "删除了模型配置「{target}」",
      "status": "将模型配置「{target}」设为{status}"
    },
    "agentProfile": {
      "update": "更新了助手资料「{target}」"
    },
    "profile": {
      "update": "更新了个人资料（{fields}）"
    },
    "example": {
      "create": "创建了项目「{target}」",
      "update": "更新了项目「{target}」",
      "delete": "删除了项目「{target}」",
      "import": "导入创建了 {count} 个项目，失败 {failed} 个",
      "batchDelete": "批量删除了 {count} 个项目"
    }
  },
  "reason": {
    "invalidCredentials": "账号或密码错误",
    "accountDisabled": "账号已停用",
    "forbidden": "权限不足",
    "invalidInput": "输入不符合要求",
    "notFound": "目标不存在",
    "conflict": "数据冲突"
  },
  "section": {
    "basic": "基本设置",
    "security": "安全设置",
    "notifications": "通知设置"
  },
  "result": {
    "success": "成功",
    "failure": "失败"
  },
  "fields": {
    "time": "时间",
    "actor": "操作人",
    "module": "模块",
    "action": "操作内容",
    "result": "结果",
    "id": "日志 ID",
    "actorId": "操作人 ID",
    "actionCode": "操作代码",
    "targetType": "目标类型",
    "targetId": "目标 ID",
    "targetName": "目标名称",
    "params": "参数",
    "reason": "原因",
    "traceId": "追踪 ID"
  },
  "params": {
    "status": "状态",
    "menuCount": "菜单数",
    "buttonCount": "按钮数",
    "section": "设置分类",
    "failed": "失败数",
    "count": "数量",
    "fields": "修改字段"
  },
  "profileFields": {
    "userName": "显示名称",
    "email": "邮箱",
    "agentModeEntry": "Agent 入口偏好"
  },
  "targetType": {
    "user": "用户",
    "role": "角色",
    "menu": "菜单",
    "button": "按钮",
    "settings": "设置",
    "agentConfig": "模型配置",
    "agentProfile": "助手资料",
    "example": "项目"
  },
  "filters": {
    "search": "搜索操作人、对象或追踪 ID",
    "module": "筛选模块",
    "result": "筛选结果",
    "allModules": "全部模块",
    "allResults": "全部结果"
  },
  "total": "共 {count} 条记录",
  "detail": "日志详情",
  "viewDetail": "查看详情",
  "viewAll": "查看全部",
  "empty": {
    "title": "没有匹配的日志",
    "hint": "调整筛选条件后重试"
  },
  "errors": {
    "load": "加载操作日志失败",
    "count": "获取日志总数失败",
    "export": "导出操作日志失败"
  },
  "unknownActor": "未知账号",
  "unknownTarget": "未知目标"
} as const;
