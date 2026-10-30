export default {
  "description": "分页、表单、权限与批量操作的完整参考",
  "fields": {
    "name": "项目名称",
    "code": "项目编码",
    "owner": "负责人",
    "description": "描述"
  },
  "form": {
    "nameHint": "请输入项目名称",
    "codeHint": "2–20 位大写字母、数字或连字符，以字母开头"
  },
  "status": {
    "active": "进行中",
    "paused": "已暂停",
    "archived": "已归档"
  },
  "filters": {
    "search": "搜索名称、编码或负责人",
    "allStatuses": "全部状态"
  },
  "actions": {
    "export": "导出项目",
    "batchDelete": "批量删除"
  },
  "selection": {
    "count": "已选 {count} 项",
    "clear": "清除选择"
  },
  "batchDialog": {
    "content": "确认删除选中的 {count} 个项目？此操作不可撤销。"
  },
  "deleteDialog": {
    "content": "确认删除项目「{name}」？此操作不可撤销。"
  },
  "errors": {
    "load": "加载项目失败",
    "count": "获取项目总数失败",
    "export": "导出项目失败"
  },
  "empty": {
    "title": "没有匹配的项目",
    "hint": "调整筛选条件后重试"
  },
  "total": "共 {count} 个项目",
  "toast": {
    "deleted": "删除成功"
  }
} as const;
