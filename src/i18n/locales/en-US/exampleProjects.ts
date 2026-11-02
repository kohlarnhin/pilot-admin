import type source from '../zh-CN/exampleProjects';
import type { LocalizedDictionary } from '../../types';

export default {
  "description": "A complete reference for paging, forms, permissions and batch actions",
  "detail": {
    "title": "Project Details",
    "back": "Back to projects",
    "metadata": "Project information",
    "createdBy": "Created by",
    "updatedBy": "Updated by",
    "systemActor": "System",
    "history": "Lifecycle",
    "historyCount": "Loaded: {count}",
    "historyEmpty": "No activity yet",
    "historyError": "Could not load activity",
    "notFound": "Project not found or already deleted",
    "noDescription": "No description"
  },
  "fields": {
    "name": "Project name",
    "code": "Project code",
    "owner": "Owner",
    "description": "Description"
  },
  "form": {
    "nameHint": "Enter a project name",
    "codeHint": "2–20 uppercase letters, numbers or hyphens; start with a letter"
  },
  "status": {
    "active": "Active",
    "paused": "Paused",
    "archived": "Archived"
  },
  "filters": {
    "search": "Search name, code or owner",
    "allStatuses": "All statuses"
  },
  "actions": {
    "export": "Export projects",
    "batchDelete": "Delete selected"
  },
  "selection": {
    "count": "Selected: {count}",
    "clear": "Clear selection"
  },
  "batchDialog": {
    "content": "Delete the selected projects ({count})? This cannot be undone."
  },
  "deleteDialog": {
    "content": "Delete project “{name}”? This cannot be undone."
  },
  "errors": {
    "load": "Could not load projects",
    "count": "Could not load the project count",
    "export": "Could not export projects"
  },
  "empty": {
    "title": "No matching projects",
    "hint": "Try changing the filters"
  },
  "total": "Projects: {count}",
  "toast": {
    "deleted": "Deleted successfully"
  }
} satisfies LocalizedDictionary<typeof source>;
