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
  "exampleProjects": {
    "names": [
      "Example project",
      "Workspace",
      "Collaboration plan",
      "Resource hub"
    ],
    "description": "A project for the standard CRUD example",
    "longDescription": "This project demonstrates the complete journey from a list to record details. Name, code, owner and status use the same service boundary, ready to replace with your own entity after forking.\n\nUse this description to record goals, scope, collaboration notes and open questions. Paragraphs retain their line breaks. Long text scrolls within its own region while metadata and lifecycle information remain reachable. Text is selectable and the project code can be copied.\n\nThe lifecycle lists this project's actions in reverse chronological order. Audit entries contain only approved metadata, never the description or raw form values. Available actions depend on each account's grants, and services check permissions again before writing.\n\nResize the window to inspect the layout. At normal heights, description and history scroll independently. A short viewport lets the whole detail column scroll, keeping every section accessible."
  },
  "agentProfile": {
    "name": "Pilot assistant",
    "greeting": "Hello, I’m your work assistant. I can help you view statistics, find users, manage accounts and run audits.",
    "suggestions": [
      {
        "label": "Overview stats",
        "prompt": "Overview stats"
      },
      {
        "label": "Find users",
        "prompt": "Find users Chen"
      },
      {
        "label": "Create user",
        "prompt": "Create user Alice Morgan"
      },
      {
        "label": "Account audit",
        "prompt": "Account audit"
      }
    ]
  },
  "agentSessions": {
    "checkPrompt": "Account check {count}",
    "checkReply": "Check complete. Account status is normal.\n\n- Grant only required permissions\n- Review account status regularly",
    "demoName": "Demo User",
    "createPrompt": "Create user {name}",
    "chooseRole": "Choose a role for **{name}**, then confirm to create the account.",
    "longTitle": "Account checks · Long conversation example",
    "createTitle": "Create user · Role choice example",
    "workTitle": "Work log {index}"
  }
} satisfies SeedText;
