# Acceptance Criteria

Use the checks relevant to the requested change. A new shell and virtual list need behavior verification; a narrow color adjustment does not require rerunning every scenario below. These are acceptance criteria, not claims that every page currently passes all of them.

## 1. Visual fidelity

Compare the same viewport, zoom, sidebar state, page composition, dataset shape, and loading state. Font fallback and missing icon assets can materially change the result; identify them before judging spacing.

| Check | Expected result |
| --- | --- |
| Shell dimensions | Sidebar 224/88px, brand region 64px, no global header row; Agent shell top bar 56px |
| Main padding | 16px below 1024px, 24px above |
| Ordinary page width | Fills the available width; no max-width cap outside the assistant settings page and the Agent conversation |
| Standard controls | 36px tall, 8px corners |
| Main card | White, 16px corners, `#E6EAF0` boundary, restrained shadow |
| Typography | 13px body and table data, 12px table headers and metadata, 20px page titles, 15px card titles, nothing meaningful below 11px |
| Buttons | White outlined ordinary actions with slate hover/focus; slate-900 filled primary only for the single strongest action; red destructive |
| Table | 44px header, aligned columns, fine horizontal separators, 1px fixed-column divider only when scrollable |
| Table fit | Action column fully visible at 1280x720 with the expanded sidebar (~992px usable after the stable scrollbar gutter) |
| General rows | Content-driven height, about 45px single-line and 61-65px for two-line identity cells; no forced fixed row height |
| Selection | Neutral checkboxes and row treatments; no orange row wash |
| Icons | One Lucide family, consistent size and stroke; no missing-glyph layout shifts |
| Assistant entry | Sidebar footer above help and account; no floating launcher |
| Truncation | Truncated titles/codes expose the full value via `title` or a copy/detail path |

At minimum inspect rest, hover, keyboard focus, disabled, initial loading, populated, and empty states for changed primitives. Use screenshots when they resolve visual uncertainty; a screenshot alone cannot verify network paging or scroll isolation.

## 2. Scroll isolation

For a new shell, exercise a representative desktop viewport such as 1440x900 and a shorter one such as 1366x768. Add narrow/mobile cases only where supported or requested. Check zoom or an equivalent reduced content area when clipping is a risk.

1. Load enough records to overflow. Scroll the table and confirm card toolbar, page header, and sidebar remain stationary.
2. Scroll a settings pane or the assistant history. Confirm adjacent panels keep their previous `scrollTop`.
3. Reach the end of an internal scroller. Confirm the document does not move.
4. Toggle sidebar width. Confirm content offset, columns, and measured viewport update together.
5. Use a long unbroken identifier and a wide table. Confirm horizontal overflow remains local and actions are reachable.
6. At 1280x720 with the sidebar expanded, confirm standard management tables show their action column without horizontal scrolling and fixed-column dividers are absent.
7. Switch to empty/loading states. Confirm the outer card neither collapses nor exceeds the viewport.
8. Open a long dialog. Confirm heading/footer stay reachable while the body scrolls, and background interaction is appropriately contained.
9. Scroll the dashboard. Confirm the page header scrolls with the dashboard content inside main, while the sidebar stays fixed and the document does not scroll.

Useful measurement for an authenticated full-viewport shell:

```js
const page = document.scrollingElement;
const documentOverflow = {
  x: page.scrollWidth - page.clientWidth,
  y: page.scrollHeight - page.clientHeight,
};
// Normally within about 1px in each axis.
// Also inspect clipped content: no document overflow is necessary but insufficient.
```

Do not apply this expectation to a naturally scrolling login, error, or document page.

## 3. Infinite loading and query correctness

Use a controllable local/synthetic data source where possible. Do not create real records or run production writes merely to test this style.

| Scenario | Observable result |
| --- | --- |
| Initial batch | A 20-record request; structural skeleton; no full-dataset fetch |
| Prefetch threshold | Request begins before the end, using the actual scroller |
| Multiple triggers | Scroll and observer do not request the same page concurrently |
| Short first batch | Serial fill continues when needed without requiring a new wheel event |
| Append | Stable visible position; old rows remain; no large inserted loading placeholder |
| End reached | No further page requests after `hasNext=false` |
| Overlapping IDs | One record per ID, updated values, stable order |
| Slow old query | Late results and finally handlers cannot overwrite the new query |
| Empty result | True empty state, no repeated requests |
| Initial failure | Error and explicit retry, not a false empty state |
| Append failure | Existing content retained; automatic retries stop; the same page is retried explicitly |
| Malformed continuation | No uncontrolled loop on empty pages or repeated page pointers |
| Refresh failure | Existing valid results retained |

Inspect request logs or controlled counters, not just the visible number of rows. A growing scrollbar does not prove server paging.

## 4. Virtualization and editing

- Use a large synthetic result set. Mounted rows remain proportional to visible rows plus overscan, rather than loaded count.
- Inspect actual row bounding boxes; compare their heights to the virtualizer's measurement.
- Scroll far down and back. No blank gaps, overlapping rows, missing borders, or misaligned header widths.
- Confirm the total scroll height represents loaded records correctly.
- Focus an editable row, navigate by supported keyboard controls, and confirm focus is not lost to the document during recycling.
- Batch selection persists across row unmount/remount. Select all clearly applies to its defined scope.
- Confirm sparse or duplicate batches release request locks without creating endless prefetch.

