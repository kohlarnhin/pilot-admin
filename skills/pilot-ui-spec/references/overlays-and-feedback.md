# Overlays and Feedback

## Contents

1. Standard dialogs
2. Detail drawers
3. Imports, files, and long operations
4. Assistant panel and Agent page
5. Empty, loading, success, and error states

## 1. Standard dialogs

Use a white surface, 16px radius, 1px `#E2E8F0` border, and the overlay shadow in visual-system.md. Headers have a compact icon/title arrangement with a light bottom separation. Titles use approximately 15px/600; form text stays compact (13px). The body owns its scroll; header and footer are nonshrinking.

The shared `Modal` is constrained by `max-height: calc(100vh - 48px)` and `width: calc(100vw - 32px)`, so it never touches the viewport edge. The body is a `min-height: 0` flex child with `overflow-y: auto`. Keep Save/Cancel reachable when content is long or the viewport is short.

### Width examples from the application

| Dialog role | Width |
| --- | --- |
| Reset password | 420px |
| Created-user credentials | 440px |
| Model configuration | 460px |
| Role create/edit | 480px |
| User create/edit | 520px (component default) |
| Batch role assignment (assistant) | 640px |
| Global search | 720px |
| Role permission matrix | 920px |

These are role-specific anchors, not a global dialog width. Simple forms generally fit a compact 420-520px surface; structured details use about 640px; side-by-side permission matrices need a wider surface.

Normal footer: actions right aligned, 10px gap, 36px outlined buttons. A light `line-soft` separator and approximately 14px vertical padding distinguish the footer. Saving shows local progress and preserves entered values on failure. The dialog's default OK button is **outlined**, not filled; `okType="danger"` switches it to the filled destructive style.

### Async submit contract

An `onOk` handler may return a promise. While that promise is pending:

- The OK button shows its spinner and is disabled; repeated clicks are ignored.
- Cancel, Escape, the close button, and mask clicks are inert, so the dialog cannot be dismissed mid-write.
- On success the page usually closes the dialog itself; on failure the dialog stays open with the user's input, and pending is released so the user can retry.
- Pending is owned by the dialog instance. External `confirmLoading` may still show progress, but it must not permanently block dismissal of a dialog whose own operation has finished. Reset pending when the dialog closes and ignore stale promise results.

This contract applies to create/edit dialogs and confirmation dialogs alike. Closing a progress view is not proof that the server job was cancelled.

### Focus, naming, and dismissal

- Name the dialog through its visible title. A title-less dialog (for example the global search palette) must pass an explicit `ariaLabel`; do not fall back to the generic 「对话框」 when the role is known.
- Move focus to the first editable field in the body, or to the content region when there is none. Contain focus while modal, and return it to the trigger when closed.
- Escape and close-button behavior should agree with the target operation. Do not universally disable dismissal outside the async contract above.
- A workflow may disable Escape, the mask, and the close button while its own save is in flight; the menu rename dialog does this explicitly. The assistant's batch role dialog disables Escape and mask dismissal for its whole lifetime. Treat both as workflow-specific exceptions, not the standard for every dialog.
- Overlay backgrounds cannot remain interactive while the dialog is modal.
- Unsaved work and running operations need explicit product behavior. Do not assume closing the view cancels the server operation.

### Detail formatting

Use a two-column metadata grid with a 12px gap, a quiet `slate-50/70` internal card, a copyable identifier field, and long text in its own bordered surface. Preserve line breaks in detail text while keeping code-like identifiers breakable at extreme length.

The created-user confirmation is a good compact pattern: a bordered list of label/value rows (account, initial password), monospace values, a copy control per row, and one closing note that the password will not be shown again. Show this result once; never include the password in the list query.

The role permission dialog is the wide structured pattern:

- A summary strip with selected menu and button counts plus "select all" and "clear" actions.
- A warning alert explaining the menu/button linkage rule.
- One bordered card per module: module header with icon, checkbox, route, child count, and a module-level action; then a 12-column row per page with the page checkbox, a 2/4-column button grid, and a per-page action.
- Disabled resources stay visible but non-grantable, so the operator understands why a box cannot be selected.
- The body scrolls; the footer save action stays visible.

### Confirmation dialogs

`Modal.confirm` is a compact 420px surface with a 36px round icon, a 15px/600 title, 13px body text, and right-aligned actions. Destructive confirmations use the filled destructive OK button. The confirmation body may contain structured content, but the dialog itself does not grow a second scroll region; long content belongs in a full dialog.

## 2. Detail drawers

`Drawer` is available in two variants and is demonstrated in `/examples/components`. Use it when a temporary detail should preserve the list position.

### Floating drawer

- Top, right, and bottom offsets: 16px.
- Width: 560px by default, capped at `calc(100vw - 32px)`.
- Outer corners: 16px; overflow hidden; overlay shadow.
- Header: 56px high, 20px horizontal padding; white; 1px `line-soft` boundary.
- Body: finite flexible column with its own scroll.
- Footer: optional, right aligned, 10px gap, 14px vertical padding.

### Flush drawer

