# Component Specifications

## Contents

1. Main navigation, shell entries, and top bars
2. Card headings and toolbars
3. Buttons and icon actions
4. Inputs, selects, forms, and switches
5. Badges, avatars, and progress
6. Tabs, menus, tooltips, copy, and empty states

## 1. Main navigation, shell entries, and top bars

### Expanded sidebar

- Width **224px**; white background; 1px `#E2E8F0` solid right boundary; fixed to the viewport.
- Brand area: **64px** high, 20px horizontal padding, 32px logo, 12px logo-to-text gap. Product name 15px/600; subtitle 11px slate-400.
- A 24px circular collapse control straddles the right boundary near the brand area, with a 1px border, white surface, and neutral arrow. It must have an accessible label that changes between expand and collapse.
- Global search trigger sits directly below the brand area: 36px high, 12px horizontal inset, pale slate fill on hover, 12px label, `⌘K` or `Ctrl K` keycap. It is a button, not a fake input.
- Menu viewport: 12px horizontal padding, independent vertical scrolling, no horizontal scrolling.
- Group headings: 12px/500, slate-400, with generous top spacing. A small disclosure arrow appears on hover and rotates when the group is open.
- Root item: minimum height 40px, 8px radius, 12px horizontal and 8px vertical padding. Icon slot 22px; rendered icon 18px; 12px gap before text.
- Root text: 13px, slate-600. Items have a 2px vertical gap.
- Nested item: minimum height 36px, quieter density; optional 16px icon or 6px dot.
- Normal: text slate-600, icon slate-400. Hover: text slate-900 (no orange wash). Active root: slate-900 medium text, brand-600 icon. Active child: slate-900 medium text and a brand-500 dot.
- Disabled: reduced opacity and noninteractive semantics, not just a gray color.
- Long labels truncate; do not push disclosure arrows or counters outside the item.

### Collapsed sidebar

- Width **88px**; the brand text disappears while the 32px logo remains centered.
- Mini items stack a 20px icon over an 11px caption. Minimum item height **58px**, 12px radius, approximately 6px internal gap.
- Active icon is brand-600; the caption stays slate. There is no orange background.
- A root with children shows a small dot and opens a right-side popover on hover or focus. Any mini submenu must remain accessible by keyboard and pointer, without relying on an invisible expanded label.

### Sidebar footer

From top to bottom: the AI assistant entry, an optional help link, and the account menu. Each entry is 40-44px high, 8-12px radius, slate text, neutral hover.

The assistant row is 40px high, shows an 18px sparkle mark, the label, and the shortcut keycap; when streaming with the panel closed it shows a 6px brand-500 dot beside the mark. The row is marked with `aria-controls` and `aria-expanded`. There is no floating assistant launcher anywhere in the shell. The help row appears only when a help URL is configured.

The account trigger is about 44px high (32px avatar plus 6px vertical padding) with a truncated 13px/500 name, a 12px secondary identifier, and a chevron. Its dropdown is **240px** wide, 12px radius, white, fine border, popover shadow, compact padding. The header block shows the display name and email. Menu items are 36px tall, 8px radius, 13px/500, with 16px icons. Sign out has red hover feedback and a red icon.

### Full-screen Agent top bar

The full-screen Agent page uses a separate shell with a **56px** top bar: a 28px logo mark and a 14px/600 product name at the left; help, a "back to console" link, and the account menu at the right. Content below is a 260px history rail and a flexible conversation column.

### Future workspace top bar

*No reference implementation in Pilot Admin yet; follow these rules when you add a second shell.* A workspace shell may use the same 56px top bar with the logo and product name at the left, horizontal navigation in the middle (13px, active item slate-900 with a 2px brand-500 underline), and utilities at the right. Content below should be centered up to a documented maximum width with 16/24px padding. Do not apply this top bar to the admin shell, which has no global header row.

## 2. Card headings and toolbars

### Standard management card header

`CardToolbar` is the heading for a titled card such as the menu detail. Use a nonshrinking header with **24px horizontal and 16px vertical** padding. Left: a 40px icon tile (12px radius, 1px light border, 22px brand-500 icon), a title/description block, and an optional neutral count badge. Right: search, filters, and actions separated by 10px. Divide header and body with a very light 1px line.