## 5. Components and overlays

- Button dimensions remain stable through loading and disabled states.
- Disabled actions cannot activate by keyboard, pointer, or form submission.
- Copy controls copy full values, do not trigger row navigation, and expose failure feedback.
- Inputs keep labels, focus, error text, and available values readable.
- Required form controls expose `aria-required`; visible help or error text is linked through `aria-describedby` to the control, and errors keep `role="alert"`.
- Field-level validation stays inline; login failures do not rely on a toast.
- A modal with an async `onOk` enters its own pending state: OK spinner, duplicate clicks ignored, Cancel/Esc/mask/close inert until the promise settles, then retry or close. External `confirmLoading` does not permanently block dismissal.
- A title-less dialog has a specific accessible name rather than the generic 「对话框」.
- Popup menus are not clipped by `overflow: hidden` cards.
- Modal focus enters appropriately, remains contained, and returns to the trigger.
- Dismissal follows the operation's actual behavior; closing a view is not falsely reported as canceling a server task.
- Reduced-motion settings remove unnecessary pulse/entrance movement.
- No essential information is conveyed only by color, hover, or animation.
- The assistant has no floating launcher; the sidebar entry toggles the panel and the Agent page shares the same runtime.

## 6. Assistant and Agent

1. Ctrl/⌘J opens the 440px panel, anchored 24px from the right and bottom, height `min(760px, viewport - 48px)`. It fits at 1280x720 and 1440x900, and expanding to 720px does not cover the sidebar.
2. Thinking/progress, streamed deltas, Markdown tables and code, stop, and retry are all visible and operable. After stopping, no late delta appears.
3. A choice → confirmation flow writes through the service, requires at least one selection, and records the final state on both completion and cancellation without a page reload.
4. A multi-step plan runs, stops on request by letting the current step finish, reports the partial result, and does not auto-resume when history is restored.
5. Switching between the panel and `/agent` during a run preserves the same session, draft, and request. Agent history appends infinitely and older messages load with a stable anchor.
6. Opening an authorized page from the Agent page shows a return banner that goes back to the same session. Unauthorized pages are rejected; revoking `agent:use` removes the panel and returns 403 for `/agent`.
7. Ask/mode preference and account-menu preference behave correctly; a viewer has no assistant entry.
8. Profile and quick-prompt edits and model CRUD persist with a masked key; an empty enabled configuration shows an empty state and disables inputs.
9. Attachment chips show parsing and removal, acknowledgements carry metadata only, and no file body reaches messages, storage, or requests.
10. Session and message counts stay within limits; corrupt or older stored data falls back to the seed; reset restores the seeded assistant sessions and drafts.

## 7. Delivery record

Report the implemented composition, important changed behavior, relevant checks actually run, and material limitations. Distinguish structural validation, asset rendering, interaction checks, and a real side-by-side comparison with a previous design.

For changes to this skill, validate frontmatter and metadata, resolve every relative reference, confirm assets are self-contained, and keep the package English-only. Run or render changed executable assets when practical. Do not claim the application build passed when only documentation and an isolated reference page were checked.

## 8. Bundled example verification

The included reference assets were checked in an isolated headless Chrome session on 2026-10-29. This record applies to the bundled example, not every application page or a future implementation.

- Desktop at 1440x900: the panel is 1168x852 at (248, 24); navigation is 224px and collapses to 88px with the main column following at 88px; the panel heading is 86px, the table header 44px, and reference rows 56px. Document overflow is 0 in both axes.
- Infinite list: 50 records on the first request and 23 mounted rows; repeated scrolling reached all 360 records in 8 requests with 34 mounted rows at the end, `hasNext=false`, and `aria-rowcount=361`. No console errors or page exceptions were observed.
- Panels and dialogs: history scrolling does not move the main list; genuine horizontal overflow stays inside the table; the detail dialog opens at 640x868, its body scrolls (1082px content in 728px), and its footer stays visible.
- Empty results: the card keeps its 852px height, shows "No resources found", hides the retry control, and produces no document overflow.
- Narrow viewport at 390x844: the table viewport is 356px against 920px of content width, local horizontal overflow works, the navigation is off-canvas, and document overflow remains 0.
- Controlled failures: an initial failure shows "Resources could not be loaded" with a visible retry (a second request is issued on retry); an append failure preserves 50 rows and shows the local feedback with retry; retrying loads the next page (100 rows, request 3).
- Empty search results and controlled failures leave the page without runtime exceptions. Desktop, empty, dialog, and narrow-view screenshots were visually inspected.
- Package checks cover skill format, JavaScript syntax, English prose with Chinese only in quoted UI strings, resolved relative links/assets, and unique HTML IDs.

The application itself was spot-checked in the running dev server at 1440x900 and 1280x720: users card 1168x780 and 1008x600, toolbar 61px, table header 44px, 65px two-line user rows, no horizontal table scroll, and 144px action columns fully visible; assistant panel 440x760 at 1440 and 440x672 at 1280 with 24px insets; global search 720x620; settings rail 288px with a 20px gap; Agent header 56px and rail 260px; no document overflow. An exhaustive browser compatibility matrix and a complete accessibility audit were not performed. The sample has no editing or batch-selection workflow; those behaviors remain specified for implementations that include them.
