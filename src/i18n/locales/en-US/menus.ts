import type source from '../zh-CN/menus';
import type { LocalizedDictionary } from '../../types';

export default {
  "errors": {
    "load": "Could not load menus",
    "rename": "Could not rename"
  },
  "toast": {
    "renamed": "Display name updated"
  },
  "visibility": {
    "hidden": "Hidden",
    "visible": "Visible"
  },
  "columns": {
    "actionName": "Action name",
    "actionCode": "Action code"
  },
  "fields": {
    "permission": "Permission code",
    "code": "Menu code",
    "route": "Route",
    "icon": "Icon",
    "visibility": "Visibility",
    "status": "Menu status"
  },
  "actions": {
    "renameAction": "Rename action",
    "renameMenu": "Rename menu"
  },
  "total": "Menus: {count}",
  "description": "Routes and permission codes are built in; display names can be renamed",
  "filterPlaceholder": "Filter menus",
  "treeLabel": "Built-in menu tree",
  "empty": {
    "noMatches": "No matching menus",
    "noMenus": "No menus",
    "noActions": "This menu has no action permissions",
    "selectTitle": "Select a menu",
    "selectHint": "Select a menu to view its route and permission codes"
  },
  "details": {
    "title": "Menu details",
    "actionsTitle": "Action permissions "
  },
  "renameDialog": {
    "description": "Only the display name changes",
    "save": "Save name",
    "name": "Display name"
  }
} satisfies LocalizedDictionary<typeof source>;
