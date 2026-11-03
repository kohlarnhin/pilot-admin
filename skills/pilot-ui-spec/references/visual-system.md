# Visual System

## Contents

1. Visual direction and colors
2. Typography and text behavior
3. Spacing and dimensions
4. Borders, radii, and shadows
5. Icons and motion
6. Mapping to another stack

## 1. Visual direction and colors

### Baseline character

A compact desktop administration workspace dominated by tables, forms, and state. Use white surfaces and very light cool gray for secondary regions. The interface is neutral: controls, focus rings, selection, and checked states are slate. Orange is a small brand signal, not the interactive color.

Information is primarily 12-13px, with fine separators, 36px controls, and 16px card corners. Do not substitute oversized marketing headings, a hero section, generous landing-page whitespace, saturated panels, or decorative gradients across the application.

### Brand palette

| Role | Value | Usage |
| --- | --- | --- |
| Brand | `#FDA92D` | Current-location icon/dot, tab underline, list selection bar, in-progress step or bar, new-content marker |
| Brand 600 | `#F59E0B` | Stronger in-progress accent, active brand icons, assistant streaming |
| Brand 700 | `#A85D13` | Readable brand text on white (4.95:1), in-progress status text |
| Brand 800 | `#793908` | Rare stronger brand text |
| Brand 200 | `#FED680` | Supporting decoration, in-progress tag dot |
| Brand 100 | `#FEF4D4` | Light branded surface for brand-only callouts |
| Brand 50 | `#FFF8EB` | Faint brand tint; never a general hover surface |

Orange is used for meaning, not decoration. Do not apply it to ordinary button hover, input focus, checkboxes, switches, row selection, or neutral icons. In-progress states pair orange with a spinner, label, or percentage so color is not the only signal. Completion bars use emerald instead; warnings stay amber with text or an icon.

### Neutral interactive layer

| Role | Value |
| --- | --- |
| Ordinary button rest | White surface, `#E2E8F0` border, slate-800 text |
| Ordinary button hover | `slate-50` surface, `slate-300` border, slate-900 text |
| Button focus ring | 2px `focus` (`slate-500`, `#64748B`) ring with 2px offset |
| Input focus | `focus` (`slate-500`) border with a 3px `focus` halo at 10% opacity |
| Filled primary | `slate-900` surface, white text, `slate-800` hover |
| Checkbox / switch checked | `slate-900`; unchecked switch `slate-300` |
| Selected / current background | `slate-100`, or `slate-50/60` for a hover-like row |
| Row hover | `#F8FAFC`-equivalent `slate-50/60` |
| Completion bar | `#10B981` at 80% opacity for coverage; `Progress` defaults to brand orange with an explicit emerald `strokeColor` |

The filled primary is reserved for the single strongest action on a surface, such as the login submit or the confirm action inside an assistant card. Create, Save, Cancel, Search, and row actions stay outlined or ghost. Dialog footers intentionally use outlined buttons for both Cancel and OK, including destructive confirmation when `okType="danger"` is set; this is the local dialog convention, not an oversight.

### Project custom gray scale

The project overrides Tailwind's gray palette. Copying class names into another project without these values changes the result.

| Token name | Value | Role |
| --- | --- | --- |
| gray-50 | `#FAFBFC` | Faintest fills and skeleton bases |
| gray-100 | `#F9FAFB` | Very light separators and hover surfaces |
| gray-200 | `#F4F6F8` | Subtle control borders and fills; skeleton fill at 70% |
| gray-300 | `#DFE3E8` | Card and navigation boundaries |
| gray-400 | `#C4CDD5` | Faint metadata and scrollbar thumb |
| gray-500 | `#919EAB` | Secondary information and placeholders |
| gray-600 | `#637381` | Secondary body text and icons |
| gray-700 | `#454F5B` | Subheadings |
| gray-800 | `#1C252E` | Body text and headings |
| gray-900 | `#141A21` | Strongest headings |