Title is 15px/600; description is 12px with a 2-4px gap above it. Left text is shrinkable; actions preserve their control dimensions. Let the header wrap at the page's breakpoint rather than clipping actions.

`ListToolbar` is the standard strip for a management list: minimum height **60px**, 24px horizontal padding, 12px vertical padding, search and filters on the left, and a result count on the right in 13px slate-400.

`CardBar` is the compact workbench variant: minimum height **61px**, 24px horizontal, 12px vertical, breadcrumb or title on the left and actions on the right.

### Standalone page header

`PageHeader` sits above the card and uses a **20px/600** title with 28px line height and slight negative tracking. It supports:

- A **28px square** back control with 8px radius, white surface, fine border, 15px arrow, and a tooltip.
- Optional crumbs shown on the same line as the title; ancestor labels are 20px/500 and quiet but clickable, while the current label is 20px/600 slate-900. Ancestors cap at 240px and truncate.
- A 13px description below the title, indented by 40px when a back control is present.
- A 13px meta count next to the title.
- Right-aligned actions with 10px gaps.

Use either a standalone page header or a fully self-contained card header. Do not stack both with duplicate titles. See `src/pages/users/index.tsx` for the header-plus-card composition and `src/pages/menus/index.tsx` for a header plus split view.

### Card primitives

- `Card`: white, 16px radius, 1px `#E6EAF0`, card shadow, `overflow: hidden`, flex column.
- `CardHeader` / `CardFooter`: 24px horizontal, 16px vertical, `#F1F5F9` divider.
- `CardContent`: 24px padding by default; list pages override to zero.
- `CardTitle` 15px/600; `CardDescription` 12px slate-500.
- Main cards keep the 16px radius; internal cards use 12px.

## 3. Buttons and icon actions

### Geometry

| Variant | Height | Horizontal padding | Radius | Text |
| --- | --- | --- | --- | --- |
| Default | 36px | 16px | 8px | 13px/500 |
| Small toolbar | 36px | 12px | 8px | 12px/500 |
| Extra small local action | 28px | 10px | 6px | 12px/500 |
| Large | 40px | 24px | 8px | 14px/500 |
| Icon | 36px square | 0 | 8px | 16-18px icon |
| Row icon | 28-32px square | 0 | 6-8px | 15-17px icon |
| Compact local action | 28/32px | 8-12px | 6/8px | Explicit local variant |

Inline icon/label gap is 6-8px. Labels do not wrap. A loading label must not cause a dramatic width change; icon-only buttons swap the icon for a spinner without changing size.

### State matrix

| Role | Rest | Hover | Focus | Disabled / loading |
| --- | --- | --- | --- | --- |
| Default / outline | White, slate-800 text, `#E2E8F0` border, 2xs shadow | slate-50 surface, slate-300 border, slate-900 text | 2px slate-400 ring with 2px offset | Preserve geometry, 50% opacity, block duplicate action |
| Secondary | slate-50 surface, slate-700 text | slate-100 surface, slate-300 border | 2px slate-400 ring | Reduced opacity |
| Filled primary | slate-900 surface, white text | slate-800 | Visible slate ring | Reduced opacity; no hover transformation |
| Filled destructive | `#FF5630`, white text | `#E5482A` | Destructive or visible neutral ring | Remains disabled semantically |
| Ghost / subtle | Transparent, slate-500 text/icon | slate-100 surface, slate-900 text | Visible neutral ring | Quiet, no active hover |
| Delete ghost | Transparent, slate-500 | `#FEF2F2` with `#DC2626` | Visible destructive focus | Gray, no red hover while disabled |
| Link | Slate-700, underline on hover, no box | Darker slate | Visible focus | Noninteractive semantics |

Default and outline are intentionally identical. Create, Save, Search, and Cancel normally use white outline treatment. Filled primary must be explicitly selected for the one strongest action; it is slate-900, never orange. A pressed toggle uses a slate-100 surface with a slate-300 border and sets `aria-pressed`.

### Action behavior

