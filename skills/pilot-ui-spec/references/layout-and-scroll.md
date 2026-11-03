# Layout and Scroll Ownership

## Contents

1. Shell geometry
2. Height and width constraints
3. Scroll ownership
4. Headers and horizontal overflow
5. Multiple panels
6. Narrow viewports and zoom
7. Layering and diagnosis

## 1. Shell geometry

```text
+---- navigation: 224 / 88 ----+--------------------------------------+
| brand area: 64px            | main (no global header row)          |
+----------------------------+  padding: 16 / 24px                  |
| search trigger              | +----------------------------------+ |
|                            | | page header (outside the card)    | |
| navigation list            | +----------------------------------+ |
| independently scrollable   | | card toolbar: 60px                | |
|                            | +----------------------------------+ |
|                            | | persistent table header: 44px     | |
|                            | +----------------------------------+ |
|                            | |                                  | |
|                            | | independently scrolling records  | |
|                            | |                                  | |
| assistant / help / account | +----------------------------------+ |
+----------------------------+--------------------------------------+
```

| Region | Baseline |
| --- | --- |
| Sidebar | 224px expanded, 88px collapsed; fixed; white; 1px solid right boundary |
| Brand area | 64px; nonshrinking; 20px horizontal padding; 32px logo |
| Admin main | No global header row; content begins at the top of the viewport region |
| Agent top bar | 56px; full-screen Agent shell only |
| Main available height | Viewport height |
| Main padding | 16px; 24px at viewport widths of 1024px and above |
| Ordinary page width | The admin fills available width; no max-width cap |
| Dashboard | May fill available width and scroll inside main |
| Standard list card | Fills remaining page height regardless of record count |
| Page header | Sits above the card; about 52px of content plus 20px bottom margin |

The main column's horizontal offset changes with sidebar width. This project uses one mechanism: a fixed sidebar plus `padding-left` on the main wrapper, both animated over 300ms. Do not also add a grid column or a left margin, which would double-count the sidebar in the layout.

Fixed is a layout role, not a requirement to position every element with `fixed`. The sidebar is fixed to the viewport; card headers and toolbars are nonshrinking flex children. Equivalent constrained Grid layouts are valid as long as only one offset mechanism is active.

The full-screen Agent page is a separate shell: `height: 100dvh`, a 56px header, a 260px history rail, and a flexible conversation column. Do not carry the admin sidebar or the admin page padding into it.

## 2. Height and width constraints

### Portable layout skeleton

```css
.app-shell {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #fff;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--layout-nav-width);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
}
.main-column {
  padding-left: var(--layout-nav-width);
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: padding-left 300ms ease-in-out;
}
.main {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
}
@media (min-width: 1024px) {
  .main { padding: 24px; }
}
.page {
  width: 100%; height: 100%;
  min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
}
.card {
  flex: 1 1 0;
  min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  border: 1px solid #e6eaf0;
  border-radius: 16px;
  background: #fff;
}
.card-header, .card-footer { flex: 0 0 auto; }
.card-body {
  flex: 1 1 0;
  min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.scroll-region {
  flex: 1 1 0;
  min-width: 0; min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
```

This is a **portability completion**, not a literal transcription of every class. The `100vh` declaration precedes `100dvh` as a fallback. When embedded inside an existing finite-height host, use that host's height instead of taking over the browser viewport again. A grid alternative (`grid-template-columns: var(--nav) minmax(0,1fr)`) is equivalent only if the fixed width is not applied twice.

### Box-model requirements

- Use border-box so padding and borders belong to the assigned dimensions.
- A percentage height needs a finite parent height. Merely setting `min-height: 100vh` and allowing descendants to grow does not produce a fixed shell.
- Flex children need `min-height: 0` at every important shrinkable intermediate layer.
- Grid tracks use `minmax(0, 1fr)` where content must shrink.
- Long identifiers, inputs, and tables need `min-width: 0` in their horizontal ancestor chain.
- Only the intended scroller receives `overflow: auto`. Card boundaries use `overflow: hidden` to contain rounded edges and content dimensions.
- Do not scatter arbitrary `calc(100vh - 213px)` values across pages. Let toolbars take their measured height and give the remaining space to content.
- If a virtualization library needs numeric scroll dimensions, measure the actual card body or scroll element. Recalculate after resize, sidebar changes, font loading, or toolbar wrapping.

### Height budget example

For a 1440x900 viewport, expanded sidebar, and 24px main padding:

