export default {
  "toast": {
    "enabled": "角色【{name}】已启用",
    "disabled": "角色【{name}】已停用",
    "updated": "修改角色成功",
    "created": "新增角色成功",
    "permissionsSaved": "角色【{name}】权限配置已更新",
    "deleted": "角色已删除"
  },
  "errors": {
    "loadRoles": "加载角色列表失败",
    "loadResources": "加载菜单按钮权限失败",
    "loadCount": "加载角色总数失败",
    "loadPermissions": "加载角色权限失败",
    "savePermissions": "保存权限失败"
  },
  "deleteDialog": {
    "content": "确定删除角色「{name}」吗？正在使用的角色需先解除用户关联。"
  },
  "columns": {
    "noDescription": "暂无说明",
    "resources": "授权资源",
    "resourceCounts": "{menus} 菜单{separator}{buttons} 按钮"
  },
  "fields": {
    "code": "角色编码",
    "name": "角色名称",
    "description": "角色说明"
  },
  "actions": {
    "disable": "停用角色",
    "enable": "启用角色"
  },
  "description": "维护系统角色，按菜单与按钮鉴权编码进行细粒度授权",
  "total": "共 {count} 个角色",
  "empty": {
    "noRoles": "暂无角色",
    "retryHint": "请点击上方重试，重新加载角色列表",
    "createHint": "点击右上角「新增角色」，定义职责与权限边界"
  },
  "createDialog": {
    "description": "定义角色职责，稍后可配置菜单与按钮权限"
  },
  "placeholders": {
    "name": "例如：审计人员",
    "code": "例如：ROLE_AUDITOR",
    "description": "简要说明该角色的业务范围（选填）"
  },
  "validation": {
    "codeRequired": "请输入角色编码"
  },
  "permissionDialog": {
    "title": "配置角色权限",
    "description": "为 {role} {code} 分配可访问的菜单与操作权限，当前账号保存后立即生效，其他账号重新登录后生效",
    "save": "保存权限",
    "loadResources": "正在读取菜单与按钮资源",
    "loadPermissions": "正在读取角色权限",
    "selectedMenus": "已选菜单 ",
    "selectedActions": "已选按钮 ",
    "selectAll": "全选可用资源",
    "linkedTitle": "菜单与操作联动授权",
    "linkedHint": "勾选操作会自动补齐所属页面及父级菜单；取消菜单会同步移除其下级菜单和相关操作权限。",
    "pagesTitle": "模块与页面权限",
    "pagesHint": "勾选页面控制可访问性，右侧网格配置按钮操作权限",
    "emptyHint": "请先在菜单管理中创建菜单和按钮",
    "selectPages": "全选模块页面",
    "pageAccess": "页面导航",
    "actionsTitle": "操作按钮权限",
    "quickActions": "快捷操作",
    "codeLabel": "权限码: ",
    "readOnly": "只读访问，无独立操作按钮",
    "clearActions": "取消全部",
    "selectActions": "全选操作",
    "standalone": "独立页面",
    "subpages": "{count} 个子页面"
  }
} as const;
