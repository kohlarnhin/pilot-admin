import type source from '../zh-CN/activity';
import type { LocalizedDictionary } from '../../types';

export default {
  "role": {
    "created": "Created role {name}",
    "permissionsUpdated": "Updated permissions for role {name}"
  },
  "settings": {
    "updated": "Updated system settings"
  },
  "user": {
    "created": "Created user {name}",
    "deleted": "Deleted user {name}"
  }
} satisfies LocalizedDictionary<typeof source>;