The flush variant is pinned to the right edge with a 1px left boundary, no outer radius, and the same header/body/footer structure. Keep its containing block finite; do not treat it as a second independent full-screen shell.

### Detail interior

*The following composition has no reference implementation in Pilot Admin yet; follow it when adding an approval or inspection detail.*

Use a 370px left information column and a flexible right discussion column. The left column has a faint gray surface, a right boundary, 16px padding, and 12px gaps. Left composition: natural-height metadata card, flexible long-text card, natural-height lifecycle/status card. Internal cards are white, 12px radius, light border, about 14px padding. Long text scrolls inside the middle card. The right column has a nonshrinking action/sort header and independently scrolling comments with 24px horizontal padding.

Comment hierarchy uses indentation and continuous fine guide lines rather than a new elevated card for every reply. Keep author, time, state, content, and local actions distinct. An action inside a comment must not unexpectedly select or navigate the whole record. When fixed metadata is too tall for a short viewport, allow the left column itself to scroll; on narrow layouts, use tabs or a single-column detail flow.

## 3. Imports, files, and long operations

### File selection

`FileDropZone` is the shared affordance. It uses a `slate-50/60` fill, a **dashed** `slate-300/80` border, 12px corners, 32px padding, and a centered 48px icon tile with a 26px icon. Drag or hover strengthens the neutral border to slate-400 and deepens the fill to slate-50; never introduce an orange wash. The zone is a real button (`role="button"`, `tabIndex=0`, Enter/Space) and hides the native input. Disabled or loading states reduce opacity and block interaction.

File metadata uses small monospace text and truncation. The assistant attachment chip shows the file name, size, optional line count, parse status, an inline error state, and a remove control.

### Import dialog

*No reference implementation in Pilot Admin yet; follow these rules when you add one.* Reference composition: explanatory notice, optional validation error, and a two-column file/preview plus parsed-result layout. The body is bounded at approximately 60vh and scrolls as needed. Each preview region is around 360px high and owns its internal content scrolling.

### Distinct states

| State | Required feedback |
| --- | --- |
| No file | Drop/select affordance and accepted formats |
| Reading/parsing | File identity and local progress; preserve preview dimensions |
| Validation failure | Readable error next to the file/preview, with correction path |
| Parsed | Real preview and accurate counts |
| Importing | Processed/total, progress, success/skipped/failed counts |
| Complete | Outcome summary and appropriate close/continue action |
| Partial failure | Successful results retained, failed-item details reachable |
| Connection failure | Last known state plus explicit recovery or status lookup |

Progress updates cannot repeatedly resize the modal or list card. A running server job and its open progress view are different lifetimes. Define close, cancel, retry, and reconnect according to the actual API. Do not manufacture cancellation support or restart a write operation merely to refresh its display.

### Streaming and long logs

Append bounded logs inside their own region. Do not force-scroll a user reading older messages; auto-follow only while they remain near the bottom, with an explicit return-to-latest action when appropriate.

Assistant plans have two distinct stop semantics that must not be merged:

- **Stop plan** lets the current step finish, marks the remaining steps stopped, and reports the partial result. Resuming starts a new execution and skips completed steps.
- **Stop generation** aborts the current stream with `AbortSignal`, so no late delta lands in the conversation.

### File privacy

Files provide metadata only: name, size, MIME type, and an optional line count. Text line counts are computed locally in the browser; the body is never placed into messages, persistent storage, or requests. The default maximum is 5 MB. This rule survives any future import UI.

## 4. Assistant panel and Agent page

The assistant is part of Pilot Admin, not an optional illustration. Both hosts share one runtime above the routes.

- There is no floating launcher. The entry point is the sidebar footer row above the help and account rows; the row toggles the panel and exposes Ctrl/⌘J with `aria-keyshortcuts`. The Agent page is the full-screen host of the same runtime, not a second chat product.
- Desktop panel: **440px** wide, **720px** when expanded, anchored **24px** from the right and bottom, height `min(760px, viewport - 48px)`, 16px radius, white, light slate border, overlay shadow, `z-index: 80`.
- Small-screen panel: full width, anchored to the bottom, top corners only, height `min(760px, 100dvh)`.
- The panel is `aria-modal="false"`. It does not block the page, but it is labelled by its title and described by a short subtitle.
- Header and composer remain stationary. Message history and session history own their vertical scrolling. Messages cap at 640px in the panel and 760px on the Agent page.
- Body typography is mainly 12-13px; user/assistant shapes stay compact. Rich text uses restrained paragraph/list spacing; code blocks and tables scroll horizontally inside themselves.
- The header is 64px high with a 28px mark, a 13px/600 title, an 11px subtitle, and 28px icon actions. The composer wrapper sits in a 16px padded footer; its textarea keeps a 48px minimum height and scrolls internally rather than growing without bound.
- Entrance: 180ms, subtle upward movement and scale; thinking dots are 4px orange dots with staggered animation. Respect reduced motion.
- Session history is an independent slide-over with day groups (`今天` / `昨天` / `近 7 天` / `更早`), 13px titles, 11px metadata, and infinite scrolling. It uses the shared sentinel loader (no 「加载更多」 button) and shows a quiet spinner row while appending. It animates in over 240ms and out over 180ms; closing it must return focus to the history trigger.

