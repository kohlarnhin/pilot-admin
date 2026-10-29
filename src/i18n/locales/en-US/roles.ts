import type source from '../zh-CN/roles';
import type { LocalizedDictionary } from '../../types';

export default {
  "toast": {
    "enabled": "Enabled role: {name}",
    "disabled": "Disabled role: {name}",
    "updated": "Role updated",
    "created": "Role created",
    "permissionsSaved": "Permissions updated for {name}",
    "deleted": "Role deleted"
  },
  "errors": {
    "loadRoles": "Could not load the role list",
    "loadResources": "Could not load page and action permissions",
    "loadCount": "Could not load the role count",
    "loadPermissions": "Could not load role permissions",
    "savePermissions": "Could not save permissions"
  },
  "deleteDialog": {
    "content": "Delete role “{name}”? Remove it from any assigned users first."
  },
  "columns": {
    "noDescription": "No description",
    "resources": "Permissions",
    "resourceCounts": "Menus: {menus}{separator}Actions: {buttons}"
  },
  "fields": {
    "code": "Role code",
    "name": "Role name",
    "description": "Role description"
  },
  "actions": {
    "disable": "Disable role",
    "enable": "Enable role"
  },
  "description": "Manage roles with page and action permissions",
  "total": "Roles: {count}",
  "empty": {
    "noRoles": "No roles",
    "retryHint": "Use Retry above to reload roles",
    "createHint": "Choose Create role to define responsibilities and permissions"
  },
  "createDialog": {
    "description": "Define a role, then configure its permissions"
  },
  "placeholders": {
    "name": "For example: Auditor",
    "code": "For example: ROLE_AUDITOR",
    "description": "Describe this role’s responsibilities (optional)"
  },
  "validation": {
    "codeRequired": "Enter a role code"
  },
  "permissionDialog": {
    "title": "Configure role permissions",
    "description": "For {role} {code}: assign page and action permissions. Changes apply now to this account and at the next sign-in for other accounts.",
    "save": "Save permissions",
    "loadResources": "Loading pages and actions",
    "loadPermissions": "Loading role permissions",
    "selectedMenus": "Selected menus ",
    "selectedActions": "Selected actions ",
    "selectAll": "Select all available",
    "linkedTitle": "Linked page and action permissions",
    "linkedHint": "Selecting an action also selects its page and parent menus. Clearing a menu clears its descendants and actions.",
    "pagesTitle": "Module and page permissions",
    "pagesHint": "Select pages for access and actions for permitted operations",
    "emptyHint": "Configure menus and actions first",
    "selectPages": "Select pages",
    "pageAccess": "Page access",
    "actionsTitle": "Action permissions",
    "quickActions": "Quick actions",
    "codeLabel": "Permission: ",
    "readOnly": "Read-only access, no separate actions",
    "clearActions": "Clear all",
    "selectActions": "Select all",
    "standalone": "Standalone page",
    "subpages": "Subpages: {count}"
  }
} satisfies LocalizedDictionary<typeof source>;
