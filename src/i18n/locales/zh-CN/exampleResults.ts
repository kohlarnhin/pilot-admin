export default {
  "title": "结果与异常页",
  "description": "可复用的结果反馈 · 操作成功、失败与异常恢复",
  "catalog": "状态示例",
  "demo": "连接重试演示",
  "demoHint": "从连接中断状态开始，重试会调用无持久化的模拟服务。",
  "retry": "重新连接",
  "retrying": "正在重新连接…",
  "connected": "连接已恢复",
  "connectedHint": "模拟请求已完成，可以继续当前操作。",
  "retryFailed": "连接失败，暂时无法完成请求。请再次重试。",
  "restart": "再次演示",
  "home": "返回概览",
  "tryForm": "打开表单",
  "edit": "返回修改",
  "continue": "继续填写",
  "variants": {
    "success": {
      "title": "操作已完成",
      "description": "所填信息已通过检查，可以继续下一步操作。"
    },
    "error": {
      "title": "提交未完成",
      "description": "本次请求未成功，已填写的内容会保留。请检查后重试。"
    },
    "info": {
      "title": "开始前请确认资料",
      "description": "准备好名称、联系方式与有效日期后，即可填写表单。"
    },
    "warning": {
      "title": "还有信息需要确认",
      "description": "部分可选信息尚未填写。请核对后决定是否继续。"
    },
    "forbidden": {
      "title": "无权访问此页面",
      "description": "当前角色没有此页面的访问权限，请联系管理员。"
    },
    "notFound": {
      "title": "未找到页面",
      "description": "链接可能已失效，或页面已移动到其他位置。"
    },
    "server": {
      "title": "服务暂时不可用",
      "description": "请求遇到问题，请稍后重试或返回概览。"
    },
    "network": {
      "title": "连接已中断",
      "description": "暂时无法连接到服务，请检查网络后重新连接。"
    },
    "maintenance": {
      "title": "服务维护中",
      "description": "服务正在更新，维护完成后可继续使用。请稍后返回。"
    }
  }
} as const;
