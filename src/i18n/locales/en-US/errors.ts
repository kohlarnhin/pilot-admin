import type source from '../zh-CN/errors';
import type { LocalizedDictionary } from '../../types';

export default {
  "unknown": "Unknown error",
  "updating": "Update available. Refreshing…",
  "updated": "Update Available",
  "pageProblem": "Something Went Wrong",
  "loadingUpdate": "Loading the latest version. Please wait.",
  "chunkFailed": "Page resources could not load. Refresh the page or return home.",
  "reloadOrHome": "Reload this page or return home. ",
  "reloadOnly": "Reload this page to continue. ",
  "contactAdmin": "If the issue continues, copy the error details and contact an administrator.",
  "refresh": "Refresh page",
  "reload": "Reload",
  "details": "Error details",
  "copyDetails": "Copy details",
  "copyFailed": "Copy failed. Please select and copy the error details manually.",
  "forbiddenTitle": "Access Denied",
  "forbiddenDescription": "Current role {role} does not have access to this page or module. Contact an administrator if you need access.",
  "notFoundTitle": "Page Not Found",
  "notFoundDescription": "This page does not exist or has moved."
} satisfies LocalizedDictionary<typeof source>;
