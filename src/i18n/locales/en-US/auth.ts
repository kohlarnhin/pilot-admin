import type source from '../zh-CN/auth';
import type { LocalizedDictionary } from '../../types';

export default {
  "adminRole": "Administrator",
  "operatorRole": "Operator",
  "viewerRole": "Viewer",
  "accountRequired": "Enter your account",
  "passwordRequired": "Enter your password",
  "loginSuccess": "Signed in",
  "loginFailed": "Sign-in failed. Please try again.",
  "login": "Sign in",
  "demoAccounts": "Demo accounts",
  "demoNote": "Click to fill credentials · Changes stay in this browser",
  "loginTitle": "Sign in to {name}",
  "fillDemo": "Use {role} account",
  "passwordChanged": "Password changed. Please sign in again.",
  "passwordChangeFailed": "Could not change your password",
  "changePassword": "Change password",
  "passwordDescription": "Sign in again with your new password after saving",
  "confirmChange": "Confirm change",
  "oldPassword": "Current password",
  "oldPasswordRequired": "Enter your current password",
  "confirmPassword": "Confirm new password",
  "confirmPasswordRequired": "Enter your new password again",
  "cancelled": "Sign-in cancelled",
  "sessionChanged": "Your session changed. Please sign in again."
} satisfies LocalizedDictionary<typeof source>;
