export default {
  "denied": "当前账号没有{operation}的权限。你可以联系管理员调整角色权限，或试试「{help}」查看可用能力。",
  "operations": {
    "createUser": "新增用户",
    "disableUsers": "停用用户",
    "assignRoles": "批量分配角色",
    "overview": "查看用户统计",
    "accountAudit": "账号巡检",
    "perform": "执行此操作"
  },
  "choices": {
    "confirmCreate": "确认创建",
    "confirmDisable": "确认停用"
  },
  "examples": {
    "findKeyword": "陈"
  },
  "createUser": {
    "nameRequired": "请告诉我用户姓名，例如「新增用户 林沐晨」。",
    "chooseRole": "为 **{name}** 选择一个角色，确认后再创建账号。",
    "confirm": "即将创建 **{name}**，角色为 **{role}**。系统会生成登录账号与随机初始密码，是否继续？",
    "created": "已创建 **{name}**。\n\n| 项目 | 内容 |\n| --- | --- |\n| 登录账号 | `{account}` |\n| 初始密码 | `{password}` |\n\n请保存初始密码并在首次登录后修改。用户列表已自动更新。"
  },
  "findUsers": {
    "results": "找到 **{count}** 位用户{limit}。\n\n| 姓名 | 账号 | 状态 |\n| --- | --- | --- |\n{rows}",
    "limit": "，先展示前 20 位",
    "empty": "没有找到匹配的用户，可以换一个姓名、账号或邮箱关键词。",
    "openTitle": "在用户管理中查看",
    "keyword": "查找关键词：{keyword}",
    "all": "打开全部用户"
  },
  "disableUsers": {
    "keywordRequired": "请提供姓名、账号或邮箱关键词，例如「停用用户 王」。",
    "empty": "没有可停用的匹配用户（当前账号不会被停用）。",
    "confirmUser": "确认停用 **{name}**（{account}）？",
    "select": "找到 **{count}** 位可停用用户，请选择要操作的账号。下一步仍需确认。",
    "title": "选择要停用的用户",
    "confirmSelection": "确认停用选中的 **{count}** 位用户？",
    "completed": "已停用 **{count}** 位用户。用户列表和概览已同步更新。"
  },
  "help": {
    "reply": "## 我可以帮你\n\n- 查看账号概况与统计\n- 查找用户并打开管理页面\n- 新增用户、停用账号与批量分配角色（需要权限并确认）\n- 按计划执行账号巡检\n\n所有操作遵循当前账号权限。附件只读取元数据。"
  },
  "fallback": {
    "reply": "我可以帮你处理账号与管理任务。试试下面的提问，或输入「帮助」了解可用能力。"
  },
  "overview": {
    "reply": "## 概况统计\n\n共 **{count}** 位用户，按角色统计如下（多角色账号可重复计入）。\n\n| 角色 | 用户数 | 已启用 | 已停用 |\n| --- | ---: | ---: | ---: |\n{rows}\n\n无角色账号：{noRole} 位。"
  },
  "assignRoles": {
    "reply": "请打开操作面板，选择用户和目标角色。保存后会将所选用户的角色替换为目标角色。",
    "description": "在弹窗中选择账号与角色，完成后继续对话。",
    "cancelled": "已取消批量分配角色，没有修改账号。"
  },
  "openPage": {
    "empty": "当前账号没有可打开的匹配页面。请确认页面名称与访问权限。",
    "reply": "可以打开「{name}」。",
    "title": "打开{name}",
    "description": "打开页面后，可随时返回当前对话。"
  },
  "attachment": {
    "reply": "已收到附件元数据。\n\n| 项目 | 内容 |\n| --- | --- |\n| 文件名 | {name} |\n| 大小 | {size} 字节 |\n| 类型 | {type} |\n{lines}\n只记录上述元数据，文件正文没有进入消息或会话。",
    "lines": "| 行数 | {count} |\n",
    "unknown": "未知"
  },
  "accountAudit": {
    "reply": "已为你准备账号巡检计划。执行过程只读取数据；停止会让当前步骤完成，再停止后续步骤。",
    "steps": {
      "disabledTitle": "检查停用账号",
      "disabledDescription": "统计已停用账号并核对状态",
      "rolesTitle": "检查无角色账号",
      "rolesDescription": "查找需要补充分配角色的账号",
      "passwordTitle": "检查密码策略",
      "passwordDescription": "核对长度、数字与字母要求",
      "reportTitle": "生成巡检报告",
      "reportDescription": "汇总检查结果与建议"
    },
    "disabledResult": "已检查 {count} 位用户，发现 {disabled} 个停用账号。",
    "rolesResult": "发现 {count} 个无角色账号。",
    "passwordResult": "密码至少 {length} 位；{letters}字母，{numbers}数字。",
    "required": "要求",
    "optional": "不要求",
    "report": "## 账号巡检报告\n\n| 检查项 | 结果 |\n| --- | --- |\n| 用户总数 | {count} |\n| 停用账号 | {disabled} |\n| 无角色账号 | {noRole} |\n| 密码最少长度 | {length} |\n\n建议定期核对停用账号，保持最小权限，并提醒用户更新初始密码。\n\n本次巡检未修改数据。"
  },
  "engine": {
    "cancelled": "已取消，未做任何修改。",
    "stoppedSuffix": "{partial}\n\n（已停止生成）",
    "failed": "处理失败，请重试",
    "thinking": "正在理解你的需求…",
    "responding": "正在整理结果…",
    "planStopped": "已停止后续步骤，当前步骤完成后结束。",
    "planInterrupted": "执行中断，请重试剩余步骤。",
    "executeStep": "执行：{title}",
    "checking": "正在{title}…",
    "stepInterrupted": "当前步骤中断，可继续执行剩余步骤。",
    "actionCancelled": "已取消操作。"
  }
} as const;
