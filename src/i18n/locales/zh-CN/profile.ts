export default {
  title: '个人中心',
  description: '维护个人资料、安全与偏好，查看当前账号的访问权限',
  sectionLabel: '个人中心分类',
  sections: {
    basic: { title: '基本资料', description: '姓名与联系方式' },
    security: { title: '安全', description: '修改登录密码' },
    preferences: { title: '偏好', description: '语言与工作方式' },
    permissions: { title: '我的权限', description: '当前角色、页面与操作' },
  },
  fields: {
    loginName: '登录账号',
    loginHint: '登录账号由管理员维护，无法在此修改',
    displayName: '显示姓名',
    nameHint: '最多 40 字，用于侧栏、账号菜单和操作日志',
    emailHint: '选填，用于联系；不会修改登录账号',
  },
  toast: { saved: '个人资料已保存' },
  preferences: {
    languageHint: '语言保存在当前浏览器，并同步到其他标签页',
    agentHint: '选择登录后进入管理后台、Agent 模式或每次询问',
  },
  permissions: {
    roles: '我的角色',
    pages: '可访问页面',
    actions: '操作权限',
    noRoles: '暂无已启用的角色',
    noActions: '暂无操作权限',
    readOnlyHint: '当前账号可查看已授权页面，无需配置操作权限',
    pageCount: '页面：{count}',
    actionCount: '操作：{count}',
  },
} as const;
