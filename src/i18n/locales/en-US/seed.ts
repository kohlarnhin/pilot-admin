import type { SeedText } from '../../seed';

export const seedText = {
  "roles": {
    "admin": {
      "name": "Administrator",
      "description": "Manage all pages, accounts and settings"
    },
    "operator": {
      "name": "Operator",
      "description": "View the overview and maintain user details and status"
    },
    "viewer": {
      "name": "Viewer",
      "description": "Read-only access to the overview and component examples"
    }
  },
  "accountNames": [
    "Alex Morgan",
    "Jordan Chen",
    "Taylor Reed"
  ],
  "familyNames": [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Wilson",
    "Anderson",
    "Taylor",
    "Thomas",
    "Moore",
    "Martin",
    "Lee",
    "Clark",
    "Walker",
    "Hall",
    "Young",
    "Allen",
    "King"
  ],
  "givenNames": [
    "Avery",
    "Oliver",
    "Amelia",
    "Noah",
    "Emma",
    "Liam",
    "Sophia",
    "Ethan",
    "Charlotte",
    "Lucas",
    "Mia",
    "Henry",
    "Isabella",
    "James",
    "Harper",
    "Benjamin",
    "Evelyn",
    "Daniel",
    "Grace"
  ],
  "nameOrder": "given-family",
  "nameSeparator": " ",
  "settingsDescription": "A general-purpose admin starter for your next project",
  "model": {
    "provider": "OpenAI compatible",
    "name": "Demo model"
  },
  "activities": {
    "system": "System",
    "settings": "Updated basic settings",
    "user": "Updated user details",
    "permissions": "Updated the operator’s menu permissions",
    "role": "Created the viewer role",
    "ready": "Demo data is ready"
  }
} satisfies SeedText;
