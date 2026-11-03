import type source from '../zh-CN/assistantSettings';
import type { LocalizedDictionary } from '../../types';

export default {
  "accessDenied": "You do not have permission to view AI assistant settings.",
  "description": "Manage models, assistant identity, prompt shortcuts and command capabilities by category",
  "workspace": {
    "sectionLabel": "Assistant settings sections",
    "unsaved": "Unsaved changes",
    "saved": "Up to date with saved settings",
    "reset": "Reset to saved",
    "readOnly": "Read-only access"
  },
  "models": {
    "title": "Model configurations",
    "description": "Configurations are stored in local demo data. The configured addresses are never requested."
  },
  "profile": {
    "loadFailed": "Could not load the assistant profile",
    "retry": "Reload assistant profile",
    "loading": "Loading assistant profile…"
  },
  "greeting": {
    "title": "Identity & greeting",
    "description": "Set the assistant name and introduction with a live preview.",
    "name": "Assistant name",
    "introduction": "Introduction",
    "placeholder": "Describe what the assistant can help with.",
    "preview": "Greeting preview",
    "save": "Save greeting",
    "promptHint": "Start with a question or describe what you need",
    "nameRequired": "Enter an assistant name",
    "greetingRequired": "Enter an introduction"
  },
  "shortcuts": {
    "title": "Prompt shortcuts",
    "description": "Up to 6 shortcuts, in display order. Each has a label and a prompt.",
    "label": "Shortcut {index} label",
    "prompt": "Shortcut {index} prompt",
    "moveLabel": "Shortcut {index}: {direction}",
    "moveUp": "Move up",
    "moveDown": "Move down",
    "deleteLabel": "Delete shortcut {index}",
    "add": "Add shortcut",
    "save": "Save shortcuts",
    "labelRequired": "Enter a button label",
    "promptRequired": "Enter a prompt"
  },
  "commands": {
    "title": "Commands & capabilities",
    "description": "Browse commands, bilingual triggers and permissions. Future tool toggles belong here.",
    "prefix": "Prefix command · accepts an argument",
    "noArgument": "No argument needed",
    "chinese": "Chinese triggers",
    "english": "English triggers",
    "permission": "Required access",
    "access": {
      "users": "Also requires access to User management",
      "destination": "Uses the destination page's access rules",
      "audit": "Also requires access to User management and Dashboard"
    },
    "items": {
      "createUser": "Choose a role and confirm to create a user account.",
      "findUsers": "Find users by name, account or email and open their management page.",
      "disableUsers": "Select matching accounts and confirm to disable them, excluding your own account.",
      "help": "View available assistant capabilities and permission requirements.",
      "overview": "View account totals and user statistics grouped by role.",
      "accountAudit": "Run a plan to inspect account status, roles and password policy, then generate a report.",
      "simulateError": "Demonstrate error feedback and retry after an assistant failure."
    }
  }
} satisfies LocalizedDictionary<typeof source>;
