import type source from '../zh-CN/agentCommands';
import type { LocalizedDictionary } from '../../types';

export default {
  "createUser": {
    "primary": "Create user",
    "alternate": "Add user"
  },
  "findUsers": {
    "primary": "Find users",
    "alternate": "Find user"
  },
  "disableUsers": {
    "primary": "Disable users",
    "alternate": "Disable user"
  },
  "openPage": {
    "primary": "Open",
    "alternate": "Open page"
  },
  "help": {
    "primary": "Help",
    "alternate": "What can you do"
  },
  "overview": {
    "primary": "Overview stats",
    "alternate": "Overview statistics"
  },
  "accountAudit": {
    "primary": "Account audit",
    "alternate": "Audit accounts"
  },
  "assignRoles": {
    "primary": "Batch assign roles",
    "alternate": "Assign roles"
  },
  "simulateError": {
    "primary": "Simulate error",
    "alternate": "Trigger error"
  }
} satisfies LocalizedDictionary<typeof source>;
