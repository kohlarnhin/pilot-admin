import type source from '../zh-CN/audit';
import type { LocalizedDictionary } from '../../types';

export default {
  "description": "Review structured records of account, permission and configuration changes",
  "module": {
    "auth": "Authentication",
    "user": "Users",
    "role": "Roles",
    "menu": "Menus",
    "settings": "Settings",
    "agentConfig": "Model config",
    "agentProfile": "Assistant profile",
    "profile": "Profile",
    "example": "Projects"
  },
  "action": {
    "auth": {
      "login": "Signed in",
      "loginFailed": "Sign-in failed",
      "logout": "Signed out",
      "passwordChange": "Changed their password"
    },
    "user": {
      "create": "Created user “{target}”",
      "update": "Updated user “{target}”",
      "status": "Set user “{target}” to {status}",
      "resetPassword": "Reset the password for “{target}”",
      "delete": "Deleted user “{target}”"
    },
    "role": {
      "create": "Created role “{target}”",
      "update": "Updated role “{target}”",
      "status": "Set role “{target}” to {status}",
      "delete": "Deleted role “{target}”",
      "permissions": "Updated permissions for “{target}” (Menus: {menuCount}, Actions: {buttonCount})"
    },
    "menu": {
      "rename": "Renamed a menu to “{target}”"
    },
    "button": {
      "rename": "Renamed an action to “{target}”"
    },
    "settings": {
      "update": "Updated {section}",
      "resetDemo": "Reset demo data"
    },
    "agentConfig": {
      "create": "Created model configuration “{target}”",
      "update": "Updated model configuration “{target}”",
      "delete": "Deleted model configuration “{target}”",
      "status": "Set model configuration “{target}” to {status}"
    },
    "agentProfile": {
      "update": "Updated assistant profile “{target}”"
    },
    "profile": {
      "update": "Updated their profile ({fields})"
    },
    "example": {
      "create": "Created project “{target}”",
      "update": "Updated project “{target}”",
      "delete": "Deleted project “{target}”",
      "import": "Projects imported: {count}; failed: {failed}",
      "batchDelete": "Projects deleted: {count}"
    }
  },
  "reason": {
    "invalidCredentials": "Invalid credentials",
    "accountDisabled": "Account disabled",
    "forbidden": "Permission denied",
    "invalidInput": "Invalid input",
    "notFound": "Target not found",
    "conflict": "Data conflict"
  },
  "section": {
    "basic": "basic settings",
    "security": "security settings",
    "notifications": "notification settings"
  },
  "result": {
    "success": "Success",
    "failure": "Failure"
  },
  "fields": {
    "time": "Time",
    "actor": "Actor",
    "module": "Module",
    "action": "Action",
    "result": "Result",
    "id": "Log ID",
    "actorId": "Actor ID",
    "actionCode": "Action code",
    "targetType": "Target type",
    "targetId": "Target ID",
    "targetName": "Target name",
    "params": "Parameters",
    "reason": "Reason",
    "traceId": "Trace ID"
  },
  "params": {
    "status": "Status",
    "menuCount": "Menu count",
    "buttonCount": "Action count",
    "section": "Settings category",
    "failed": "Failed",
    "count": "Count",
    "fields": "Changed fields"
  },
  "profileFields": {
    "userName": "Display name",
    "email": "Email",
    "agentModeEntry": "Agent entry preference"
  },
  "targetType": {
    "user": "User",
    "role": "Role",
    "menu": "Menu",
    "button": "Action",
    "settings": "Settings",
    "agentConfig": "Model configuration",
    "agentProfile": "Assistant profile",
    "example": "Project"
  },
  "filters": {
    "search": "Search actor, target or trace ID",
    "module": "Filter by module",
    "result": "Filter by result",
    "allModules": "All modules",
    "allResults": "All results"
  },
  "total": "Total: {count}",
  "detail": "Log Details",
  "viewDetail": "View details",
  "viewAll": "View all",
  "empty": {
    "title": "No matching logs",
    "hint": "Try changing the filters"
  },
  "errors": {
    "load": "Could not load audit logs",
    "count": "Could not load the log count",
    "export": "Could not export audit logs"
  },
  "unknownActor": "Unknown account",
  "unknownTarget": "Unknown target"
} satisfies LocalizedDictionary<typeof source>;
