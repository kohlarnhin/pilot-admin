import type source from '../zh-CN/serverErrors';
import type { LocalizedDictionary } from '../../types';

export default {
  "staleBuild": "A newer page has upgraded this data. Reload this page to continue.",
  profile: { invalidName: 'Enter a display name of up to 40 characters' },
  "example": {
    "invalidName": "Enter a project name of up to 60 characters",
    "invalidCode": "Use 2–20 uppercase letters, numbers or hyphens, starting with a letter",
    "invalidOwner": "Enter an owner of up to 40 characters",
    "invalidStatus": "Select a valid project status",
    "invalidDescription": "Description must be at most 1000 characters",
    "codeExists": "This project code already exists",
    "notFound": "Project not found or already deleted",
    "invalidImport": "Invalid import ID or batch (1–25 rows with unique row numbers)",
    "batchLimit": "Select 1–100 projects per batch"
  },
  "audit": { "invalidParams": "Audit parameters do not match the action" },
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
  },
  "agent": {
    "noModel": "No enabled model configuration",
    "sessionNotFound": "Conversation not found",
    "interactionExpired": "This interaction has expired. Start the action again.",
    "choiceUnsupported": "This tool does not support choice replies",
    "selectionUnsupported": "This tool does not support selection replies",
    "toolUnavailable": "No tool is available",
    "interactionSubmitted": "This interaction was submitted or has expired. Use the latest reply.",
    "invalidChoice": "Invalid choice",
    "invalidSelection": "Select valid options",
    "planNotFound": "Plan not found",
    "planExecuted": "The plan has already started",
    "planChanged": "The plan execution state has changed",
    "planUnsupported": "This tool does not support execution plans",
    "actionNotFound": "Action not found",
    "resultSaved": "The result has already been saved",
    "nameExpired": "The action has expired. Provide the name again.",
    "roleUnavailable": "The role is unavailable",
    "roleRequired": "Select a role first",
    "usersExpired": "The action has expired. Select the users again.",
    "auditStepNotFound": "Audit step not found",
    "simulated": "The simulated service is unavailable. Choose Retry."
  }
} satisfies LocalizedDictionary<typeof source>;
