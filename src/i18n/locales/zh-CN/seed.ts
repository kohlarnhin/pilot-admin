import type { SeedText } from '../../seed';

export const seedText = {
  "roles": {
    "admin": {
      "name": "超级管理员",
      "description": "管理所有菜单、账号与系统配置"
    },
    "operator": {
      "name": "运营人员",
      "description": "查看概览，维护用户信息与状态"
    },
    "viewer": {
      "name": "访客",
      "description": "只读浏览概览与组件示例"
    }
  },
  "accountNames": [
    "林知行",
    "陈思远",
    "许清和"
  ],
  "familyNames": [
    "王",
    "李",
    "张",
    "刘",
    "陈",
    "杨",
    "黄",
    "赵",
    "周",
    "吴",
    "徐",
    "孙",
    "胡",
    "朱",
    "林",
    "何",
    "高",
    "郭",
    "马",
    "罗",
    "梁"
  ],
  "givenNames": [
    "雨桐",
    "子涵",
    "思源",
    "明轩",
    "若宁",
    "嘉禾",
    "星辰",
    "书瑶",
    "沐阳",
    "景行",
    "安然",
    "知夏",
    "亦凡",
    "清越",
    "文博",
    "语棠",
    "致远",
    "欣怡",
    "一诺"
  ],
  "nameOrder": "family-given",
  "nameSeparator": "",
  "settingsDescription": "通用管理端，让每个新项目轻装启航",
  "model": {
    "provider": "OpenAI 兼容",
    "name": "演示模型"
  },
  "exampleProjects": {
    "names": [
      "示例项目",
      "工作空间",
      "协作计划",
      "资源中心"
    ],
    "description": "用于演示标准 CRUD 功能的项目",
    "longDescription": "这个示例项目展示从列表进入详情、查看元数据和维护项目资料的完整流程。名称、编码、负责人和状态仍通过同一组服务读写，适合在 fork 后替换成自己的业务实体。\n\n描述可以保存多段文字，换行会原样保留。这里可以记录目标、交付范围、协作约定及需要后续确认的问题。较长的内容在自己的区域内滚动，不会推动页面标题或底部历史。文本保持可选择，编码也可以直接复制。\n\n生命周期按时间倒序展示这个项目的操作记录。编辑时只保存必要的审计信息，不将描述正文或原始表单写进历史。管理员、操作员和只读账号看到的操作入口不同，服务在每次写入时仍会重新校验权限。\n\n调整浏览器窗口高度可以验证详情布局：常规高度下，描述和历史独立滚动；较短窗口下，整列成为滚动区域，元数据和历史依然可以完整访问。"
  },
  "agentProfile": {
    "name": "领航助手",
    "greeting": "你好，我是你的工作助手。可以帮你查看概况、查找用户、维护账号和执行巡检。",
    "suggestions": [
      {
        "label": "概况统计",
        "prompt": "概况统计"
      },
      {
        "label": "查找用户",
        "prompt": "查找用户 陈"
      },
      {
        "label": "新增用户",
        "prompt": "新增用户 林沐晨"
      },
      {
        "label": "账号巡检",
        "prompt": "账号巡检"
      }
    ]
  },
  "agentSessions": {
    "checkPrompt": "第 {count} 次账号检查",
    "checkReply": "检查已完成，账号状态正常。\n\n- 保持最小权限\n- 定期核对账号状态",
    "demoName": "演示新用户",
    "createPrompt": "新增用户 {name}",
    "chooseRole": "为 **{name}** 选择一个角色，确认后再创建账号。",
    "longTitle": "账号检查记录 · 长会话示例",
    "createTitle": "新增用户 · 选择角色示例",
    "workTitle": "工作记录 {index}"
  }
} satisfies SeedText;
