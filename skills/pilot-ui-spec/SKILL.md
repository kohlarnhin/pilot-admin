---
name: pilot-ui-spec
description: Reproduce the Pilot Admin interface across frontend stacks, including its white and slate visual system with orange brand signals, compact controls, fixed sidebar shell, independently scrolling panels, virtualized infinite lists, and shared assistant runtime. Use when the user requests this project's appearance or explicitly selects this specification.
---

# Pilot Admin UI Specification

## Outcome

Build interfaces that belong to the same visual and interaction system as Pilot Admin. Preserve layout proportions, information density, typography, spacing, borders, control states, and scrolling behavior while adapting business entities, branding, APIs, and implementation technology.

This specification describes the interface implemented in this repository: a domain-free React administration starter with mock data, a sidebar shell, management pages, a component gallery, a sidebar assistant panel, and a full-screen Agent page. It does not require React, Tailwind, or any particular icon runtime. Where this text and the running code disagree, the real implementation and the `/examples/components` page win; evidence is mapped in [source-map.md](references/source-map.md).

Keep this package repository-local under `skills/pilot-ui-spec/`. To reuse it by path in another project, copy the entire folder, including references and assets, and instruct the agent to read `skills/pilot-ui-spec/SKILL.md`. Do not move or install it into a personal skill directory unless the user requests that separately.

## Workflow and reference routing

1. Inspect the target project's framework, routes, component library, styling conventions, and requested scope. Retain its technology choices; override library defaults where they conflict with the required result.
2. Read [visual-system.md](references/visual-system.md) for every visual task. For shells, panels, sizing, or scrolling, also read [layout-and-scroll.md](references/layout-and-scroll.md).
3. Read only the additional references relevant to the requested features.
4. Establish height constraints and scroll ownership before implementing content. Apply tokens, component states, and the appropriate page composition.
5. Verify the affected behavior using [acceptance.md](references/acceptance.md). Report actual checks and material deviations; do not imply unperformed visual comparisons.

| Feature | Reference |
| --- | --- |
| Tables, search, selection, pagination requests, virtualization | [tables-and-loading.md](references/tables-and-loading.md) |
| Navigation, buttons, inputs, badges, cards, tooltips | [components.md](references/components.md) |
| Management pages, settings, dashboards, assistant settings, login | [page-patterns.md](references/page-patterns.md) |
| Modals, drawers, imports, assistant panel, loading and feedback | [overlays-and-feedback.md](references/overlays-and-feedback.md) |
| Implementation evidence, variants, known inconsistencies | [source-map.md](references/source-map.md) |
| Framework-neutral working example | [reference.html](assets/reference.html), [tokens.css](assets/tokens.css), [console.css](assets/console.css), [reference.js](assets/reference.js) |

## Essential contracts

### Application shell

- Desktop admin navigation is **224px** wide, or **88px** when collapsed. Its brand area is **64px** tall and holds a 32px logo, a 15px/600 product name, and an 11px subtitle. The admin shell has no separate global header row: page content starts directly inside the main region.
- The authenticated application fits the viewport. Admin main content uses **16px / 24px** padding (24px from the 1024px breakpoint) and fills the available width. There is no max-width cap on ordinary management pages.
- The full-screen Agent page (`/agent`) is a different shell: a **56px** top bar, a **260px** session sidebar, and a conversation column that centers messages at **760px** with a **792px** composer wrapper. Its own scrollers handle history and messages independently.
- The AI assistant has no floating launcher. Its entry sits in the sidebar footer above the help and account rows, shows the keyboard shortcut, and toggles the panel whose session state is shared with the Agent page. The panel itself is a 440px (720px expanded) overlay anchored 24px from the right and bottom, capped at `min(760px, viewport - 48px)`.
- Page titles, filters, table headers, panel headers, and required action footers remain visible while their content scrolls. Most fixed regions should be nonshrinking Grid/Flex children, not individually positioned overlays.
- Tables, navigation trees, session history, settings content, and long forms own their respective scroll containers. Growing content must not increase document height or scroll adjacent panels.
- Every shrinkable vertical intermediate container needs `min-height: 0`; horizontal intermediates need `min-width: 0`. The height chain must terminate in a finite viewport or host height.
- Dashboards may scroll within the application main region. Login pages and error pages are separate, naturally scrolling page types.

### Visual identity

- Use white surfaces, light slate one-pixel borders, restrained shadows, and neutral interactive states. Establish hierarchy through alignment and spacing, not color.
- The interactive layer is neutral: ordinary buttons are white with a `#E2E8F0` border and slate-800 text; hover is `slate-50` with a `slate-300` border and `slate-900` text. Focus rings, checkboxes, switches and selected backgrounds are slate. The filled primary button is `slate-900`; destructive actions are red.
- Orange (`#FDA92D`) is a brand signal only: current-location icon or dot, tab underline, list selection bar, in-progress steps and bars, assistant streaming, and new-content markers. Never recolor neutral controls, focus rings, checkboxes, switches or row selection orange.
- Completion and coverage signals use emerald (`#10B981`). The shared `Progress` fill defaults to brand orange and must receive an explicit emerald `strokeColor` when the bar means completion rather than activity. Warnings stay amber with an icon or text label.
- Brand orange is **#FDA92D**, with **#F59E0B** for stronger in-progress accents and **#A85D13** for readable brand text on white. Titles are dark slate; secondary text is quieter.
- Use locally bundled **Open Sans Variable + Noto Sans SC** for text and **JetBrains Mono** for identifiers. Body weight is 400, emphasis 500, selected headings 600. Most text is **12-13px**; page titles are **20px/600** and card titles **15px/600**. Table headers are **12px `slate-500`**; meaningful text never goes below **11px**.
- Normal controls are **36px** tall with **8px** corners. Main cards and dialogs have **16px** corners, internal cards **12px**. Table headers are **44px**; general data rows are content-driven (about 45px for a single-line row, 61-65px for two-line identity cells), and fixed-height editing rows are **56px** in the workbench pattern.
- Use one consistent icon family: Lucide through the local `Icon` registry, 18-20px in navigation and 14-18px in actions. Business content remains selectable and copyable.

