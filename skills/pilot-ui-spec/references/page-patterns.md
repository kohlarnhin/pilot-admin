# Page Compositions

## Contents

1. Standard management list
2. Split views and selection hubs
3. Settings workspace
4. Dashboard
5. Login page
6. Assistant settings and Agent
7. Choosing a composition

## 1. Standard management list

Current examples: users, roles, and the button table inside menu management.

```text
finite-height page
  page header: title + description + count + primary action
  main card: flex column, min-height:0, overflow:hidden
    persistent toolbar + search + filters/actions
    flexible table region
      persistent column headings (44px)
      internally scrolling records
```

Use the full available width of the admin main region. One main card fills its height. Do not add a redundant page title above the card. Use a 16px card radius and light boundary/shadow.

Typical page header: 20px/600 title, 13px description, optional 13px count, and one main action at the right using the outlined treatment. The toolbar strip holds search and filters on the left and a result count on the right. Search and buttons are 36px high, separated by 10px. The header may wrap without changing total card height.

Use infinite loading for large record sets, and omit the pagination footer. Keep a stable action column and meaningful empty-state text. Modals and drawers add/edit/view a record without destroying the list's shell. Refresh after a write preserves the current query and scroll position where possible.

### Column recipes by entity shape

| Entity shape | Useful column composition |
| --- | --- |
| Person/account | Avatar and name plus monospace identifier, role badges, email, status switch, created time, actions |
| Permission role | Role name and description, code chip, granted menu/button counts, status switch, created time, actions |
| Menu button | Button name, button code, permission code chip, status tag, rename action |
| Model configuration | Model name and code, provider and base URL, masked key, status switch, updated time, actions |
| Assistant session | Title, message count, group time, current badge |
| Agent plan step | Step name, status, duration, result summary |

These are composition examples, not requirements to add fields absent from the target product.

### Users page specifics

The users list demonstrates the full pattern:

- 350ms debounced live search plus Enter.
- A total count loaded from a separate count request.
- A user cell with a 32px avatar, 13px/500 name, 11px monospace `@login · id`, and a copy control.
- Role badges with a quiet 「未分配角色」 fallback.
- A 28x16px status switch; the signed-in account cannot disable itself, and the tooltip explains why.
- 144px action column with edit, reset-password, and delete; delete is disabled for the signed-in account.
- Create/edit dialog with inline validation; a created account shows its generated password once in a 440px confirmation dialog.
- A load error renders an alert with retry and switches the empty state text to the failure.

### Roles page specifics

- A 30% role column with a 32px shield tile, name, and description.
- A code chip, granted counts (`N 菜单 · M 按钮`), status switch, and timestamp.
- The permission dialog is 920px wide and uses the module/page/button matrix described in overlays-and-feedback.md.
- After a permission save, refresh the current account through `refreshMe` so its menu and button access updates immediately.

## 2. Split views and selection hubs

### Menu split view

The menu page is the current master-detail split:

- A 288px tree card (320px at 1280px) and a flexible detail card, 16-20px apart.
- The left card has a 60px filter row with a full-width search input, then a scrolling tree.
- The right card has a card toolbar with the selected menu name and a rename action, a metadata grid (2 columns, 3 at 1280px), and a button table that fills the remainder.
- Selecting a node updates the right side without remounting the page or moving the shell.
- An empty tree, an empty button list, and "no node selected" each have distinct copy.

### Card-grid selection hub

*No reference implementation in Pilot Admin yet; follow these rules when you add one.* Use it when a user must choose a workspace or resource group before seeing records.

- Header stays outside the scrolling card grid.
- Grid: 1 column by default, 2 at the applicable medium breakpoint, 3 on desktop; gap 20-24px.
- Card: white, 12px radius, 24px padding, 1px light border, subtle shadow. Hover strengthens the border to slate-300 and adds the popover shadow; titles and arrows stay slate. Do not introduce an orange border or title on hover.
- The upper region contains a title and optional quiet type/version badge.
- The middle region holds repeatable summary rows, separated by subtle lines where appropriate.
- Completion bars are 4px emerald on a slate-100 track.
- The lower region contains small counts and a quiet slate Open/Enter action with a short arrow movement.
- Reserve fixed internal slots when variable item counts should not misalign a grid. Missing metrics use low-emphasis placeholders within reserved slots; never fabricate values.