- Page width: 1440 - 224 - 48 = **1168px**.
- Page height: 900 - 48 = **852px** (the admin shell has no header row).
- The page header occupies about 52px plus a 20px margin: 72px.
- The list card is therefore about 780px. With a 61px toolbar, a 44px table header, and two 1px borders, the table body is about **673px**, or roughly 10 two-line identity rows at 65px each.
- If the toolbar wraps, its height increases and the body becomes shorter; the card stays 780px tall.

At 1280x720 the page receives 1280 - 224 - 48 = **1008px** of width, about **1006px** of card content and **992px of usable table width** after the stable 14px scrollbar gutter. Standard management tables must fit their action column at that width. The table body is about 493px. The 1440 and 1280 measurements come from the running users page.

The example explains the budget. It does not require hardcoding every toolbar to 60px.

## 3. Scroll ownership

| Region | Scrolling element | Persistent neighbors |
| --- | --- | --- |
| Main navigation | Navigation item list | Brand area, search trigger, assistant/help/account footer |
| Management table | Table body or wrapper containing the sticky header | Card toolbar and page header |
| Menu split view | Left tree list and the right button table | Both card headers; the detail metadata block |
| Settings | Category rail list and the right content card | Page header, card header, save footer |
| Dashboard | The page container inside main | Sidebar; no fixed top bar |
| Assistant panel | Message list; session history is a separate scroller | Panel header and composer |
| Agent page | Session history rail; message list | 56px top bar and the 48px conversation toolbar |
| Modal / drawer | The body region | Title and footer actions |
| Login | The document, naturally | None |

Sibling panels have independent `scrollTop` values. Reaching the end of one should not drag the document or the adjacent panel. Use native scrolling and `overscroll-behavior: contain`, not blanket wheel interception.

For the normal authenticated shell, `document.scrollingElement.scrollHeight` should be close to `clientHeight`, allowing about 1px of rounding. Hiding the document scrollbar does not prove correctness: all clipped business content must remain reachable through the appropriate internal scroller. The dashboard is the deliberate exception: it scrolls as one region inside main, so the document still stays fixed while the dashboard content moves.

### Empty states and first load

Center empty states in the available body. Preserve toolbar placement and card height. Do not assign an empty placeholder a minimum height larger than its parent. Skeletons must stay inside the same finite body boundary. Avoid meaningless scrollbars when no content overflows.

The table exposes a skeleton only after a short delay, so a fast response does not flash a placeholder. When data arrives, the skeleton is replaced in the same region; the card must not change height.

### Scrollbar appearance

The global WebKit scrollbar occupies 14px in each axis. The track is transparent. The thumb is `#C4CDD5` with a 4px transparent border, padding-box background clipping, and a pill radius. Its visible colored width is approximately 6px. Hover changes the thumb to `#919EAB`.

The optional `.scrollbar-hover` treatment keeps the thumb transparent until the pointer enters the scroll zone, then reveals `#C4CDD5`. Use it on the sidebar and other quiet rails, not on a main data table where scroll position should always be visible. The assistant uses its own 6px scrollbar (`#CBD5E1`, hover `#94A3B8`).

A thin `scrollbar-width` and equivalent `scrollbar-color` are an approximate non-WebKit fallback. Do not hide all scrollbars. Use `scrollbar-gutter: stable` only where needed to prevent layout shifts, and include its space in column calculations.

## 4. Headers and horizontal overflow

### Native table

One constrained container owns both table axes. In the native `Table` primitive, the header row uses `position: sticky; top: 0; z-index: 10` with an opaque white background and an inset 1px bottom line. Do not add a second unconstrained overflow wrapper between sticky headers and the real scroller.

`TableHead` is 44px high with 12px/500 slate-500 text, 16px horizontal padding, and 24px on the first cell. Cells use 16px horizontal and 12px vertical padding, again with 24px on the outer edges.

### Virtual table

The real scrollable element in `DataTable` is the outer `role="table"` div. Measurement, prefetch listeners, and observer roots must refer to that element, not a convenient outer card. The sticky header is a sibling of the virtual row group inside the same scroller, and the virtualizer receives the measured header height as `scrollMargin`.

Column definitions are shared between header and body through a single `gridTemplateColumns` value. Percentage columns resolve against available width; fixed pixel columns (status, timestamp, actions) keep their width; flexible columns absorb the remainder. Subtract the header height when positioning virtual rows, and subtract every header level when deriving numeric body height.

### Genuine overflow

