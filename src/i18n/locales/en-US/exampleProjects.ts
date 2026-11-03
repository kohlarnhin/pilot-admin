import type source from '../zh-CN/exampleProjects';
import type { LocalizedDictionary } from '../../types';

export default {
  "import": {
    "title": "Import CSV",
    "notice": "Use machine headers and status codes, separated by commas. Up to 500 records / 1 MB. Regular exports are not import files.",
    "template": "Download template (UTF-8 BOM)",
    "roundTrip": "Values are imported as text, preserving leading apostrophes. Downloads add an apostrophe to formula prefixes for safety, so those values may not round-trip exactly.",
    "filePreview": "File and source",
    "selectFile": "Drop or select a CSV file",
    "fileHint": ".csv · UTF-8 / GB18030 · Comma separated",
    "noFile": "No file selected",
    "encoding": "File encoding",
    "rawPreview": "Source preview",
    "parsedPreview": "Parsed records",
    "previewPlaceholder": "Select a file to preview",
    "truncated": "Showing only the first 200 lines or 20,000 characters; all records are validated.",
    "detectedFallback": "Strict UTF-8 decoding failed. Using GB18030; you can switch encoding.",
    "localOnly": "Read and parsed locally; the original file is not uploaded.",
    "rowNo": "Record",
    "validity": "Validation / result",
    "counts": "Total {total} · Valid {valid} · Invalid {invalid}",
    "valid": "Valid",
    "created": "Created",
    "skipped": "Skipped",
    "failed": "Import failed (receipt recorded)",
    "downloadFailed": "Download failed rows",
    "done": "Done",
    "continue": "Continue importing",
    "start": "Start import",
    "progress": "Processed {processed}/{total} · Created {created} · Skipped {skipped} · Failed {failed}",
    "completedHint": "Results retained. The failed-rows download includes skipped and rejected rows. Done refreshes the list.",
    "validHint": "Only valid rows are sent. The service checks codes already in the database.",
    "recoveryHint": "After interruption, continue to check committed status before sending remaining rows.",
    "states": {
      "empty": "Waiting for a file",
      "reading": "Reading and parsing locally…",
      "invalid": "File validation failed; replace the file or encoding",
      "parsed": "Parsed; review the preview",
      "importing": "Importing; keep this window open",
      "complete": "Import complete",
      "interrupted": "Import interrupted; last confirmed results retained",
      "terminal": "Import stopped"
    },
    "errors": {
      "size": "The file exceeds 1 MB. Split it and retry.",
      "rows": "More than 500 data records. Split the file.",
      "separator": "Only comma separators are supported; the first line may only be sep=,",
      "quote": "Unclosed quote starting on line {line}. Correct the file.",
      "syntax": "Invalid quoting on line {line}. Use CSV quoting rules.",
      "empty": "The file contains no data records",
      "duplicateHeader": "Duplicate header: {column}",
      "unknownHeader": "Unsupported column: {column}. Use the template.",
      "missingHeader": "Missing required column: {column}",
      "columns": "Cell count does not match the headers",
      "duplicate": "Duplicate code in this file",
      "encoding": "Strict decoding failed. Switch encoding or save the file again.",
      "file": "Select one .csv file at a time",
      "read": "Could not read the file. Select it again.",
      "connection": "Submission could not be confirmed. Check local storage or the connection, then continue. Committed status will be checked first."
    }
  },
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