### Data lists

- Large data lists use **server-paged, lazily appended infinite scrolling**, without page numbers or a previous/next pagination footer. This includes panel-local lists such as assistant session history: a 1px sentinel and the shared loader replace any 「加载更多」 button.
- Infinite loading controls network requests; virtualization controls mounted views. Implement both for large lists. Fetching everything first and revealing slices is not equivalent.
- Observe the actual list scroller. Prefetch when the remaining distance is within **max(1200px, scrollable distance x 0.5)**.
- Allow only one page request at a time per query. Deduplicate by stable ID, isolate obsolete queries, stop at the end, and provide bounded, explicit error recovery.
- First load uses a matching skeleton. Refresh preserves existing content. Normal append is quiet: no large loading placeholder, no permanent Load more control. A short status row with a spinner is allowed while a panel-local list appends.
- Empty states stay centered within the same content region. Errors must not masquerade as empty results.
- Truncate long cells with a full-value viewing/copy path: native `title` for truncated text and code tags, plus copy controls where the value is operational.
- Fixed columns show their 1px `#EDF1F5` divider only while the table is horizontally scrollable.
- Tables must fit their action column at **1280x720 with the sidebar expanded** (about 1006px inside the card, 992px usable after the stable scrollbar gutter): keep action columns fixed-width, let name/code columns flex, and avoid a horizontal scrollbar on standard management pages.
- Genuine width overflow scrolls inside the table, never through the document.

### Assistant and Agent

- The panel and the full-screen Agent page share one runtime above the routes. Switching hosts must not resend a message, cancel a stream, lose a draft, or replay a confirmation card.
- Drafts and sessions are isolated per user. A late stream delta must never land in a new session; stop, retry, and plan-step semantics are owned by the runtime and the tool that started them.
- The panel is non-modal. It must not trap focus or disable the page behind it. Dialogs opened from it are modal and take the higher layer.
- Escape closes the session-history layer first, then the panel, and focus returns to the trigger. Session history uses a 1px sentinel, the shared loader, and a single request lock.
- Attachments carry metadata only: name, size, MIME type, and an optional local line count. File bodies never enter messages, storage, or requests.

## Scope and interpretation

Replace users, roles, menus, settings sections, metrics, and assistant tools with the target product's entities. Columns, permissions, fields, and API shapes may differ. Do not copy business services, authentication assumptions, third-party integrations, or real source data.

User instructions override this baseline. If a user requests another brand color, mobile composition, or explicit pagination, implement that choice and identify the relevant deviation. A local page request does not authorize redesigning unrelated routes.

References distinguish:

- **Baseline:** directly supported by the current code and intended to carry forward.
- **Variant:** an explicit alternative for a particular page or component role.
- **Portability completion:** a behavior needed for reliable reuse that is absent, inconsistent, or not verified in the current code. Do not claim the repository already implements it.
- **No reference implementation:** a general pattern that Pilot Admin does not contain yet. Follow the rules when adding one; do not describe it as an existing screen.

Patterns marked *no reference implementation* in the references include the list-plus-detail editing workbench with fixed 56px rows, the card-grid selection hub, the spreadsheet-style import dialog, and the generic workspace top bar for a future second shell. They are specified because forked projects commonly need them, not because this repository renders them.

## Reference assets

The `assets/` example uses native HTML, CSS, and JavaScript with synthetic data and no services. Open `skills/pilot-ui-spec/assets/reference.html` directly to inspect the shell, controls, independent scrolling, paged append, row windowing, history panel, and a detail dialog.

Reuse the values in `skills/pilot-ui-spec/assets/tokens.css` and the layout relationships in `skills/pilot-ui-spec/assets/console.css`, then express them through the target stack. The example is a small demonstrator, not a complete business scaffold or a screenshot of the application. Font files, branding, the full icon set, and every page variant are not bundled; configure those resources when closer visual matching is required.

## Example requests

Use the file-path form when the destination environment has not registered this folder as a named skill:

> Read skills/pilot-ui-spec/SKILL.md and the references relevant to this task. Implement a resource management page in the current stack using its exact visual tokens, fixed shell, independently scrolling table, and virtualized infinite loading. Adapt business fields to this project.

If the environment already exposes the skill by name:

> Use $pilot-ui-spec to implement a resource management page in the current stack. Match the Pilot Admin layout, buttons, tables, and scroll behavior. Use server-paged infinite scrolling, a persistent toolbar and table header, and an independently scrolling table body.

> Use $pilot-ui-spec to add a settings workspace with a category rail and a scrolling content card, then add an assistant entry that opens the shared panel without introducing a second chat runtime.
