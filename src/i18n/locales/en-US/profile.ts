import type source from '../zh-CN/profile';
import type { LocalizedDictionary } from '../../types';

export default {
  title: 'Profile',
  description: 'Manage your details, security and preferences, and review your access',
  sectionLabel: 'Profile sections',
  sections: {
    basic: { title: 'Basic details', description: 'Name and contact details' },
    security: { title: 'Security', description: 'Change your password' },
    preferences: { title: 'Preferences', description: 'Language and workspace' },
    permissions: { title: 'My permissions', description: 'Roles, pages and actions' },
  },
  fields: {
    loginName: 'Login name',
    loginHint: 'Managed by an administrator; it cannot be changed here',
    displayName: 'Display name',
    nameHint: 'Up to 40 characters; used in the sidebar, account menu and audit logs',
    emailHint: 'Optional contact address; your login name stays the same',
  },
  toast: { saved: 'Profile saved' },
  preferences: {
    languageHint: 'Saved in this browser and synced across tabs',
    agentHint: 'Choose the admin console, Agent mode or a prompt after sign-in',
  },
  permissions: {
    roles: 'My roles',
    pages: 'Accessible pages',
    actions: 'Action permissions',
    noRoles: 'No active roles',
    noActions: 'No action permissions',
    readOnlyHint: 'You can view your granted pages without action permissions',
    pageCount: 'Pages: {count}',
    actionCount: 'Actions: {count}',
  },
} satisfies LocalizedDictionary<typeof source>;
