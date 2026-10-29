# Tables, Infinite Loading, and Virtualization

## Contents

1. Table presentation
2. Page request contract
3. Prefetch and concurrency
4. Loading states and recovery
5. Virtualization
6. Search, selection, and row actions
7. Hierarchical lists

## 1. Table presentation

Compose a white 16px-radius card, nonshrinking toolbar, persistent table header, and a body filling the remaining height. Table content has zero outer card-body padding. The table begins directly below the toolbar boundary.

| Element | Specification |
| --- | --- |
| Standard header | 44px; white surface; 12px/500 `slate-500`; 12px vertical and 16px horizontal padding |
| Header boundary | 1px `#E2E8F0` below; no vertical column dividers |
| General data cell | 13px; 12px vertical and 16px horizontal padding; vertically centered |
| Outer cell padding | 24px on the first and last cell so content aligns with the card header |
| Row boundary | 1px `#EDF1F5` |
| General row hover | `slate-50/60` (approximately `#F8FAFC`) over 100-120ms |
| Fixed column divider | 1px `#EDF1F5` on the sticky edge, only while the table is horizontally scrollable |
| Fixed editing row | 56px actual height; typically 8px vertical padding and a 36px inner control |
| Identifier/timestamp | Monospace, 11-12px, quieter color, full-value access |
| Row actions | 28-32px icon buttons, 15-17px icons, 2px gaps, centered action column |

Place primary identity early, secondary codes in quieter monospace, status in compact badges, and dates on one line. Long text cannot displace actions. Avoid default zebra striping, heavy grids, or large colored rows. A user row typically shows a 32px avatar, a 13px/500 name, a monospace identifier with a copy control, role badges, email, a status switch, a monospace timestamp, and three row actions.

Rows are content-driven: a single-line cell produces about a 45px row, while the two-line user identity (32px avatar, 20px name, 16px identifier) produces a 65px row and the two-line role cell about 61px. Measure the actual row rather than forcing one global height. Only the fixed editing workbench specifies 56px explicitly.

### Fitting the standard table at 1280px

At 1280x720 with the sidebar expanded, the card contains about **1006px** and the stable scrollbar gutter leaves about **992px** of usable table width. Standard management tables must show their action column fully without horizontal scrolling at that width:

- Keep the action column a fixed width (144px on the users and roles pages; 84px on the compact button table).
- Keep the status and timestamp columns fixed (72-88px and 156px).
- Let the name and code columns flex with percentage widths and sensible `minWidth` values (for example 26% / 22% / 24% for users, 30% / 22% / 18% for roles).
- Never let a fixed action column collapse; reduce flexible columns first.
- Long codes ellipsize inside their cell and expose a `title`; they do not force the table wider.
- Only when the content's true minimum width exceeds the viewport should the table scroll horizontally. In that case fixed columns keep their opaque background and show the 1px divider.

### Three distinct selection roles

1. **General management checkbox selection:** selected rows stay transparent or very light slate; checkboxes are slate-900. No orange row wash. This is the baseline whenever a list adds row selection.
2. **Batch selection:** *no general table batch mode in Pilot Admin yet; the assistant's batch role dialog is the current bounded selection reference.* It uses a 48px fixed-row virtualized checkbox list inside a 640px modal, shows the selected count, and keeps retry/partial-success state. A future table batch mode may use a light slate row wash with neutral checkboxes. Batch toolbars must count only the selected IDs and never imply a backend-wide selection.
3. **Editing workbench current row:** *no reference implementation in Pilot Admin yet.* White row, 4px brand-500 indicator at the far left, inset 10px from top and bottom. Unselected hover reveals a 3px indicator at 40% opacity. This is the only role that uses orange.

Choose the role appropriate to the feature; do not layer all three treatments together.

### Data table internals

`DataTable` is the shared implementation behind `FixedTable`. It renders a grid-based table rather than a native `<table>`:

