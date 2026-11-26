export default {
  "description": "行内编辑、批量操作、列显隐与导出 · 无持久化演示",
  "demoHint": "这是无持久化演示，所有角色可编辑；保存只做服务端校验，刷新后恢复初始数据。",
  "tableLabel": "库存清单",
  "total": "共 {count} 行",
  "changes": "{count} 处未保存更改",
  "noChanges": "内容未更改",
  "listed": "已上架",
  "unlisted": "未上架",
  "savedAt": "已于 {time} 保存",
  "columns": {
    "sku": "SKU",
    "name": "名称",
    "category": "类别",
    "price": "单价（元）",
    "stock": "库存",
    "active": "上架"
  },
  "category": {
    "hardware": "硬件",
    "software": "软件",
    "service": "服务"
  },
  "actions": {
    "add": "新增一行",
    "save": "保存更改",
    "discard": "撤销更改",
    "export": "导出 CSV",
    "columnSettings": "列设置",
    "removeRow": "删除此行",
    "batchEnable": "批量上架",
    "batchDisable": "批量下架",
    "batchRemove": "删除所选",
    "clearSelection": "取消选择",
    "selectAll": "选择全部行",
    "selectRow": "选择 {name}"
  },
  "selection": "已选择 {count} 行",
  "newRow": "新增",
  "modified": "已修改",
  "rowLabel": "第 {index} 行",
  "discardDialog": {
    "title": "撤销全部更改？",
    "description": "未保存的新增、修改与删除都会丢失，表格恢复到上次保存的状态。",
    "ok": "撤销更改"
  },
  "validation": {
    "nameRequired": "请输入名称",
    "nameTooLong": "名称不超过 40 个字符",
    "duplicateName": "名称与其他行重复",
    "reservedName": "名称 system 为保留名称",
    "priceRequired": "请输入单价",
    "priceRange": "单价需在 0 到 99999 之间",
    "stockRequired": "请输入库存",
    "stockRange": "库存需为 0 到 99999 的整数",
    "category": "请选择类别",
    "summary": "{count} 个单元格未通过校验，请修正后再保存。"
  },
  "errors": {
    "load": "库存数据加载失败",
    "save": "保存失败，请重试"
  },
  "success": "已保存 {count} 处更改",
  "empty": "表格为空，可以新增一行开始。",
  "seed": {
    "p01": "无线键盘",
    "p02": "人体工学鼠标",
    "p03": "27 英寸显示器",
    "p04": "扩展坞",
    "p05": "降噪耳机",
    "p06": "办公套件年订阅",
    "p07": "设计软件授权",
    "p08": "杀毒软件",
    "p09": "云盘扩容包",
    "p10": "上门安装服务",
    "p11": "延保服务",
    "p12": "数据迁移服务"
  }
} as const;
