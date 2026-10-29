export default {
  "errors": {
    "loadUsers": "加载用户失败",
    "loadRoles": "加载角色失败",
    "loadCount": "加载用户总数失败",
    "resetPassword": "重置失败",
    "load": "加载失败：{error}",
    "combined": "{current}；{error}"
  },
  "toast": {
    "updated": "用户信息更新成功",
    "created": "新增用户成功",
    "enabled": "用户【{name}】已启用",
    "disabled": "用户【{name}】已禁用",
    "deleted": "用户已删除",
    "passwordReset": "密码已重置"
  },
  "createdAccount": {
    "copyLabel": "复制{name}",
    "notice": "请妥善保存，关闭后将不再显示密码。"
  },
  "deleteDialog": {
    "content": "确定删除用户「{name}」吗？删除后该账号无法再登录。"
  },
  "columns": {
    "user": "用户",
    "copyId": "复制用户 ID",
    "noRole": "未分配角色"
  },
  "avatarFallback": "用",
  "fields": {
    "workEmail": "工作邮箱",
    "loginName": "登录账号",
    "displayName": "用户姓名",
    "initialPassword": "初始密码",
    "roles": "分配角色"
  },
  "actions": {
    "disable": "禁用用户",
    "enable": "启用用户"
  },
  "description": "维护平台用户账号，并为其分配 RBAC 角色权限",
  "searchPlaceholder": "搜索账号或姓名",
  "empty": {
    "noUsers": "暂无系统用户",
    "retryHint": "请点击上方重试，重新加载用户数据",
    "searchHint": "换个关键词试试",
    "createHint": "点击右上角「新增用户」，创建新的登录账号"
  },
  "createDialog": {
    "description": "创建平台登录账号并分配角色"
  },
  "validation": {
    "loginRequired": "请输入登录账号",
    "rolesRequired": "请至少选择一个角色"
  },
  "placeholders": {
    "loginName": "例如：dev_zhang",
    "displayName": "例如：张工",
    "keepPassword": "输入新密码，留空则不修改",
    "password": "留空自动生成",
    "roles": "请选择角色"
  },
  "hints": {
    "keepPassword": "无需重置请留空",
    "generatePassword": "留空将由系统自动生成随机密码"
  },
  "resetDialog": {
    "description": "为 @{account} 设置新密码"
  },
  "total": "共 {count} 名用户"
} as const;
