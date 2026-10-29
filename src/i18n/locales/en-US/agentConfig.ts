import type source from '../zh-CN/agentConfig';
import type { LocalizedDictionary } from '../../types';

export default {
  "errors": {
    "load": "Could not load AI assistant configurations"
  },
  "providers": {
    "openai": "OpenAI compatible",
    "local": "Local model",
    "other": "Other"
  },
  "columns": {
    "model": "Model"
  },
  "fields": {
    "provider": "Provider",
    "modelCode": "Model code",
    "modelName": "Model name"
  },
  "actions": {
    "disable": "Disable configuration",
    "enable": "Enable configuration",
    "edit": "Edit configuration",
    "delete": "Delete configuration",
    "create": "Add configuration"
  },
  "access": {
    "editDenied": "No permission to edit",
    "createDenied": "No permission to create"
  },
  "deleteDialog": {
    "title": "Delete model configuration?",
    "content": "Delete {name}"
  },
  "description": "Local demo configurations · No model requests",
  "empty": {
    "title": "No AI assistant configurations",
    "description": "Add a demo model configuration to use the assistant"
  },
  "form": {
    "editTitle": "Edit AI assistant configuration",
    "createTitle": "Add AI assistant configuration"
  },
  "validation": {
    "providerRequired": "Select a provider",
    "urlRequired": "Enter a Base URL",
    "codeRequired": "Enter a model code",
    "codeLength": "Model code must not exceed 150 characters",
    "nameRequired": "Enter a model name",
    "nameLength": "Model name must not exceed 150 characters"
  },
  "hints": {
    "url": "Saved for display only; this address is never requested.",
    "keepKey": "Leave blank to keep the key. Keys are shown masked.",
    "demoKey": "Demo configurations do not need real keys."
  },
  "placeholders": {
    "name": "For example: Demo model",
    "apiKey": "Stored locally only"
  },
  "modelPicker": {
    "placeholder": "Select or enter a model code",
    "toggle": "Show available models",
    "label": "Available models",
    "loading": "Loading models…",
    "empty": "No matching models. Enter a model code directly."
  }
} satisfies LocalizedDictionary<typeof source>;