Keep history changes from moving the entire panel. When the user reads older messages, new streamed text should not steal scroll position. Escape closes history first, then the panel. Always preserve keyboard access, dialog/layer ordering, and an accessible close action.

### Agent page

The full-screen Agent page uses the same runtime and conversation state:

- 56px top bar: 28px logo, 14px/600 title, help link, back-to-console link, account menu.
- 260px history rail with a 64px "new conversation" row, the same session list, and a short footnote explaining that sessions are shared with the panel.
- A 48px conversation toolbar holding the history toggle and the notification toggle.
- Conversation column centered at 792px with 760px message content.
- A page opened from an Agent conversation carries a safe return state; the admin shell shows a slim return banner above the main region. Only same-site `/agent` targets with a valid session parameter are accepted.

### Runtime guarantees

- Drafts, sessions, and generation state are per user.
- Switching between the panel and `/agent` does not resend, cancel, or restart a stream.
- Restoring history does not re-execute confirmation cards or plans.
- Losing `agent:use` immediately releases the request, hides the panel, and blocks the Agent route.
- Missing configuration shows one clear empty state, with a settings link only for accounts holding the configuration permission.
- Notifications fire only for live completions, not for restored history.

## 5. Empty, loading, success, and error states

### Empty

Fill the available body and center both axes. Use a 48px white tile with a fine border, 12px corners, and a 24px slate-400 icon, followed by a 14px/500 slate-600 title and an optional 12px slate-500 description. Gap is around 12px; body padding is 24px horizontal and 32px vertical. Keep only one message: if the title already states the fact, omit a redundant description.

Distinguish no records, no matching results, no selected item, and no permission. Never show an ordinary empty state for a failed request. Do not add large illustrations or blurred decorative shadows to a table empty state.

### Skeleton

Match the final layout: toolbar shapes, a 44px header, approximately seven data rows, quiet gray rounded text bars, and optional circular avatar placeholders. The table skeleton waits about 200ms before appearing, so fast responses go straight to content.

- `TableSkeleton` rows are 56px; the route-level `PageSkeleton` rows are 52px. Real table rows are content-driven: about 45px for a single-line row and 61-65px for a two-line identity cell. Treat the skeleton as a structural placeholder, not a pixel match of a 56px editing row.
- Skeleton fill is the custom gray-200 at approximately 70% (`bg-gray-200/70`).
- Pulse subtly and respect reduced motion. Reserve actual heights and widths so replacement does not shift the card.
- Avoid switching through a false empty state before data arrives.

### Success

Use a short confirmation near the action or a compact toast. The toast host is **top-center**, shows at most 4 at once, stays for 3 seconds, and uses a white 12px-radius card with a fine border, popover shadow, a 13px/500 title, and a 12px description. Use one consistent toast system; preserve local state feedback such as the copied check or a cleared dirty marker. Keep toast copy short and unpunctuated; do not end success messages with an exclamation mark.

### Error

Field errors remain with the field. Initial list failures have an in-body retry or a page-level alert with retry. Append failures preserve records and pause automatic loading. Save failures retain user input. Long-operation failures retain last known progress and provide a supported recovery path.

Field-level validation must not be reported only through a toast. Empty required fields, malformed identifiers, and wrong credentials render an inline message below the control, mark the control `aria-invalid`, and associate the message with `aria-describedby`. Login demonstrates this for account and password: the form width stays stable, the inline message clears as soon as the user edits the field, and focus moves to the password after a failed sign-in or to the account when it is empty.

Do not expose raw stack traces in product copy. Preserve diagnostic information in the target's logging mechanism where authorized. Avoid reporting success until the relevant operation actually succeeded.

### Accessibility completions

Use visible focus, semantic labels, error descriptions, `aria-busy` for loading regions, and polite live updates for meaningful changes. Announce a batch append succinctly rather than reading every newly mounted virtual row. Keep status text available when color or animation is not perceived. Dialog titles, icon-only actions, and the assistant panel must all have accessible names.


## Notification entry and quick popover

Reference: `src/components/notifications/NotificationEntry.tsx`. Place a 40px bell row in the sidebar footer with the same geometry as the assistant entry. Expanded mode shows a neutral unread count capped visually at 99+; collapsed mode shows the icon with a brand new-content dot. The accessible description exposes the full count. The account menu also links to the full inbox.

Use the shared Radix popover with a named dialog, a fixed title/mark-all-read header, an independently scrolling list of the six latest summaries and a fixed view-all footer. The surface is 380px wide, bounded by viewport width and height. Each summary has a semantic level icon, title, two-line excerpt, relative time with an exact timestamp title, and a labeled unread dot. Show skeletons, true empty state, and explicit load retry; failed writes retain the popover and item. Block duplicate actions. Escape and outside dismissal return focus to the bell. Mark an item read before navigating, and allow related links only through `canNavigateToPage`; otherwise open the full inbox with its ID.
