import type source from '../zh-CN/dashboard';
import type { LocalizedDictionary } from '../../types';

export default {
  "totalUsers": "Total users",
  "activeUsers": "Enabled users",
  "totalRoles": "Roles",
  "totalMenus": "Pages",
  "failed": "Could not load the overview",
  "hello": "Hello",
  "welcome": "{name}, welcome back. This is your admin workspace.",
  "todosTitle": "Tasks and shortcuts",
  "todosDescription": "Start your day with common tasks",
  "activitiesTitle": "Recent activity",
  "activitiesDescription": "Recent changes to users, permissions and settings",
  "noActivities": "No recent activity",
  "usersTitle": "Manage user accounts",
  "usersDescription": "Review account status and user details",
  "rolesTitle": "Review role permissions",
  "rolesDescription": "Assign page and action permissions by role",
  "componentsTitle": "Explore components",
  "componentsDescription": "Browse controls and interaction states",
  "settingsTitle": "Review settings",
  "settingsDescription": "Manage site details, security and notifications"
} satisfies LocalizedDictionary<typeof source>;
