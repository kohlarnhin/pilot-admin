import type source from '../zh-CN/serverErrors';
import type { LocalizedDictionary } from '../../types';

export default {
  "auth": {
    "invalidCredentials": "Incorrect account or password. Please try again.",
    "accountDisabled": "This account is disabled. Contact an administrator.",
    "sessionExpired": "Your session has expired. Please sign in again."
  },
  "password": {
    "confirmMismatch": "The new passwords do not match",
    "currentMismatch": "The current password is incorrect",
    "invalidMinLength": "Minimum password length must be between 6 and 32",
    "minLength": "Password must be at least {length} characters",
    "needLetter": "Password must include a letter",
    "needNumber": "Password must include a number"
  },
  "role": {
    "builtInProtected": "The built-in administrator role cannot be deleted",
    "nameRequired": "Enter a role name",
    "notFound": "Role not found",
    "invalidRole": "Enter a valid role name and code",
    "codeExists": "This role code already exists",
    "inUse": "This role is assigned to users. Reassign them first."
  },
  "agentConfig": {
    "incomplete": "Complete the model configuration",
    "invalidUrl": "Enter a valid HTTP or HTTPS URL",
    "notFound": "Configuration not found"
  },
  "agentProfile": {
    "incomplete": "Enter an assistant name and greeting",
    "invalidShortcuts": "Complete each prompt shortcut; up to 6 are allowed"
  },
  "menu": {
    "invalidName": "Menu not found or its name is empty",
    "invalidActionName": "Action not found or its name is empty"
  },
  "pagination": {
    "emptyPage": "The page is empty but indicates more results"
  },
  "settings": {
    "nameRequired": "Enter a site name"
  },
  "user": {
    "invalidRoles": "Select valid roles",
    "invalidAccount": "Enter a valid login name and display name",
    "loginNameExists": "This login name already exists",
    "notFound": "User not found",
    "selfDisable": "You cannot disable your own account",
    "selfDelete": "You cannot delete your own account"
  },
  "access": {
    "forbiddenAction": "You do not have permission for this action",
    "forbiddenPage": "You do not have permission to access this page"
  }
} satisfies LocalizedDictionary<typeof source>;