- No false horizontal bar when columns fit.
- If the content minimum width exceeds the viewport, preserve table-local horizontal scrolling.
- At 1280x720 the card content is about 1006px, of which the stable 14px scrollbar gutter leaves **992px usable**. Confirm the action column is fully visible at that width.
- This project sets no universal table minimum width. Column widths define the minimum: for example the users table uses 26% / 22% / 24% flexible columns plus 72px, 156px, and 144px fixed columns; the roles table uses 30% / 22% / 18% plus 88px, 156px, and 144px.
- A dense table may need a larger minimum width for its own column composition; derive it from the columns rather than copying a number.
- Fixed columns (`fixed: "left" | "right"`) are sticky with an opaque background. Their 1px `#EDF1F5` divider is rendered only while the table is horizontally scrollable.
- Do not globally hide scrollbar elements to mask rounding. Fix rounding and column allocation while keeping genuine overflow accessible.

## 5. Multiple panels

### Settings

The category card is **256px** wide, increasing to **288px** at 1280px. The panel gap is **20px**. The category list and the right content each have finite height. The right card owns its content scroll and keeps a nonshrinking save footer. Switching categories changes the right content without moving the application boundaries. See `src/pages/settings/index.tsx`.

### Menu management

A 288px tree card (320px at 1280px) sits beside a flexible detail card with a 16-20px gap. The tree owns its scroll; the right card holds a nonshrinking header, a metadata block, and a button table. Selecting a menu updates the right side without changing the shell.

### Assistant and Agent

The assistant panel is a floating column anchored to the bottom-right of the viewport, not a layout column: it never resizes main content. Its header and composer stay fixed; messages and session history scroll independently. The Agent page instead dedicates a 260px rail to history and a flexible column to the conversation; both are real layout columns inside the full-screen shell.

### Internally divided detail panels

Reference implementation: `src/pages/examples/crud/ProjectDetailPage.tsx`. The composition is natural-height metadata, flexible long text, and natural-height lifecycle information. The long text owns scrolling. If a short viewport cannot fit these fixed sections, let the entire detail column become its own scroller; do not leave content inaccessible.

## 6. Narrow viewports and zoom

The project is desktop-oriented with partial responsive behavior; it is not proof of complete mobile support.

**Observed breakpoints:** 640, 768, 1024, 1280, and 1536px. Main padding changes at 1024px. The dashboard metric grid is 2 columns and becomes 4 at 1280px. The menu split view is stacked below 1024px and side by side above. Settings category width changes at 1280px. The assistant panel becomes a bottom sheet below 640px.

**Portability completions:**

1. Below 1024px, a mini sidebar can reclaim width. Below 640px, use overlay navigation or an explicit menu entry so content remains usable. If navigation leaves the layout flow, explicitly keep main in the content column; auto-placement must not move it into a zero-width navigation track.
2. Wrap toolbars deliberately: title first, controls next. Preserve 36px control height and readable text.
3. Keep the main table in a constrained viewport with local horizontal overflow.
4. Convert an impractically wide side panel to an overlay or tab; do not force a wide side panel and a wide table side by side on a phone.
5. Short heights, zoom, and virtual keyboards must not leave zero reachable body area. Keep modal bodies scrollable and reduce decorative spacing when necessary.
6. Login and error pages use natural document scrolling and must not inherit shell height locking.
7. The settings split view currently stays side by side at narrow widths; if a target needs mobile support, replace the stacked category card with a compact selector rather than letting the first panel consume all available height.

If the target only requests desktop, complete desktop fidelity and zoom reachability without inventing an entire mobile navigation product.

## 7. Layering and diagnosis

Observed baseline layers: sticky table cells 1, table header 2, refresh bar 3, sidebar 30, assistant panel 80, modal overlay/content 1000, confirmation dialogs 1010, select popover 1060, global search 1100. Toasts render above application layers through the Sonner host. Modals and drawers must sit above the shell; map them into the target's overlay layer system. Avoid enormous arbitrary z-index values hiding stacking-context problems.

Diagnose in this order:

1. Which element extends beyond the document viewport?
2. Where does the finite height chain become auto or lose `min-height: 0`?
3. Which element actually scrolls, and do listeners observe it?
4. Is the sticky header's nearest scrolling ancestor correct?
5. Are widths double-counting padding, borders, fixed columns, or scrollbar space?
6. Are dimensions recalculated after sidebar transitions, resize, font loading, and toolbar wrapping?
