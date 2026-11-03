export default {
  "import": {
    "title": "导入 CSV",
    "notice": "使用机器列名与状态码，逗号分隔，最多 500 条、1 MB。普通导出不是导入格式。",
    "template": "下载模板（UTF-8 BOM）",
    "roundTrip": "单元格按文本导入，保留前导单引号；下载为防公式执行会添加单引号，因此公式前缀内容不保证原样往返。",
    "filePreview": "文件与原文",
    "selectFile": "拖放或选择 CSV 文件",
    "fileHint": ".csv · UTF-8 / GB18030 · 逗号分隔",
    "noFile": "尚未选择文件",
    "encoding": "文件编码",
    "rawPreview": "原文预览",
    "parsedPreview": "解析结果",
    "previewPlaceholder": "选择文件后在此预览",
    "truncated": "仅预览前 200 行或 20,000 字符；全部记录仍参与校验。",
    "detectedFallback": "严格 UTF-8 解码失败，已使用 GB18030，可切换编码。",
    "localOnly": "仅在本地读取与解析，不上传原始文件。",
    "rowNo": "记录号",
    "validity": "校验 / 结果",
    "counts": "共 {total} · 有效 {valid} · 无效 {invalid}",
    "valid": "有效",
    "created": "已创建",
    "skipped": "已跳过",
    "failed": "导入失败（已有回执）",
    "downloadFailed": "下载失败行",
    "done": "完成",
    "continue": "继续导入",
    "start": "开始导入",
    "progress": "已处理 {processed}/{total} · 创建 {created} · 跳过 {skipped} · 失败 {failed}",
    "completedHint": "结果已保留；失败行下载包含跳过行与服务拒绝行。点击完成刷新列表。",
    "validHint": "仅发送有效行；数据库中已存在的编码由服务再次校验。",
    "recoveryHint": "中断后可继续导入：先查询已提交状态，再补交未处理行。",
    "states": {
      "empty": "等待文件",
      "reading": "正在本地读取与解析…",
      "invalid": "文件校验失败，请更换文件或编码",
      "parsed": "已解析，请检查预览",
      "importing": "正在导入，请保持窗口打开",
      "complete": "导入完成",
      "interrupted": "导入中断，已保留上次确认的结果",
      "terminal": "导入已停止"
    },
    "errors": {
      "size": "文件不能超过 1 MB，请拆分后重试",
      "rows": "数据记录不能超过 500 条，请拆分文件",
      "separator": "仅支持逗号分隔，首行只允许 sep=,",
      "quote": "第 {line} 行开始的引号未闭合，请修正文件",
      "syntax": "第 {line} 行引号格式无效，请按 CSV 规范修正",
      "empty": "文件中没有数据记录",
      "duplicateHeader": "列名重复：{column}",
      "unknownHeader": "不支持的列：{column}，请使用模板",
      "missingHeader": "缺少必填列：{column}",
      "columns": "单元格数与表头不一致",
      "duplicate": "文件内编码重复",
      "encoding": "所选编码无法严格解码，请切换编码或另存文件",
      "file": "每次请选择一个 .csv 文件",
      "read": "读取文件失败，请重新选择文件",
      "connection": "提交未能确认。请检查本地存储或连接后继续导入；系统会先查询已提交状态。"
    }
  },
  "description": "分页、表单、权限与批量操作的完整参考",
  "detail": {
    "title": "项目详情",
    "back": "返回项目列表",
    "metadata": "项目信息",
    "createdBy": "创建人",
    "updatedBy": "更新人",
    "systemActor": "系统",
    "history": "生命周期",
    "historyCount": "已加载 {count} 条",
    "historyEmpty": "暂无操作记录",
    "historyError": "加载操作记录失败",
    "notFound": "项目不存在或已被删除",
    "noDescription": "暂无描述"
  },
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