Prefer semantic variables and the `line` tokens over recreating a utility palette blindly.

### Cool neutrals used by tables and forms

| Role | Value |
| --- | --- |
| Card surface / table header surface | `#FFFFFF` |
| Card boundary | `#E6EAF0` (the `Card` component); controls and tables use `#E2E8F0` |
| Input border / table header separator | `#E2E8F0` (`line`) |
| Standard data row separator | `#EDF1F5` (`line-row`) |
| Subtle internal separator | `#F1F5F9` (`line-soft`) |
| Table body text | `#1E293B` |
| Table header text | `#64748B` (12px, weight 500) |
| Secondary explanation / empty-state description | `#64748B` |

The authenticated shell, the main region, the login page, and the dashboard all paint white. Do not introduce a warm paper background or a colored application canvas.

### Status palette

| Status | Base | Soft badge text | Soft badge background |
| --- | --- | --- | --- |
| Success | `#36B37E` | `#1B806A` | Base at 15% |
| Warning | `#FFAB00` | `#B76E00` | Base at 15% |
| Error | `#FF5630` | `#B71D18` | Base at 15% |
| Information | `#00B8D9` | `#006C9C` | Base at 15% |
| Neutral | `#F1F5F9` surface | `#334155` | Opaque light gray |

Destructive hover uses `#E5482A` on the filled destructive button; the ghost row action uses `#FEF2F2` with `#DC2626`. Preserve destructive semantics instead of recoloring them orange. Pair status color with text or an identifiable icon.

The `Tag` component is neutral by default: a `slate-50/60` surface, `#E2E8F0` border, 12px slate-600 text, 22px height, 6px radius, and a 6px semantic dot. `Badge` follows the same compact shape with variants for info, warning, success, and error that differ only by dot color. Use tinted status surfaces only where a stronger alert is required, not for every status cell.

## 2. Typography and text behavior

### Font stacks

```css
--font-sans: 'Open Sans Variable', 'Noto Sans SC',
             'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular,
             Menlo, Monaco, Consolas, monospace;
```

Open Sans Variable leads for Latin characters and Noto Sans SC for Chinese glyphs. The project bundles both through Fontsource and loads Noto weights 400, 500, and 600, plus JetBrains Mono 400, 500, and 600. Monospace is used for identifiers, timestamps, versions, numeric metrics, and code.

Keep ordinary text at weight 400, emphasis at 500, and selected headings at 600. Avoid pervasive 600/700, especially for CJK text. Supply a real requested font weight when matching closely.

### Type scale

| Element | Size | Weight | Line treatment |
| --- | --- | --- | --- |
| Sidebar product name | 15px | 600 | Compact; subtitle 11px |
| Agent top-bar product name | 14px | 600 | Single line |
| Page title (`PageHeader`) | 20px | 600 | Single line, tight tracking, 28px line height |
| Card title (`CardTitle`, `CardToolbar`) | 15px | 600 | 24px line height |
| Supporting description | 12px | 400-500 | 20px line height |
| Standard table heading | 12px | 500 | `slate-500`, 20px line height |
| Standard table data | 13px | 400 | 20px line height |
| Fixed editing table | 12-14px | 400 | Constrained by 56px rows |
| Form label | 13px | 500 | 20px line height |
| Form input | 13px | 400 | Vertically centered in 36px control |
| Toolbar button (small) | 12px | 500 | 36px control |
| Default button | 13px | 500 | 36px control |
| Code, version, timestamp | 11-12px | 400-500 | Monospace; timestamps do not wrap |
| Badge / tag | 12px | 500 | Compact, 22px high |
| Navigation root | 13px | 400, 500 when active | Single line with ellipsis |
| Navigation group label | 12px | 500 | Sentence case, not uppercase |
| Mini navigation caption | 11px | 400 | One line under a 20px icon |
| Dashboard metric | 28px | 600 | Monospace tabular numerals |
| Dialog / drawer title | 15px | 600 | 24px line height |
| Login brand heading | 22px | 600 | 32px line height, tight tracking |
| Assistant panel title | 13px | 600 | 11px secondary line |

