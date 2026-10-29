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
  "activities": {
    "system": "系统",
    "settings": "更新了系统基本设置",
    "user": "完善了用户资料",
    "permissions": "调整了运营人员的菜单权限",
    "role": "创建了访客角色",
    "ready": "演示数据已准备就绪"
  }
} satisfies SeedText;