- One outer scroller with `role="table"`, an opaque sticky header (`z-index: 2`), and a virtual row group.
- A shared `gridTemplateColumns` value for header and body, computed from pixel, percentage, and flexible columns.
- A measured header height passed to the virtualizer as `scrollMargin`, so rows position correctly under the sticky header.
- `overflow-anchor: none` is not set globally; appended content must keep the visible position stable, and the virtualizer's measurements provide that stability.
- A 1px aria-hidden sentinel at the end while `hasNext` is true, and a screen-reader-only "loading more" status while a page is in flight.

The native `Table` primitive remains available for documentation-like tables and the component gallery: it uses a sticky `<thead>`, 44px header cells, 24px outer cell padding, and the same row separators.

## 2. Page request contract

Map this logical structure to page numbers or opaque cursors:

```text
query  = { keyword, filters, sort, scope }
page   = { records, pageNo, pageSize, total, hasNext }
state  = {
  queryVersion, recordsById, orderedIds,
  nextPage, hasNext,
  initialLoading, refreshing, loadingMore,
  initialError, appendError
}
```

Pilot Admin defaults to **20 records** per request for management lists. This is a request batch size, not a visible UI page. Use 20-30 for ordinary lightweight lists or 50 for dense fixed-height rows unless the target API dictates otherwise.

- Stable unique IDs drive deduplication, selection, draft storage, and view keys. Never use array positions as record identity.
- Update existing IDs in place while preserving their order; append newly seen IDs in server order.
- Trust the server's `hasNext`. Do not infer continuation solely from a full batch unless the API explicitly requires that convention.
- A count may say Total N only when the server supplies a real total. The users and roles pages request a real count separately and display it in the page header or toolbar; if only the loaded count is known, say Loaded N.
- Do not collect all pages before displaying a large list. Small finite enum sets, role options, and permission trees may load together; they are different data shapes.
- Reset pagination on a new query. Refreshing starts a new first-page result; do not reuse an old query's cursor or page pointer.
- A scope change hides old-scope rows immediately and shows the skeleton; it must never flash the previous scope's rows under the new heading.

The users page treats the keyword as the scope key and debounces typing by 350ms before starting a new query. The roles page uses a fixed query. Both feed `useInfinitePage`, which owns the request lock, page pointer, and generation.

## 3. Prefetch and concurrency

### Exact threshold

```text
scrollable = max(0, scrollHeight - clientHeight)
remaining = max(0, scrollable - scrollTop)
threshold = max(1200px, scrollable * 0.5)
shouldPrefetch = remaining <= threshold
```

The ratio applies to **scrollable distance**, not viewport height or loaded record count. Long lists prefetch around the midpoint; short lists keep at least 1200px of advance space. If the first batch does not fill the viewport, or append leaves the viewport in range, continue filling serially.

### Actual scroll container

- Listen to the real table body/scroll region using a passive scroll listener.
- Combine measurements in `requestAnimationFrame`.
- Recheck after appending, container resize, and sidebar collapse.
- A 1px aria-hidden sentinel and `IntersectionObserver` can supplement this. Its root is the true scroller and its bottom root margin is 1200px.
- If the sentinel is outside a library's internal virtual body, do not create an observer rooted at that body. Use body scroll metrics instead. The shared loader checks `scrollContainer.contains(sentinel)` and falls back to the scroll listener when it is false.
- Scroll and observer triggers must share one request lock.

### Locking and termination

Only one append request can be in flight per query. Ignore automatic triggers while loading, exhausted, obsolete, or awaiting append-error recovery. Advance the page pointer only after a successful merge. On failure keep the same page for retry.

Do not release the trigger lock only when the record count changes. A page can contain only duplicate IDs. Track request completion, query version, and cursor progress so errors do not permanently stall loading and duplicate pages do not create a request loop.

Stop automatic prefetch on an empty batch claiming `hasNext`, a repeated page or cursor, or repeated batches without new IDs and without provable progress. Present recoverable feedback. Do not endlessly retry malformed results. `useInfinitePage` throws a recoverable error for an empty first page that claims `hasNext` and for an append page that contains no new IDs, then exposes an explicit retry.

### Language-neutral pseudocode

