import type source from '../zh-CN/exampleTable';
import type { LocalizedDictionary } from '../../types';

export default {
  "description": "Inline editing, bulk actions, column visibility and export · stateless demo",
  "demoHint": "This is a stateless demo that every role can edit. Saving only runs server validation; refreshing restores the initial data.",
  "tableLabel": "Inventory",
  "total": "{count} rows",
  "changes": "{count} unsaved changes",
  "noChanges": "No changes",
  "listed": "Listed",
  "unlisted": "Unlisted",
  "savedAt": "Saved at {time}",
  "columns": {
    "sku": "SKU",
    "name": "Name",
    "category": "Category",
    "price": "Price (CNY)",
    "stock": "Stock",
    "active": "Listed"
  },
  "category": {
    "hardware": "Hardware",
    "software": "Software",
    "service": "Service"
  },
  "actions": {
    "add": "Add row",
    "save": "Save changes",
    "discard": "Discard changes",
    "export": "Export CSV",
    "columnSettings": "Columns",
    "removeRow": "Delete row",
    "batchEnable": "List selected",
    "batchDisable": "Unlist selected",
    "batchRemove": "Delete selected",
    "clearSelection": "Clear selection",
    "selectAll": "Select all rows",
    "selectRow": "Select {name}"
  },
  "selection": "{count} selected",
  "newRow": "New",
  "modified": "Modified",
  "rowLabel": "Row {index}",
  "discardDialog": {
    "title": "Discard all changes?",
    "description": "Unsaved additions, edits and deletions will be lost and the table returns to its last saved state.",
    "ok": "Discard changes"
  },
  "validation": {
    "nameRequired": "Enter a name",
    "nameTooLong": "Use 40 characters or fewer",
    "duplicateName": "Name duplicates another row",
    "reservedName": "The name system is reserved",
    "priceRequired": "Enter a price",
    "priceRange": "Price must be between 0 and 99999",
    "stockRequired": "Enter stock",
    "stockRange": "Stock must be a whole number from 0 to 99999",
    "category": "Choose a category",
    "summary": "{count} cells failed validation. Fix them before saving."
  },
  "errors": {
    "load": "Couldn't load inventory",
    "save": "Couldn't save. Try again."
  },
  "success": "Saved {count} changes",
  "empty": "The table is empty. Add a row to start.",
  "seed": {
    "p01": "Wireless keyboard",
    "p02": "Ergonomic mouse",
    "p03": "27-inch monitor",
    "p04": "Docking station",
    "p05": "Noise-cancelling headphones",
    "p06": "Office suite annual plan",
    "p07": "Design software license",
    "p08": "Antivirus",
    "p09": "Cloud storage add-on",
    "p10": "On-site installation",
    "p11": "Extended warranty",
    "p12": "Data migration service"
  }
} satisfies LocalizedDictionary<typeof source>;
