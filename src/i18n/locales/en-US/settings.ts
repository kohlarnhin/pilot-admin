import type source from '../zh-CN/settings';
import type { LocalizedDictionary } from '../../types';

export default {
  "sections": {
    "basic": {
      "title": "Basic settings",
      "description": "Site name and basic details"
    },
    "security": {
      "title": "Security settings",
      "description": "Passwords and security policies"
    },
    "notifications": {
      "title": "Notification settings",
      "description": "Manage notification preferences"
    },
    "demo": {
      "title": "Demo data",
      "description": "Restore demo data"
    }
  },
  "errors": {
    "load": "Could not load settings"
  },
  "toast": {
    "saved": "Settings saved"
  },
  "demo": {
    "confirmContent": "Users, roles, menu names, settings, preferences, audit logs and example projects will be reset, including all demo passwords. Continue?",
    "warning": "This overwrites all demo data stored in this browser and cannot be undone.",
    "initialData": "Initial data",
    "summary": "Users: 150 · Roles: 3 · Pages: 9",
    "description": "Includes administrator, operator and viewer accounts, default menus, security policies and notification preferences."
  },
  "description": "Configure site details, security and notifications",
  "sectionLabel": "Settings categories",
  "basic": {
    "name": "Site name",
    "nameHint": "Shown in the sidebar and browser title",
    "description": "Site description",
    "descriptionPlaceholder": "Briefly describe this admin workspace"
  },
  "security": {
    "title": "Password policy",
    "policyHint": "Applies to new accounts and password changes or resets. Existing passwords are not changed automatically.",
    "minLength": "Minimum password length",
    "lengthHint": "Between 6 and 32 characters",
    "requireNumber": "Require a number",
    "numberHint": "New passwords must include a number",
    "requireLetter": "Require a letter",
    "letterHint": "New passwords must include a letter"
  },
  "notifications": {
    "description": "Choose notification types. This demo only saves your preferences.",
    "systemNotices": "System notices",
    "noticesHint": "Receive update and maintenance notices",
    "accountChanges": "Account changes",
    "accountHint": "Notify when account details or roles change",
    "weeklySummary": "Weekly summary",
    "summaryHint": "Summarize weekly usage"
  }
} satisfies LocalizedDictionary<typeof source>;