- Use semantic buttons with `type="button"` unless submitting a form.
- Icon-only buttons need an accessible name and a tooltip where the action is not self-evident.
- Disabled behavior must use actual disabled/`aria-disabled` semantics as appropriate; remove click activation, not just pointer styling.
- A loading spinner replaces or accompanies the icon without shifting the row. Use `aria-busy` and prevent repeat submission.
- On narrow touch interfaces, increase hit area without needing a visibly oversized icon.
- Confirm destructive actions only where the target workflow requires it. Do not add confirmation to every ordinary action merely because this is an admin interface.
- Row actions are 28-32px ghost or subtle buttons with 15-17px icons and 2px gaps. Use the tooltip to explain a disabled state.

## 4. Inputs, selects, forms, and switches

### Standard input

Height 36px (small 32px, large 40px), radius 8px, white fill, 1px `#E2E8F0` border, 13px text, 12px horizontal padding. Placeholder is slate-400. Prefix/suffix slots are vertically centered and do not increase the control height.

Hover strengthens the border to slate-300. Focus uses a slate-400 border and a 3px `rgba(15,23,42,.1)` ring. Transition is 150ms. Invalid fields use a red-400 border and red ring at 20%. Avoid nested visible borders when a component library wraps an input with prefix/suffix elements.

Character counters render `12 / 100` (spaces around the slash) in 11px monospace slate-400, right aligned below or inside the control. The clear affordance is a 16px neutral circle with a white cross; it does not change the control width.

### Search and select

- Default search width is 224px; list toolbars commonly use 288px. Workbenches may range from 160px to 288px according to available width.
- Search icon: 15px, quiet slate-400. Clear action does not change width.
- Selects align with inputs and buttons at 36px. Typical toolbar selects are 112-144px, depending on label length.
- Dropdown contents have a bounded height (about 256px) and their own scroll. Long options truncate or wrap within a controlled option layout.
- Option rows are at least 32px high with 6px radius, 13px text, and a 14px check for the selected value. Group labels are 11px slate-400.
- Placeholder, selection, loading, empty-options, error, and disabled states must all be legible. The empty label is 「暂无匹配选项」 by default.
- Library portals must avoid clipping under `overflow: hidden` cards while retaining correct overlay stacking.

### Form arrangement

Use vertical labels, 13px/500 label text, and approximately 6px label-to-control spacing. Single-column forms suit short dialogs; related short fields may share a two-column grid. Long text and validation occupy full width.

Required indicators are a small red asterisk after the label. Place stable identifier hints opposite the field label when useful (`labelExtra`). Coding fields use monospace. Help text sits below the field at 12px slate-400; errors replace help without overlapping another control.

`Form.Item` wires accessibility automatically: the control receives an `id` of `form_item_<name>`, `aria-required` when required, `aria-invalid` while invalid, and `aria-describedby` pointing at `${controlId}_help` whenever help or a validation error is visible. The error element keeps `role="alert"`. Controls that render a custom trigger (Select) must forward all four attributes.

Textareas use line-based height, not the single-line 36px rule. Bound long input areas and allow internal scrolling where needed. Resize handles must not break fixed-row virtual tables; open a dedicated editor for multiline row content.

### States

| State | Treatment |
| --- | --- |
| Rest | White fill and light border |
| Hover | Slightly stronger border |
| Focus | Slate-400 border and 3px neutral halo |
| Invalid | Red border, red halo, and an inline error associated with the field |
| Disabled | slate-50 fill, slate-400 text, disabled semantics, no active hover |
| Read only | Readable value, no edit affordance, copying remains possible |
| Saving | Local progress, preserved value, duplicate submit prevented |

Field-level validation failures stay inline next to the field; do not report empty or malformed fields with a toast. Login uses this rule for account and password.

### Checkbox and switch

Checked checkboxes and enabled switches use **slate-900**. The unchecked switch uses `slate-300`. Labels and hit targets stay aligned with the 36px control rhythm.

- Checkbox: 16px square, 4px radius, white fill; checked and indeterminate are slate-900 with a white mark. Batch-selection checkboxes support indeterminate state.
- Switch: 42x22px default, 28x16px small for table rows. Thumb 18px/12px white with a soft shadow. Loading replaces the thumb with a spinner.
- Do not use orange for checked state.
- Do not represent a permission denial only as an off switch. Separate value, authorization, availability, and in-flight change states. Keep the previous value if a server update fails, or visibly revert an optimistic change.

