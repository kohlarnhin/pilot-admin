import type source from '../zh-CN/users';
import type { LocalizedDictionary } from '../../types';

export default {
  "errors": {
    "loadUsers": "Could not load users",
    "loadRoles": "Could not load roles",
    "loadCount": "Could not load the user count",
    "resetPassword": "Could not reset",
    "load": "Could not load: {error}",
    "combined": "{current}; {error}"
  },
  "toast": {
    "updated": "User details updated",
    "created": "User Created",
    "enabled": "Enabled user: {name}",
    "disabled": "Disabled user: {name}",
    "deleted": "User deleted",
    "passwordReset": "Password reset"
  },
  "createdAccount": {
    "copyLabel": "Copy {name}",
    "notice": "Save these credentials. The password will not be shown again after closing."
  },
  "deleteDialog": {
    "content": "Delete user “{name}”? This account will no longer be able to sign in."
  },
  "columns": {
    "user": "User",
    "copyId": "Copy user ID",
    "noRole": "No role assigned"
  },
  "avatarFallback": "U",
  "fields": {
    "workEmail": "Work email",
    "loginName": "Login name",
    "displayName": "Display name",
    "initialPassword": "Initial password",
    "roles": "Assign roles"
  },
  "actions": {
    "disable": "Disable user",
    "enable": "Enable user"
  },
  "description": "Manage user accounts and assign RBAC roles",
  "searchPlaceholder": "Search accounts or names",
  "empty": {
    "noUsers": "No users",
    "retryHint": "Use Retry above to reload users",
    "searchHint": "Try a different keyword",
    "createHint": "Choose Create user to add an account"
  },
  "createDialog": {
    "description": "Create an account and assign roles"
  },
  "validation": {
    "loginRequired": "Enter a login name",
    "rolesRequired": "Select at least one role"
  },
  "placeholders": {
    "loginName": "For example: dev_smith",
    "displayName": "For example: Alex Smith",
    "keepPassword": "New password, or leave blank to keep it",
    "password": "Leave blank to generate",
    "roles": "Select roles"
  },
  "hints": {
    "keepPassword": "Leave blank to keep the password",
    "generatePassword": "Leave blank to generate a random password"
  },
  "resetDialog": {
    "description": "Set a new password for @{account}"
  },
  "total": "Users: {count}"
} satisfies LocalizedDictionary<typeof source>;
