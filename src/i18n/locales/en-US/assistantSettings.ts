import type source from '../zh-CN/assistantSettings';
import type { LocalizedDictionary } from '../../types';

export default {
  "accessDenied": "You do not have permission to view AI assistant settings.",
  "description": "Configure models, assistant details and prompt shortcuts",
  "models": {
    "title": "Model configurations",
    "description": "Configurations are stored in local demo data. The configured addresses are never requested."
  },
  "profile": {
    "retry": "Reload assistant profile",
    "loading": "Loading assistant profile…"
  },
  "greeting": {
    "title": "Greeting",
    "description": "Shown at the start of a conversation. Preview it on the right.",
    "name": "Assistant name",
    "introduction": "Introduction",
    "placeholder": "Describe what the assistant can help with.",
    "preview": "Greeting preview",
    "save": "Save greeting",
    "promptHint": "Start with a question or describe what you need"
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
    "save": "Save shortcuts"
  }
} satisfies LocalizedDictionary<typeof source>;
