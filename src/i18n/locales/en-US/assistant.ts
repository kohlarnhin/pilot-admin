import type source from '../zh-CN/assistant';
import type { LocalizedDictionary } from '../../types';

export default {
  "header": {
    "subtitle": "Your work companion",
    "notifications": "Assistant notifications",
    "newConfirm": "Start a new conversation?",
    "start": "Start",
    "newConversation": "New conversation",
    "startConversation": "Start a new conversation",
    "history": "Conversation history",
    "collapse": "Collapse panel",
    "expand": "Expand panel",
    "toggle": "Open/close",
    "close": "Close AI assistant"
  },
  "composer": {
    "attach": "Attach file",
    "reading": "Reading attachment…",
    "parsing": "Parsing…",
    "removeAttachment": "Remove attachment",
    "unavailable": "Assistant unavailable",
    "decision": "Enter your decision…",
    "placeholder": "Describe your question or task…",
    "messageLabel": "Message to AI assistant",
    "attachHint": "Attach a file up to 5 MB; only its name, size, type and line count are kept",
    "stopHint": "You can stop anytime",
    "sendHint": "Enter to send",
    "stop": "Stop generating",
    "send": "Send message",
    "attachmentPrompt": "Please review this attachment’s metadata.",
    "metadata": "Bytes: {size}{lines} · Metadata only",
    "lineCount": " · Lines: {count}"
  },
  "confirmation": {
    "selected": "Selected: {label}",
    "prompts": "Try these prompts",
    "role": "Choose a role",
    "waiting": "Awaiting confirmation",
    "selectedHint": "The assistant continued with your choice.",
    "promptHint": "Choose a prompt to continue.",
    "roleHint": "Confirm creation after choosing a role.",
    "activeHint": "Confirm to let the assistant continue this step.",
    "expiredHint": "The conversation has moved on. This action cannot be repeated.",
    "groupLabel": "Choose the next step"
  },
  "empty": {
    "enableModel": "Enable a model configuration and try again.",
    "contactAdmin": "Ask an administrator to configure a model.",
    "settings": "Go to assistant settings",
    "workspace": "AGENT / WORKSPACE",
    "modelRequired": "No enabled model configuration. Configure one in Assistant settings."
  },
  "plan": {
    "status": {
      "proposed": "Proposed",
      "waitingUser": "Needs input",
      "pending": "Pending"
    },
    "hints": {
      "proposed": "Confirm to run the steps in order. Progress appears in the conversation.",
      "running": "Steps run in order. Stop anytime; the current step finishes, then no new step starts.",
      "waitingUser": "Waiting for you to finish the previous action.",
      "completed": "All steps are complete.",
      "paused": "The plan is paused. You can continue the remaining steps."
    },
    "region": "Execution plan",
    "title": "Execution plan · {title}",
    "adjust": "Adjust plan",
    "confirm": "Confirm and run",
    "stop": "Stop",
    "resume": "Continue",
    "adjustPrompt": "Please adjust the plan: "
  },
  "markdown": {
    "code": "Code",
    "copyCode": "Copy code",
    "codeRegion": "{language} code block; scroll horizontally",
    "tableRegion": "Table; scroll horizontally"
  },
  "messages": {
    "continuePlan": "Continue plan",
    "continueBatch": "Continue next batch",
    "user": "Your message",
    "attachment": "{name} · Bytes: {size}",
    "failed": "Assistant reply failed",
    "assistant": "Assistant message",
    "retry": "Retry",
    "generating": "Generating",
    "stopped": "Generation stopped",
    "copy": "Copy reply",
    "loadingOlder": "Loading earlier messages",
    "region": "Assistant conversation messages",
    "loading": "Loading conversation",
    "log": "Conversation log",
    "olderHint": "Scroll up for earlier messages",
    "stepsCompleted": "Steps completed: {count}",
    "latestLabel": "Scroll to latest message",
    "latest": "Back to latest",
    "typing": "Assistant is generating a reply",
    "stopReply": "This reply was stopped.",
    "selectedUsers": "Selected users: {names}"
  },
  "pageAction": {
    "saveFailed": "Could not save the result. Try again.",
    "completed": "Action completed",
    "openPage": "Open page",
    "openPanel": "Open action panel",
    "retrySave": "Retry saving result"
  },
  "selection": {
    "region": "User selection",
    "submitted": "Selection submitted",
    "count": "Selected: {count} / {max}",
    "optionLabel": "Select {label}",
    "confirm": "Confirm selection ({count})",
    "submittedHint": "Selection submitted. Review the confirmation below.",
    "inactiveHint": "This form is inactive. Use the latest reply."
  },
  "history": {
    "back": "Back to conversation",
    "escape": "Esc to return",
    "loading": "Loading conversation history",
    "emptyTitle": "No conversation history",
    "emptyHint": "Start a conversation and return here to continue anytime.",
    "count": "Messages: {count}",
    "current": "Current",
    "loadingMore": "Loading more conversations…"
  },
  "errors": {
    "unavailable": "AI assistant is unavailable. Try again later.",
    "attachmentSize": "Files must not exceed 5 MB",
    "attachmentRead": "Could not read file metadata. Select the file again.",
    "loadOlder": "Could not load earlier messages",
    "loadHistory": "Could not load conversations. Try again.",
    "loadConversation": "Could not load conversation details",
    "planLimit": "The plan continuation limit was reached. Adjust the plan.",
    "planState": "Invalid plan execution state"
  },
  "toast": {
    "newConversation": "New conversation started"
  },
  "progress": {
    "selection": "Submitting selection…",
    "confirmed": "Running the confirmed action…",
    "preparing": "Preparing…",
    "nextStep": "Running the next plan step…"
  },
  "notifications": {
    "confirm": "Confirmation needed: {text}",
    "completed": "Completed: {text}",
    "unsupported": "This browser does not support notifications",
    "denied": "Notifications are blocked. Enable them in this site’s browser permissions.",
    "enabled": "Completion notifications are on · Alerts when the assistant is closed or the tab is hidden",
    "disabled": "Enable assistant completion notifications"
  },
  "assignRoles": {
    "selectionRequired": "Select at least one user and a target role",
    "completed": "Users assigned role **{role}**: **{count}**. The user list has been updated.",
    "partialError": "{error} (Completed: {count}. Retry the remaining users.)",
    "cancelledRest": "Batch assignment ended. Users updated: **{count}**. Remaining actions were cancelled.",
    "save": "Save and return",
    "description": "The target role will replace each selected account’s roles.",
    "targetRole": "Target role",
    "searchLabel": "Search users for role assignment",
    "searchPlaceholder": "Search names or accounts",
    "selected": "Users selected: {count}",
    "listLabel": "User selection list",
    "loading": "Loading users…"
  },
  "legacyGreeting": "Hello! I’m Pilot assistant. I can help you view statistics, find users and manage accounts."
} satisfies LocalizedDictionary<typeof source>;
