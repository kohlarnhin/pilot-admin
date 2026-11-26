export default {
  "description": "申请详情、节点进度与审批记录 · 无持久化演示",
  "demoHint": "无持久化演示：审批结果只保存在当前页面，刷新后恢复初始数据。",
  "listLabel": "审批申请",
  "pendingCount": "{count} 条待处理",
  "readOnly": "当前账号仅可查看审批详情",
  "readOnlyHint": "审批操作需要 example:update 权限。",
  "fields": {
    "applicant": "申请人",
    "department": "部门",
    "amount": "金额",
    "submittedAt": "提交时间",
    "currentNode": "当前节点",
    "reason": "申请事由",
    "items": "费用明细",
    "total": "合计"
  },
  "type": {
    "purchase": "采购申请",
    "travel": "差旅报销",
    "subscription": "软件续费",
    "event": "活动预算"
  },
  "status": {
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回"
  },
  "node": {
    "submit": "提交申请",
    "manager": "部门负责人",
    "finance": "财务复核",
    "done": "完成"
  },
  "step": {
    "done": "已完成",
    "current": "进行中",
    "rejected": "已驳回",
    "waiting": "未开始"
  },
  "stepsLabel": "审批进度",
  "history": "审批记录",
  "noComment": "无审批意见",
  "action": {
    "submit": "提交了申请",
    "approve": "通过",
    "reject": "驳回",
    "resubmit": "重新提交"
  },
  "decide": {
    "approve": "通过",
    "reject": "驳回",
    "resubmit": "重新提交",
    "approveTitle": "通过「{node}」节点",
    "rejectTitle": "驳回申请",
    "resubmitTitle": "重新提交申请",
    "approveHint": "可以填写审批意见，通过后流转到下一个节点。",
    "rejectHint": "请写明驳回原因，申请人会看到这条意见。",
    "resubmitHint": "说明本次修改的内容，申请会回到部门负责人节点。",
    "comment": "审批意见",
    "commentPlaceholder": "填写审批意见",
    "approved": "已通过「{node}」节点",
    "rejected": "申请已驳回",
    "resubmitted": "申请已重新提交"
  },
  "validation": {
    "commentRequired": "请至少填写 5 个字的意见",
    "commentTooLong": "意见不超过 200 个字"
  },
  "errors": {
    "load": "审批数据加载失败",
    "stale": "申请状态已变化，请刷新后再操作",
    "decide": "操作失败，请重试"
  },
  "seed": {
    "r1": {
      "title": "设计组显示器采购",
      "applicant": "周沐阳",
      "department": "设计部",
      "reason": "设计组新增 3 名成员，需要配置色准达标的 27 英寸显示器，用于日常设计与验收。",
      "item1": "27 英寸显示器 × 4",
      "item2": "显示器支架 × 4"
    },
    "r2": {
      "title": "上海客户拜访差旅",
      "applicant": "赵书瑶",
      "department": "销售部",
      "reason": "11 月中旬赴上海拜访两家重点客户，推进年度续约。",
      "item1": "往返高铁",
      "item2": "酒店住宿 2 晚",
      "item3": "市内交通"
    },
    "r3": {
      "title": "协作软件年度续费",
      "applicant": "徐安然",
      "department": "研发部",
      "reason": "现有协作软件订阅将于 12 月到期，续费 20 个席位一年。",
      "item1": "协作软件 20 席位 × 12 月"
    },
    "r4": {
      "title": "年末团建活动预算",
      "applicant": "孙知夏",
      "department": "行政部",
      "reason": "组织全员年末团建，包含场地、餐饮与交通。",
      "item1": "场地租赁",
      "item2": "餐饮",
      "item3": "包车"
    },
    "managerApprove": "需求合理，同意采购。",
    "travelApprove": "行程已确认，同意。",
    "financeApprove": "预算内，已核对发票。",
    "rejectBudget": "预算超出部门季度额度，请压缩餐饮费用后重新提交。",
    "manager": "陈思远",
    "finance": "许清和"
  }
} as const;