Table headings are not uppercase. The data table uses normal letter spacing; the standalone reference asset uses `0.01em` for a slightly wider table header. Main titles use only slight negative tracking. Do not use meaningful text below **11px**; 10px is limited to decorative markers. Navigation group headings are sentence case in this project; do not uppercase Latin group labels without a product reason.

### Content constraints

- Truncation requires a shrinkable parent: `min-width: 0`, then overflow hidden, ellipsis, and nowrap.
- Every truncated title, identifier, or code carries a native `title` with the full value. `CodeTag` derives the title from string children automatically; `CardToolbar` and `PageHeader` derive it from string titles and descriptions.
- List summaries are generally one line. Detail content can use pre-wrap and `overflow-wrap: anywhere`.
- Identifiers remain selectable and copyable. Copy controls do not steal the identifier's minimum width.
- Timestamps display as `YYYY-MM-DD HH:mm`; a `title` may expose seconds. Retain the target product's timezone policy.
- Apply `user-select: none` to navigation and decoration, not to entire business content panels.
- Meaningful secondary text, including metadata, help, placeholders, counts and empty-state descriptions, uses `slate-500` or darker. Use `slate-600` on tinted surfaces where slate-500 falls below 4.5:1; reserve slate-400 for decoration and disabled controls. Small validation text uses `red-600`.

## 3. Spacing and dimensions

Use a mainly 4px rhythm, retaining the project's purposeful 6/10/14px increments.

| Relationship | Dimension |
| --- | --- |
| Icon to label | 6-8px |
| Toolbar controls | 10px, with 8/12px local variants |
| Heading icon to text block | 12-14px |
| Main content padding | 16px below 1024px; 24px at 1024px and above |
| Settings panel gap | 20px |
| Menu split-view gap | 16px below 1024px, 20px at 1280px and above |
| Card grid gap | 20px (24px for dashboard sections) |
| Standard card header padding | 24px horizontal, 16px vertical |
| List toolbar | 24px horizontal, 12px vertical, 60px minimum height |
| Compact toolbar (`CardBar`) | 24px horizontal, 12px vertical, 61px minimum height |
| Modal header | 24px horizontal, 16px vertical |
| Modal body / footer | 24px horizontal; 20px vertical body, 14px footer |
| Drawer header | 20px horizontal, 56px high |
| Normal panel content padding | 24px |
| Table panel content padding | 0 |
| Internal explanation card | 12-16px |
| Table cell horizontal padding | 16px; first and last cells 24px |
| General table cell vertical padding | 12px |
| Fixed 56px row vertical padding | Commonly 8px |
| Assistant panel padding | 16px header/footer, 12px history list |

Do not combine a nominal 56px row, multi-line text, and excessive padding that increases its actual height. General data rows are content-driven: a single-line row is roughly 45px, a two-line identity cell about 61-65px, and only the fixed-height editing pattern is allowed to demand 56px.

## 4. Borders, radii, and shadows

| Element | Radius | Boundary |
| --- | --- | --- |
| Main card / dashboard metric card | 16px | 1px `#E6EAF0` |
| Internal card / section card | 12px | 1px `#E2E8F0` |
| Category item, 40px title icon tile, list row group | 12px | 1px light slate or transparent |
| 36px category icon tile | 8px | 1px light slate |
| Control / ordinary navigation item | 8px | 1px light slate or transparent |
| Tag / badge / small icon button | 6px | Optional semantic border |
| Standard modal / floating detail drawer | 16px | 1px `#E2E8F0` |
| Flush drawer | 0 on the outer edge | 1px left boundary |
| Assistant panel | 16px | 1px light slate |
| Avatar / dot / collapse button | 50% | Context dependent |
| Page-header back control | 8px, 28px square | 1px light slate |
| Modal header icon slot | 8px, 32px square | 1px light slate |

