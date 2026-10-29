export default {
  "auth": {
    "invalidCredentials": "账号或密码错误，请检查后重试",
    "accountDisabled": "账号已停用，请联系管理员",
    "sessionExpired": "登录状态已失效，请重新登录"
  },
  "password": {
    "confirmMismatch": "两次输入的新密码不一致",
    "currentMismatch": "原密码不正确",
    "invalidMinLength": "密码最少长度须为 6–32 位",
    "minLength": "密码至少需要 {length} 位",
    "needLetter": "密码需要包含字母",
    "needNumber": "密码需要包含数字"
  },
  "role": {
    "builtInProtected": "内置超级管理员角色不可删除",
    "nameRequired": "请输入角色名称",
    "notFound": "角色不存在",
    "invalidRole": "请填写有效的角色名称与编码",
    "codeExists": "该角色编码已存在",
    "inUse": "该角色仍有用户使用，请先调整用户角色"
  },
  "agentConfig": {
    "incomplete": "请填写完整的模型配置",
    "invalidUrl": "请输入有效的 HTTP 或 HTTPS 地址",
    "notFound": "配置不存在"
  },
  "agentProfile": {
    "incomplete": "请填写助手名称和问候语",
    "invalidShortcuts": "请填写完整的快捷提问，最多 6 项"
  },
  "menu": {
    "invalidName": "菜单不存在或名称为空",
    "invalidActionName": "按钮不存在或名称为空"
  },
  "pagination": {
    "emptyPage": "分页接口返回空数据但仍标记存在下一页"
  },
  "settings": {
    "nameRequired": "请输入站点名称"
  },
  "user": {
    "invalidRoles": "请选择有效角色",
    "invalidAccount": "请填写有效的账号与姓名",
    "loginNameExists": "该登录账号已存在",
    "notFound": "用户不存在",
    "selfDisable": "不可禁用当前登录账号",
    "selfDelete": "不可删除当前登录账号"
  },
  "access": {
    "forbiddenAction": "没有执行此操作的权限",
    "forbiddenPage": "没有访问此页面的权限"
  }
} as const;
