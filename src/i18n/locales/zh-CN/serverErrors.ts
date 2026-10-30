export default {
  profile: { invalidName: '请输入不超过 40 字的显示姓名' },
  "example": {
    "invalidName": "请输入不超过 60 字的项目名称",
    "invalidCode": "编码须为 2–20 位大写字母、数字或连字符，并以字母开头",
    "invalidOwner": "请输入不超过 40 字的负责人",
    "invalidStatus": "请选择有效的项目状态",
    "invalidDescription": "描述不能超过 200 字",
    "codeExists": "该项目编码已存在",
    "notFound": "项目不存在或已被删除",
    "batchLimit": "每次请选择 1–100 个项目"
  },
  "audit": { "invalidParams": "审计参数不符合动作定义" },
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
  },
  "agent": {
    "noModel": "尚未配置可用模型",
    "sessionNotFound": "会话不存在",
    "interactionExpired": "此交互已失效，请重新发起操作",
    "choiceUnsupported": "此工具不支持选项回复",
    "selectionUnsupported": "此工具不支持选择回复",
    "toolUnavailable": "没有可用的处理工具",
    "interactionSubmitted": "此交互已提交或已失效，请使用最新回复",
    "invalidChoice": "无效的选项",
    "invalidSelection": "请选择有效选项",
    "planNotFound": "计划不存在",
    "planExecuted": "计划已执行",
    "planChanged": "计划执行状态已变更",
    "planUnsupported": "此工具不支持执行计划",
    "actionNotFound": "操作不存在",
    "resultSaved": "结果已保存",
    "nameExpired": "操作信息已失效，请重新提供姓名",
    "roleUnavailable": "角色不可用",
    "roleRequired": "请先选择角色",
    "usersExpired": "操作信息已失效，请重新选择用户",
    "auditStepNotFound": "巡检步骤不存在",
    "simulated": "模拟服务暂时不可用，请点击重新尝试。"
  }
} as const;