```text
loadNext(reason):
  if busy or not hasNext: return
  if appendError and reason != explicitRetry: return
  version = currentVersion
  pageNo = nextPage
  busy = true
  loadingMore = true
  try:
    page = await fetch(query, pageNo, pageSize)
    if version != currentVersion: return
    validateProgress(page, pageNo)
    mergeByStableId(page.records)
    nextPage = pageNo + 1
    hasNext = page.hasNext
    appendError = null
  catch error:
    if version == currentVersion: appendError = error
  finally:
    if version == currentVersion:
      busy = false
      loadingMore = false
  after layout commit:
    if no error and withinPrefetchRange: loadNext(automatic)
```

Increment the version when scope changes and abort obsolete requests where supported. Obsolete success, catch, and finally handlers must not change the new query's state. An intentional cancellation is not a user-facing request failure.

## 4. Loading states and recovery

| State | Presentation | Request behavior |
| --- | --- | --- |
| Initial load | Keep toolbar; show matching header and about 7 skeleton rows; no preceding empty flash | Fetch first batch |
| Ready | Replace skeleton in the same region; optional single short fade | Check whether filling is needed |
| Appending | Existing rows remain usable; no large mask; optional quiet spinner row | Quiet serial append |
| Same-query refresh | Preserve old rows and card geometry; a thin brand bar runs under the header | Replace on success; preserve data on failure |
| New business scope | Hide old-scope rows immediately; clear unrelated selection/details | New version, first batch, scroll to top |
| Empty result | Centered explanation in the body | Stop continuation |
| Initial error | Page-level alert or in-body error with Retry; toolbar remains | Explicit retry |
| Append error | Keep rows; compact local error and Retry | Pause automatic loading; retry same batch |
| Exhausted | Content ends naturally; no page-number footer | Stop requests |

Error separation and loop prevention are portability completions, not claims that every page already implements them. The users page demonstrates the intended shape: a load error renders an `Alert` above the card with a retry action, and the empty state changes its title and description to the failure rather than claiming there are no records.

Do not add a large Loading more row or a permanent button on the normal path. A panel-local list may show a quiet row with a small spinner and text while a page is in flight; it must not shift existing content or reserve a large placeholder. If slow networking reaches the loaded boundary, preserve the view and keep this status lightweight plus `aria-live`. Do not insert invented records. A retry action during failure is not a permanent pagination control.

The assistant session history is a reference implementation: a 1px aria-hidden sentinel sits at the end of the grouped list, the shared `useInfiniteScrollLoader` observes the history scroller itself, and one request at a time is enforced by the session store. At the end of the list the spinner row disappears and no further requests occur.

To preserve refresh position, anchor by the first visible ID and intra-row offset. If the refreshed first batch no longer includes that anchor, reset to a valid position. Never retain a huge `scrollTop` over a much shorter refreshed table and leave a blank viewport.

## 5. Virtualization

### Separate responsibilities

Paging fetches records incrementally; the loaded data model can grow. Windowing limits mounted row views. `display: none` on thousands of mounted rows is not virtualization.

### Measured virtualization

`DataTable` uses `@tanstack/react-virtual` when the list is infinite (`onLoadMore` present) or `virtual` is explicitly enabled. It measures each mounted row with `measureElement`, so variable-height rows (two-line user identity, wrapped badges) remain correct. The default estimate is 57px, but the real row height wins after measurement. Overscan is **10**.

Virtual rows are absolutely positioned inside a relative row group whose height is the virtualizer's total size. Top and bottom space is produced by the row positions, not by manual spacer rows. Keys come from the stable record ID. The sticky header is outside the virtual group and is accounted for through `scrollMargin`.

The lightweight `useFixedRowVirtualizer` hook powers compact fixed-height lists such as the assistant's batch-selection dialog (48px rows) and is available for future fixed-height tables. It uses the following algorithm and a default overscan of **8**; a dense editing table may use 10.

```text
viewportStart = max(0, scrollTop - headerHeight)
viewportEnd = max(viewportStart, scrollTop + clientHeight - headerHeight)
start = max(0, floor(viewportStart / rowHeight) - overscan)
end = min(itemCount, ceil(viewportEnd / rowHeight) + overscan)
topPadding = start * rowHeight
bottomPadding = (itemCount - end) * rowHeight
```

