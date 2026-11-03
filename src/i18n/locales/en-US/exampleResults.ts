import type source from '../zh-CN/exampleResults';
import type { LocalizedDictionary } from '../../types';

export default {
  "title": "Results and exceptions",
  "description": "Reusable feedback · completed actions, failures and recovery",
  "catalog": "Status examples",
  "demo": "Connection retry demo",
  "demoHint": "Starts with a lost connection. Retrying calls a stateless mock service.",
  "retry": "Reconnect",
  "retrying": "Reconnecting…",
  "connected": "Connection restored",
  "connectedHint": "The mock request completed. You can continue your work.",
  "retryFailed": "The connection failed and the request could not complete. Please retry.",
  "restart": "Try the demo again",
  "home": "Back to overview",
  "tryForm": "Open form",
  "edit": "Return to editing",
  "continue": "Continue editing",
  "variants": {
    "success": {
      "title": "Operation completed",
      "description": "Your information passed validation. You can continue to the next step."
    },
    "error": {
      "title": "Submission did not complete",
      "description": "The request failed. Your input has been preserved. Check the details and retry."
    },
    "info": {
      "title": "Check your details before starting",
      "description": "Have a name, contact details and effective dates ready before completing the form."
    },
    "warning": {
      "title": "Some details need your attention",
      "description": "Some optional information is missing. Review it before deciding to continue."
    },
    "forbidden": {
      "title": "Access is restricted",
      "description": "Your current role cannot access this page. Contact an administrator."
    },
    "notFound": {
      "title": "Page not found",
      "description": "The link may have expired, or the page may have moved."
    },
    "server": {
      "title": "Service temporarily unavailable",
      "description": "The request encountered a problem. Try later or return to the overview."
    },
    "network": {
      "title": "Connection lost",
      "description": "The service cannot be reached. Check your connection and reconnect."
    },
    "maintenance": {
      "title": "Maintenance in progress",
      "description": "The service is being updated. Come back after maintenance is complete."
    }
  }
} satisfies LocalizedDictionary<typeof source>;
