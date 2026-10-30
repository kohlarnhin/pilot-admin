import type source from '../zh-CN/agentTools';
import type { LocalizedDictionary } from '../../types';

export default {
  "denied": "Your account does not have permission to {operation}. Ask an administrator to adjust your role, or try “{help}” to see available tools.",
  "operations": {
    "createUser": "create users",
    "disableUsers": "disable users",
    "assignRoles": "assign roles in bulk",
    "overview": "view user statistics",
    "accountAudit": "run an account audit",
    "perform": "perform this action"
  },
  "choices": {
    "confirmCreate": "Confirm creation",
    "confirmDisable": "Confirm disable"
  },
  "examples": {
    "findKeyword": "Chen"
  },
  "createUser": {
    "nameRequired": "Provide a name, for example “Create user Alice Morgan”.",
    "chooseRole": "Choose a role for **{name}**, then confirm to create the account.",
    "confirm": "Create **{name}** with role **{role}**? A login name and random initial password will be generated.",
    "created": "Created **{name}**.\n\n| Field | Value |\n| --- | --- |\n| Login name | `{account}` |\n| Initial password | `{password}` |\n\nSave the initial password and change it after the first sign-in. The user list has been updated."
  },
  "findUsers": {
    "results": "Users found: **{count}**{limit}.\n\n| Name | Account | Status |\n| --- | --- | --- |\n{rows}",
    "limit": "; showing the first 20",
    "empty": "No matching users. Try a different name, account or email keyword.",
    "openTitle": "View in Users",
    "keyword": "Search keyword: {keyword}",
    "all": "Open all users"
  },
  "disableUsers": {
    "keywordRequired": "Provide a name, account or email keyword, for example “Disable users Smith”.",
    "empty": "No matching users can be disabled. Your current account is excluded.",
    "confirmUser": "Disable **{name}** ({account})?",
    "select": "Users available to disable: **{count}**. Select accounts, then confirm in the next step.",
    "title": "Select users to disable",
    "confirmSelection": "Disable the selected users: **{count}**?",
    "completed": "Users disabled: **{count}**. The user list and overview have been updated."
  },
  "help": {
    "reply": "## How I can help\n\n- View account statistics\n- Find users and open admin pages\n- Create users, disable accounts and assign roles in bulk (permission and confirmation required)\n- Run an account audit plan\n\nAll actions follow your account’s permissions. Attachments use metadata only."
  },
  "fallback": {
    "reply": "I can help with account and admin tasks. Try a prompt below, or enter “Help” to see available tools."
  },
  "overview": {
    "reply": "## Overview stats\n\nUsers: **{count}**. Counts by role are shown below; accounts with multiple roles may appear more than once.\n\n| Role | Users | Enabled | Disabled |\n| --- | ---: | ---: | ---: |\n{rows}\n\nAccounts without roles: {noRole}."
  },
  "assignRoles": {
    "reply": "Open the action panel and select users and a target role. Saving replaces each selected user’s roles with the target role.",
    "description": "Select accounts and a role in the dialog, then continue the conversation.",
    "cancelled": "Batch role assignment cancelled. No accounts were changed."
  },
  "openPage": {
    "empty": "No matching page is available to your account. Check the page name and access permissions.",
    "reply": "You can open “{name}”.",
    "title": "Open {name}",
    "description": "You can return to this conversation after opening the page."
  },
  "attachment": {
    "reply": "Attachment metadata received.\n\n| Field | Value |\n| --- | --- |\n| File name | {name} |\n| Bytes | {size} |\n| Type | {type} |\n{lines}\nOnly this metadata is recorded. The file body is absent from messages and conversations.",
    "lines": "| Lines | {count} |\n",
    "unknown": "Unknown"
  },
  "accountAudit": {
    "reply": "Your account audit plan is ready. It only reads data. Stopping lets the current step finish, then stops later steps.",
    "steps": {
      "disabledTitle": "Check disabled accounts",
      "disabledDescription": "Count disabled accounts and check their status",
      "rolesTitle": "Check accounts without roles",
      "rolesDescription": "Find accounts that need role assignments",
      "passwordTitle": "Check password policy",
      "passwordDescription": "Check length, number and letter requirements",
      "reportTitle": "Generate audit report",
      "reportDescription": "Summarize findings and recommendations"
    },
    "disabledResult": "Users checked: {count}. Disabled accounts: {disabled}.",
    "rolesResult": "Accounts without roles: {count}.",
    "passwordResult": "Minimum password length: {length}; letters {letters}, numbers {numbers}.",
    "required": "required",
    "optional": "not required",
    "report": "## Account audit report\n\n| Check | Result |\n| --- | --- |\n| Users | {count} |\n| Disabled accounts | {disabled} |\n| Accounts without roles | {noRole} |\n| Min. password length | {length} |\n\nReview disabled accounts regularly, grant only required permissions and remind users to change initial passwords.\n\nThis audit did not change any data."
  },
  "engine": {
    "cancelled": "Cancelled. No changes were made.",
    "stoppedSuffix": "{partial}\n\n(Generation stopped)",
    "failed": "Processing failed. Try again.",
    "thinking": "Understanding your request…",
    "responding": "Preparing the results…",
    "planStopped": "Later steps are stopped. The current step will finish first.",
    "planInterrupted": "Execution interrupted. Retry the remaining steps.",
    "executeStep": "Run: {title}",
    "checking": "Running: {title}…",
    "stepInterrupted": "The current step was interrupted. You can continue the remaining steps.",
    "actionCancelled": "Action cancelled."
  }
} satisfies LocalizedDictionary<typeof source>;
