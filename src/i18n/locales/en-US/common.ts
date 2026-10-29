import type source from '../zh-CN/common';
import type { LocalizedDictionary } from '../../types';

export default {
  "toast": {
    "updated": "Updated",
    "created": "Created",
    "saveFailed": "Could not save",
    "actionFailed": "Action failed",
    "saved": "Saved",
    "copied": "Copied",
    "copyFailed": "Copy failed. Please select and copy manually.",
    "copiedValue": "Copied: {text}",
    "actionRetry": "Action failed. Please try again."
  },
  "status": {
    "enabled": "Enabled",
    "disabled": "Disabled",
    "loading": "Loading"
  },
  "columns": {
    "updated": "Updated",
    "status": "Status",
    "actions": "Actions",
    "created": "Created"
  },
  "actions": {
    "delete": "Delete",
    "save": "Save",
    "create": "Create",
    "retry": "Retry",
    "back": "Back",
    "copy": "Copy",
    "home": "Back to home",
    "edit": "Edit",
    "close": "Close",
    "confirmDelete": "Confirm delete",
    "clear": "Clear",
    "confirmReset": "Confirm reset",
    "confirm": "OK",
    "cancel": "Cancel",
    "gotIt": "Got it"
  },
  "fields": {
    "account": "Account",
    "password": "Password",
    "newPassword": "New password",
    "email": "Email",
    "role": "Role"
  },
  "validation": {
    "passwordRequired": "Enter a new password",
    "nameRequired": "Enter a name",
    "accountFormat": "Use letters, numbers and underscores only",
    "emailInvalid": "Enter a valid email address"
  },
  "appDescription": "A general-purpose admin starter for your next project",
  "empty": {
    "noData": "No data",
    "unset": "Not set"
  },
  "units": {
    "people": "",
    "items": ""
  },
  "errors": {
    "loadData": "Could not load data"
  }
} satisfies LocalizedDictionary<typeof source>;