The whole card can navigate, but nested controls must avoid triggering that navigation. Make card navigation keyboard-operable through a real link or button rather than an unlabelled clickable div.

### Hierarchical directory

*No reference implementation in Pilot Admin yet as a record table; the menu tree covers the navigation shape.* When adding a directory above a record table:

- Replace the selection grid with a main table card. The header contains Back, breadcrumbs, a group count, search, and creation/import actions.
- Allow content-driven header growth rather than clipping a wrapped toolbar.
- Keep groups flat within a continuous parent block, rather than nesting a separate elevated card for every child.
- Child rows indent inside the first cell; the disclosure, name navigation, and row actions must not fight each other for the same click.

If the hierarchy is navigational rather than record-oriented, use the menu tree pattern (40px rows, 20px indent, brand-free selection) instead of a table.

## 3. Settings workspace

Use a two-panel layout: a **256px** category card, increasing to **288px** at 1280px, plus flexible content; 20px gap. Each side has its own bounded content region.

Category item: 12px radius, 16px horizontal and 12px vertical padding, 14px gap, 36px icon tile, 13px medium title and 11px description. Active category uses a `slate-100` surface, fine border, and slate-900 text. Do not use an orange category surface.

The right side uses a standard card header and either a list or vertically labelled form. Long configuration content scrolls within the right card. Persistent save actions stay outside that scroller in a footbar. Category switching does not change the overall shell dimensions.

The category rail is a real vertical tab list: `role="tablist"`, `aria-orientation="vertical"`, each tab controls its panel, and the URL keeps the selected section so a deep link reopens it. Settings that are read-only for the current role render disabled controls, not a different page.

Sections in the current product: basic site settings, security policy, notification preferences, and demo-data reset. The reset section uses a warning alert, a factual summary card, and a destructive action behind a confirmation dialog. It never pretends the reset is reversible.

The current split view stays side by side on narrow screens. For a target requiring mobile, replace the full-height category card with a compact selector or tab strip; otherwise the first panel can consume all available height.

## 4. Dashboard

The dashboard is allowed to scroll as one region **inside main**; metric cards do not each need a tiny internal scrollbar. The sidebar remains stationary; there is no workspace top bar in the admin shell.

- Metric grid: 2 columns, then 4 at desktop; gap 20px.
- Metric card: 24px horizontal and 20px vertical padding, 16px radius, 1px `#E6EAF0`, card shadow; label 13px slate-500 with an 18px icon; value 28px/600 monospace tabular numerals with a 12px unit.
- Supporting cards: standard 16px card with a card header (15px/600 title, 12px description, optional 18px icon) and 16-24px content padding.
- Main section gap: 24px.
- Todo/quick-entry rows: 12px horizontal and 16px vertical padding, 12px radius on hover, a 36px icon tile, 13px/500 title, 12px description, and a 16px arrow that shifts slightly on hover.
- Activity list: avatar/icon circle, actor in medium weight, action text, 11px monospace timestamp with a full-value tooltip. Rows are separated by 1px `line-soft`.

Loading placeholders preserve metric and section geometry. The current dashboard is metrics, todo entries, and recent activity; do not add decorative charts merely to make it look more elaborate.

## 5. Login page

Login is a separate, naturally scrolling variant, not the authenticated shell.

The page uses a minimal centered form on white. Form width is capped at **380px**. The page has a natural minimum viewport height, 16px horizontal and 48px vertical padding, and a quiet footer.

- Logo 40px above the title.
- Brand heading: 22px/600, slate-900, tight tracking.
- Description: 13px, quiet slate.
- Inputs: 40px high (large size), 8px radius, 13px text, white fill, light border, neutral slate focus ring, 16px prefix icons.
- Main submit: 40px high, full width, 8px radius, 14px/500, **slate-900 fill with white text**; loading shows a spinner and blocks repeat submission.
- Demo-account shortcuts: three equal buttons in a row, 8px radius, fine border, 12px medium name and 11px monospace account.
- Small helper/footer links: 11-13px, quiet text.