The sidebar right boundary, card boundaries, and control borders are solid one-pixel lines. Data rows use thin solid horizontal separators with no default cell grid. Avoid mixing a dashed boundary into a surface that otherwise uses solid lines; the only dashed border in the system is the file drop zone.

Shadow tokens:

```css
/* ordinary control */
box-shadow: 0 1px 1px 0 rgba(15, 23, 42, .03);
/* card */
box-shadow: 0 1px 2px 0 rgba(15, 23, 42, .04);
/* popover */
box-shadow: 0 10px 32px -8px rgba(15, 23, 42, .16),
            0 2px 6px -2px rgba(15, 23, 42, .06);
/* modal, drawer, assistant */
box-shadow: 0 24px 48px -12px rgba(15, 23, 42, .22),
            0 4px 12px -4px rgba(15, 23, 42, .08);
```

Strong shadows belong to overlays, not every table region. Table cards use the 2px ambient shadow. Toasts use the popover shadow.

## 5. Icons and motion

- Navigation: Lucide icons, 18-20px in the expanded sidebar, 20px in the mini rail, inside a 22px slot.
- Page-heading icons: 22px inside a 40px tile with a 12px radius and 1px light border. Do not add a saturated background behind every title icon.
- Row actions: 15-17px icons in 28-32px buttons. Toolbar icons: 14-16px in 36px controls.
- Copy icons: 13px. Empty state: 24px slate icon in a 48px white bordered tile.
- Keep stroke weight, viewBox, and optical size consistent. Equivalent local SVGs are allowed; an icon runtime is not required. Do not substitute emoji for generic operation icons.
- Use one icon family. The `Icon` registry maps semantic names to Lucide; do not mix a second icon package into the same surface.

| Feedback | Duration / movement |
| --- | --- |
| Row hover | 100-120ms color transition |
| Control hover/focus | 150ms |
| Navigation color, panel width | 200ms |
| Sidebar width and content offset | Synchronized 300ms ease-in-out |
| Navigation group collapse | 300ms grid-row transition |
| Skeleton to content | 280ms ease-out, y:4px to 0 |
| Assistant panel entrance | 180ms, y:14px to 0, scale .975 to 1 |
| Assistant panel exit | 160ms, y:10px, scale .985 |
| Dialog entrance | 180ms, y:-48% to -50%, scale .98 to 1 |
| Dialog exit | 120ms reverse movement |
| Popover / select | 140ms, y:-2px, scale .98 to 1 |
| Drawer entrance / exit | 240ms in, 180ms out |
| Copied confirmation | Restore after approximately 1800ms |
| Progress width | 300ms ease-out |
| Table refresh bar | 1.1s loop; stops for reduced motion |

Motion must not alter final layout dimensions. Do not replay a whole-page entrance on each appended batch. Respect reduced motion; the global stylesheet reduces all animations and transitions to near-zero when the user requests it. Do not add scroll hijacking, elastic bouncing, or long travel animations.

## 6. Mapping to another stack

1. Map semantic values into the target theme, then implement states and geometry.
2. React, Vue, Svelte, Web Components, and server templates must produce equivalent boxes and behavior; implementation class names are not the contract.
3. Use native tables or an accessible virtualized grid as appropriate, preserving column alignment, header relationships, reading order, and keyboard access.
4. Component libraries supply primitives; override their default primary buttons, font sizes, borders, radii, empty states, and pagination behavior.
5. Scope overrides to the application. Do not apply the authenticated shell's scroll constraints to login, error, help, or document pages.
6. Keep the 36px control rhythm and the neutral hover layer even when a library ships a denser or more colorful default.

The accessibility revision uses one neutral `focus` token (`#64748B`, slate-500) across buttons, inputs, navigation, footer controls, tabs and switches. Existing ring widths and offsets are retained; underline tabs add a 2px inset focus ring distinct from selection. Filled destructive controls use red-600 with white text (red-700 on hover), replacing the former low-contrast red-orange fill without changing geometry.