## 5. Badges, avatars, and progress

### Badges

Standard badge: inline-flex, 22px high, 12px/500, 8px horizontal and 2px vertical padding, 6px radius, no wrapping, content width, 6px gap, 12px icon. The surface is `slate-50/60` with a `#E2E8F0` border and slate-600 text.

Variants differ mainly by a 6px leading dot: info sky, warning amber, success emerald, error red. `destructive` is the only filled variant (`#FF5630`, white text). Shapes: rounded rectangle by default, pill for selected counts/categories, or a standalone 8px dot. A dot cannot replace a necessary text explanation. Counts and versions may use 10-12px monospace compact variants.

`Tag` mirrors the badge shape and adds a semantic dot plus optional icon, without a filled background. It is the default status token for table cells.

`CodeTag` is a 22px-high monospace chip with a slate-50 surface and a `line-soft` border. It truncates with an ellipsis and exposes the full string through `title` (derived from string children when no title is passed).

### Avatars

Common sizes: 28px account trigger fallback, 32px rows and account trigger, 40px user summary. Use circular crops, a 1px gray-200 ring, and a restrained shadow. Fallback initials use a slate-100 surface with slate-600 text; do not use a brand-colored fallback. Do not stretch images or depend on a remote profile image to preserve row geometry.

### Progress

`Progress` renders a rounded track with a slate-100 base. The default track height is 6px (4px for the small variant) and the fill animates width over 300ms.

- The default fill is brand-500. Use it for in-progress meaning, not for completion.
- For completion or coverage, pass an explicit emerald (`#10B981`) stroke color; do not repaint the track or the surrounding card.
- The percentage label is 12px monospace tabular numerals in slate-500, right aligned in a 40px slot.
- Status `exception` falls back to red; status `active` adds a subtle shine that stops under reduced motion.
- Clamp visual width to 0-100% while displaying valid source values. Empty metrics remain structurally stable; do not fabricate completion percentages.

## 6. Tabs, menus, tooltips, copy, and empty states

### Tabs

Tabs use a 2px **brand-500 underline** and slate-900 active text at 13px/500. Inactive tabs are slate-500 with a slate-900 hover. The strip is 40px high with 24px gaps and an optional 12px count. Keep the strip outside a long content scroller when tabs are persistent controls. Switching tabs must preserve the shell dimensions.

`SectionBar` is the lighter in-tab header: one line of 13px slate-500 description on the left, actions on the right, 36px minimum height.

### Menus and tooltips

Dropdown menus use a white surface, 1px border, 12px radius, popover shadow, and 36px items with 13px text, 16px icons, and a `slate-100` highlight. Danger items are red with a red-tinted hover. Dividers are 1px `line-soft`.

Tooltips are compact dark explanatory surfaces by default; use the light variant when showing structured content. They may show full identifiers, precise timestamps, progress breakdowns, and disabled-action reasons. Do not put essential navigation exclusively in tooltips.

### Copy behavior

Keep the copy icon quiet at 13px, expose it on hover/focus, stop row navigation, copy the exact full value, show a success check for about 1800ms, and report failure if copying fails. Do not expose sensitive full values in a generic success message when the target field is a secret; the message becomes simply 「已复制」.

### Empty state

`EmptyState` fills the available body and centers on both axes. It uses a 48px white tile with a 1px border, 12px radius, and a 24px slate-400 icon, followed by a 14px/500 slate-600 title and an optional 12px slate-500 description capped at a readable width. Gap is 12px; padding is 24px horizontal and 32px vertical. Keep one message: if the title already states the fact, omit a redundant description.

Distinguish no records, no matching results, no selected item, and no permission. Never show an ordinary empty state for a failed request. Do not add large illustrations or blurred decorative shadows to a table empty state.

### Component gallery

The running gallery at `/examples/components` is the executable reference for every primitive on this page: button variants and sizes, inputs and their states, selects, switches, checkboxes, badges, tags, alerts, tabs, popovers, dropdowns, tooltips, modals, the async modal, the drawer, drag-and-drop, tables, skeletons, and empty states. Reuse the existing components instead of creating a similar second button or toast system.