Field-level failures render inline below the control with `aria-invalid` and `aria-describedby`, not as a toast. The form width does not change when an error appears, the inline message clears as soon as the user edits the field, and focus moves to the relevant control (password after a wrong password, account after an unresolved account). The demo-account shortcut fills the fields and focuses the password.

Preserve target authentication flows and validation; do not invent providers, credentials, or authorization behavior. If the product offers a second entry mode, ask once after login with a small dialog and persist the preference in the account menu.

## 6. Assistant settings and Agent

### Assistant settings

Use the settings workspace from §3: a full-width finite-height page with `PageHeader`, a 256/288px category rail, a 20px gap, and one flexible content card. The card owns its scrolling content; form actions stay in a persistent footbar outside that scroller. Panel sections own their header and actions and have no shared footbar. System settings retains its independent implementation.

`src/pages/assistant/sections/registry.ts` is the ordered extension point. Each entry declares its URL key, icon, localized title/description keys, optional extra permissions, form/panel kind, and lazy component. Only the active section mounts. Form entries also declare their profile fields, save label and validity check, so new sections do not require edits to the page shell.

The vertical rail uses roving focus, automatic activation, and linked tab/panel ARIA attributes. `?tab=` opens a section; unknown or unavailable values fall back to the first visible section. Form drafts live in the page shell, keyed by section, and survive switching. A small slate dot with hidden unsaved text marks dirty sections. Save submits only that section's fields; Reset to saved discards only its draft. Failed saves retain input with visible feedback and allow retry. One shared profile request supplies both forms, with a matching skeleton and explicit load retry; models load within their own section.

- **Model configuration** uses the standard table card: model name/code, provider and base URL, masked key, status, updated time, and row actions. The create/edit dialog is 460px wide; model code and name fields cap at 150 characters; the key is shown masked and is never returned in clear text.
- **Identity & greeting** pairs a two-field form (assistant name, greeting) with a live preview card. Stack the preview when the available width is insufficient for two columns. Show a character counter on the long field; disable save when either required value is empty.
- **Quick prompts** allows at most six rows, each with a short label and a prompt, plus reorder and remove actions. The add button disables at the limit.
- **Commands & capabilities** is a read-only panel listing every catalog command, localized names and descriptions, trigger phrases from both dictionaries, prefix/argument support, and declarative permission metadata. Its description identifies this as the future home for tool toggles; it does not change assistant execution.
- Read-only accounts see disabled controls. Accounts without `agent-config:view` do not render the configuration data at all.
- When no model is configured, show one clear empty state and disable dependent inputs.

### Agent page

The Agent page is the full-screen host for the same assistant runtime:

- 56px top bar, 260px history rail, 48px conversation toolbar, centered conversation.
- Opening a page from a conversation shows a return banner in the admin shell; the banner links back to the same session and accepts only same-site Agent routes.
- Losing `agent:use` removes the panel and returns 403 on the Agent route.
- The history rail and the panel history are the same data; loading a session in one host updates the other.

### Choosing between panel and page

Use the panel for short, contextual work while a page stays visible. Use the Agent page for long conversations, per-session history browsing, and tasks that need more vertical space. They are different presentations of one runtime, not two products.

## 7. Choosing a composition

Choose the simplest matching composition based on interaction:

- Repeated records and CRUD: standard list.
- Navigation hierarchy with a detail pane: split view.
- Selecting a workspace before editing: card-grid hub plus breadcrumbs.
- Category-based configuration: settings.
- Cross-resource summary: dashboard.
- Temporary detail without losing list position: dialog or drawer, as specified in overlays-and-feedback.md.
- Open-ended or multi-step natural-language work: assistant panel or Agent page.

Do not force all screens into one large table, and do not add card grids where dense comparison is the main task. Keep the shared visual tokens and scroll contracts consistent across the selected pattern.