*Fixed 56px rows are a future editing-workbench pattern, not a current management-list behavior.* Subtract `headerHeight` only if the header is inside the same scrolling flow; use zero for an external fixed header. Top/bottom spacers preserve total `scrollHeight`.

- Actual row height must equal the calculation, including borders and padding.
- Spacer rows have no ordinary cell padding/borders, are not interactive, are `aria-hidden`, and span the current column count.
- Recalculate for record count, container size, and scroll changes; clean up listeners on unmount.
- Store editing drafts by ID outside disposable virtual row instances.
- Keep a focused editing row mounted, or restore focus correctly after remount. To focus an unmounted record, scroll it into the window before querying its control.
- Supply stable keys and appropriate total-row/index semantics. Do not turn a simple native table into a keyboard grid unless interactive navigation requires it.

### Variable heights

General management tables may have name/email on two lines. Measured virtualization handles them; it does not establish a universal 56px height. Long comments, expanded content, and growing textareas need measured dynamic virtualization or a separate detail scroller. Do not apply a 56px algorithm to actual 72px tree rows.

### Scale check

With a synthetic 10,000-record server dataset, mounted rows remain approximately visible rows plus two overscan margins and a few structural nodes. Initial network requests remain small; do not fetch all 10,000 at startup. Small finite trees need not be virtualized merely for uniformity.

## 6. Search, selection, and row actions

### Search

Management lists use an editable input plus Enter submission and a clear affordance. The users page additionally searches as the user types after a **350ms** debounce; pressing Enter searches immediately and re-running the same keyword refreshes. The input is 288px wide, 36px high, with a 15px icon and 10px toolbar gaps.

Use submitted search by default. If the target chooses live search, debounce deliberately and treat it as an interaction variant. Keyword, filters, sort, and business scope all belong to query identity; changing any of them resets pagination.

### Batch mode

*No general reference implementation in Pilot Admin yet; the assistant's role picker is a bounded selection example, not a table batch mode.* When a target adds batch selection:

- Enter batch mode explicitly, add a 48px selection column, and show the selected count and batch actions. Ordinary row actions may disappear.
- Select all means **currently loaded records**, not every backend result.
- Store selection as an ID set; unmounted rows retain selection.
- Appended records do not automatically become selected unless a whole-result selection mode was explicitly chosen.
- The header checkbox supports checked, unchecked, and indeterminate states.
- Clear cross-query selection or explicitly define its scope; never send unrelated IDs into a destructive action.
- Explain disabled batch actions, such as a selected record having dependent data.

The current table selection primitives already behave this way: the header checkbox computes checked, unchecked, and indeterminate from the selectable loaded rows, and disabled rows are excluded from "select all".

### Row actions

View, Edit, Reset, and Delete use 28-32px ghost or subtle icon controls with tooltips. Stop propagation for copy, inputs, and row actions when the row itself navigates. Hide unauthorized actions or disable contextually unavailable actions with a reason; the users page disables deleting or disabling the signed-in account and explains why in the tooltip.

Copy controls may appear on hover or focus-within and must be visible when keyboard-focused. Success switches to a check for approximately 1.8 seconds without changing column width.

## 7. Hierarchical lists

The menu page uses a tree inside a card, not a hierarchical table:

- Rows are 40px high with a 6px radius, 13px text, and 20px indentation per level.
- A 16px disclosure chevron rotates when open; leaf nodes keep an empty 16px slot so labels align.
- Icons are 16px slate-400. The selected row uses a `slate-100` surface and slate-900 medium text.
- Hidden nodes show a small 「隐藏」 label at the right.
- The tree owns its scroll; filtering expands matching ancestors and hides unrelated branches.
- Disclosure expands, the row selects, and action buttons in the right panel stop propagation.

For a future hierarchical table, indent child rows inside the first cell, keep one continuous 1px guide, and reserve indentation inside the cell rather than adding outer padding that breaks the guide at cell edges. Group rows stay visually flat: no full-row hover fill or shadow. Distinguish child count from business-record count. Do not copy a fixed 72px connector geometry into an ordinary 44px list; derive the row height from the content and keep the guide aligned to it.
