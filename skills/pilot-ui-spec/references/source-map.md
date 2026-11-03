# Implementation Evidence and Interpretation

## Scope

This package describes the interface implemented in this repository. Evidence comes from source inspection and browser measurements at 1440x900 and 1280x720. All paths below are relative to the repository root; the specification does not require any external project to exist. The reference HTML is a synthetic demonstrator, not an exported screenshot.

The package separates observable design intent, current implementation variants, and reliability improvements needed for reuse. Where a rule describes a pattern the repository does not implement yet, the reference marks it *no reference implementation* rather than implying a screen exists.

## Rule-area index

| Rule area | Primary implementation files |
| --- | --- |
| Shell geometry, sidebar, navigation states | `src/components/layout/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/nav/`, `src/index.css` |
| Colors, type, radii, shadows, motion | `tailwind.config.js`, `src/index.css`, `src/main.tsx` |
| Cards, toolbars, page headers | `src/ui/card.tsx`, `src/components/common/PageHeader.tsx` |
| Buttons, inputs, select, form, selection controls | `src/ui/button.tsx`, `src/ui/input.tsx`, `src/ui/select.tsx`, `src/ui/form.tsx`, `src/ui/controls.tsx` |
| Tables, virtualization, fixed columns | `src/ui/table.tsx`, `src/ui/data-table.tsx`, `src/components/common/FixedTable.tsx`, `src/hooks/useFixedRowVirtualizer.ts` |
| Infinite loading, query state, prefetch | `src/hooks/useInfinitePage.ts`, `src/hooks/useInfiniteScrollLoader.ts` |
| Dialogs, drawers, toasts, file drop zone | `src/ui/modal.tsx`, `src/ui/message.tsx`, `src/ui/file-drop-zone.tsx` |
| Assistant panel, runtime, session history, Agent page | `src/components/assistant/AssistantRuntime.tsx`, `useAssistantChat.ts`, `AssistantUI.tsx`, `MarkdownRenderer.tsx`, `src/agent/AgentPage.tsx`, `src/agent/AgentWorkspace.tsx`, `src/store/assistantStore.ts` |
| Pages and compositions | `src/pages/users/index.tsx`, `src/pages/roles/index.tsx`, `src/pages/menus/index.tsx`, `src/pages/examples/crud/`, `src/pages/audit-logs/index.tsx`, `src/pages/profile/`, `src/pages/settings/index.tsx`, `src/pages/dashboard/index.tsx`, `src/pages/login/index.tsx` |
| Global search | `src/components/search/GlobalSearch.tsx`, `src/components/search/GlobalSearchPalette.tsx` |
| Permissions and menus | `src/config/menus.ts`, `src/routes/routeModules.ts`, `src/routes/access.ts`, `src/mock/permissionCatalog.ts`, `src/mock/access.ts`, `src/store/authStore.ts` |

## Evidence map

| Location | What it establishes |
| --- | --- |
| `src/index.css` | Layout variables (224/88/56), font stack, white canvas, 14px scrollbars, assistant entrance/history animations, reduced-motion handling |
| `tailwind.config.js` | Brand and status palettes, custom gray scale, `line` tokens, radii, shadows, dialog/popover/drawer keyframes |
| `src/main.tsx` | Local Fontsource imports: Open Sans Variable, Noto Sans SC 400/500/600, JetBrains Mono 400/500/600 |
| `src/App.tsx` | Application providers, error boundary, tooltip provider, toaster, modal host |
| `src/components/layout/AppLayout.tsx` | White fixed shell, sidebar offset, 16/24px main padding, route guards, Agent return banner |
| `src/components/layout/Sidebar.tsx` | 224/88px navigation, 64px brand area, search trigger, assistant/help/account footer |
| `src/components/layout/AccountMenu.tsx` | 240px account dropdown, 32px avatar, menu items, danger sign-out |
| `src/components/nav/` | Expanded and mini navigation, 40/36/58px geometry, neutral active states, brand icon signal |
| `src/components/common/PageHeader.tsx` | 20px/600 title, 28px back control, 13px description and meta, 10px action gaps |
| `src/components/common/PageSkeleton.tsx` | Route skeleton with 52px rows and a toolbar placeholder |
| `src/components/common/EmptyState.tsx` | 48px icon tile, 14px/500 title, 12px description, centered layout |
| `src/components/common/CopyButton.tsx` | 13px copy control, event isolation, 1800ms success state, secret-safe toast |
| `src/components/common/FixedTable.tsx` | Card-filling table wrapper that enables row windowing and prefetch |
| `src/ui/card.tsx` | 16px card, 15px/600 title, `CardToolbar`, `ListToolbar`, `CardBar` paddings |
| `src/ui/button.tsx` | Neutral outlined default, slate-900 primary, filled destructive, ghost/subtle/danger variants, sizes |
| `src/ui/input.tsx` | 36/32/40px inputs, slate focus halo, clear and count affordances, search prefix |
| `src/ui/select.tsx` | 36px combobox, bounded 256px menu, neutral selected state, forwarded ARIA attributes |
| `src/ui/form.tsx` | Vertical form layout, stable label/control associations, ARIA error wiring, registered-control focus on validation failure |
| `src/ui/controls.tsx` | Switch, checkbox, number input, alert, progress, tag geometry and states |
| `src/ui/badge.tsx` | 22px badge and `CodeTag` with automatic title |
| `src/ui/modal.tsx` | 16px dialog, overlay shadow, async `onOk` pending contract, focus entry, drawer variants |
| `src/ui/table.tsx` | Native table primitives, 44px sticky header, 24px outer cell padding |
| `src/ui/data-table.tsx` | Grid table, sticky header, measured virtualization, skeleton, empty state, infinite sentinel, fixed-column divider |
| `src/ui/tabs.tsx`, `src/ui/roving-tabs.ts` | 2px brand underline tabs, `SectionBar`, shared roving focus and automatic activation for horizontal tabs and vertical rails |
| `src/ui/row-action.tsx` | 28/32px row icon buttons, tooltip labels, disabled reasons |
| `src/ui/file-drop-zone.tsx` | Dashed neutral drop zone, keyboard activation, loading/disabled states |
| `src/ui/message.tsx` | Top-center Sonner toaster, 3s duration, white 12px card |
| `src/hooks/useInfinitePage.ts` | 20-record pages, stable-ID merge, version isolation, append-error retry, scope reset |
| `src/hooks/useInfiniteScrollLoader.ts` | 1200px / 0.5 prefetch threshold, real-scroller resolution, passive listener, observer containment |
| `src/hooks/useFixedRowVirtualizer.ts` | Fixed-row range math, overscan 8, spacers, resize handling |
| `src/pages/users/index.tsx` | Standard list, 350ms search, 26/22/24% columns, 144px actions, status switch, create/edit/reset dialogs |
| `src/pages/roles/index.tsx` | Standard list, 30/22/18% columns, 920px permission matrix, `refreshMe` after writes |
| `src/pages/examples/crud/index.tsx`, `ProjectFormModal.tsx` in the same folder | Copyable CRUD list, loaded-row checkbox selection and batch actions, permission-gated selection/action columns, localized CSV export, form validation and numeric 409 field errors |
| `src/pages/audit-logs/index.tsx` | Dedicated export permission, combined filters, infinite audit list, independently scrolling detail drawer and trace-ID copy |
| `src/pages/profile/`, `src/api/services/profileService.ts` | Settings workspace with authenticated access and no menu grant, persistent section drafts, shared password form and preferences, read-only access tree |
| `src/pages/menus/index.tsx` | 288/320px tree card, metadata grid, button table, 84px action column, rename dialog |
| `src/pages/settings/index.tsx` | 256/288px category rail, 20px gap, tab semantics, content scroll, save footer, demo reset |
| `src/pages/assistant/index.tsx`, `drafts.ts` | Full-width settings workspace, 256/288px roving category rail, URL selection, shared profile loading/retry, per-section drafts and dirty markers, scoped save/reset footbar, permission gates |
| `src/pages/assistant/sections/registry.ts`, `types.ts` | Ordered lazy section registry, localized metadata, extra permission filtering, form field/save/validation declarations |
| `src/pages/assistant/sections/AgentConfigPanel.tsx`, `ModelCodeCombobox.tsx` | Model table with its own header/create action and scroll region, 460px model dialog, 150-character fields, masked key |
| `src/pages/assistant/sections/IdentitySection.tsx`, `PromptsSection.tsx` | Identity/greeting form with live preview and character counter; maximum six quick prompts with reorder/remove and inline required-field feedback |
| `src/pages/assistant/sections/CommandsSection.tsx`, `src/agent/commands.ts` | Read-only command catalog, bilingual dictionary triggers, argument support and permission metadata; tool execution stays unchanged |
| `src/pages/dashboard/index.tsx` | Main-region scrolling, 2/4-column metrics, 28px values, todo and activity cards |
| `src/pages/login/index.tsx` | 380px centered form, 40px inputs, slate-900 submit, inline errors, demo accounts |
| `src/components/search/GlobalSearchPalette.tsx` | 720px global search, 620px height, 54% list, preview pane, per-user recent history |
| `src/components/assistant/AssistantRuntime.tsx` | Single runtime above the routes, shared panel/Agent state, per-user lifecycle |
| `src/components/assistant/AssistantPanel.tsx` | 440/720px panel, 24px inset, mobile bottom sheet, 16px radius, overlay shadow |
| `src/components/assistant/AssistantHeader.tsx` | 64px panel header, 13px/600 title, icon actions |
| `src/components/assistant/Composer.tsx` | Fixed 48px-minimum textarea, attachment chip, send/stop control |
| `src/components/assistant/SessionHistory.tsx` | Day groups, 13px titles, 11px metadata, sentinel loading, slide-over animation |
| `src/components/assistant/MessageList.tsx` | 640px panel messages, 760px Agent messages, Markdown spacing |
| `src/agent/AgentPage.tsx` | 56px top bar, 260px history rail, 48px toolbar, 792px conversation wrapper, 403 guard |
| `src/api/services/agentService.ts`, `src/api/sse.ts` | Streaming seam, abort support, real-backend adapter |
| `src/api/errors.ts`, `src/api/http.ts` | Shared error identity and unauthorized callback without Axios; importing the HTTP adapter for real services loads Axios and preserves the original error exports |
| `src/mock/agent/` | Mock intent matching, plans, tool registry, RBAC checks |
| `src/config/menus.ts`, `src/mock/access.ts` | Stable menu and button permissions, independent assistant permission group |
| `src/routes/routeModules.ts`, `src/routes/access.ts` | Module-scope page registry, cached lazy/preload loaders, shared page access and landing rules |
| `src/mock/permissionCatalog.ts` | Recursive permission catalog, add-only grants and route-less ancestor closure |
| `src/hooks/usePermission.ts`, `src/components/common/Access.tsx`, `src/hooks/useDataChanged.ts` | Permission primitives and stable assistant data-change subscriptions |

## Conflicts and explicit decisions

| Implementation detail | Interpretation in this specification |
| --- | --- |
| `Card` uses `#E6EAF0`, while controls, modals, and tables use `#E2E8F0` | Document both by role: a 16px surface card uses the slightly cooler `#E6EAF0`; controls and line separators use `line` (`#E2E8F0`) |
| Table skeleton rows are 56px; real rows are about 45px single-line and 61-65px two-line; route skeleton rows are 52px | Skeletons are structural placeholders, not pixel matches |
| `DataTable` estimates 57px per row | The estimate only seeds measured virtualization; real heights win after measurement |
| The table scroller reserves `scrollbar-gutter: stable`, so 1006px of card content yields 992px of usable width at 1280 | Quote the usable width when checking column fit; include the gutter in column calculations |
| Settings pages use a side-by-side split with no mobile stacking | Specified as a desktop composition; mobile fallback is marked as a portability completion |
| The gray-200 palette value is `#F4F6F8`, but every shell paints white | White is the baseline; do not introduce a gray application canvas |
| Modal footer OK is outlined, including danger confirmation | Dialogs use outlined actions; filled primary is reserved for login, assistant confirmation cards, and similar single strong actions |
| Toasts are top-center, while many admin systems use top-right | Follow the center placement and 3s duration |
| Sidebar group labels are 12px sentence case, not 11px uppercase | Follow the local 12px sentence-case treatment; mini captions remain 11px |
| Account dropdown is 240px, not the 248px used by some similar shells | Use 240px |
| The composer textarea keeps a 48px minimum and scrolls internally rather than auto-growing | Bounded composer height is the local rule; do not build an auto-expanding input |
| `useInfinitePage` relies on a version guard rather than aborting the HTTP request | Treat request abortion as a portability completion when wiring a real API; stale handlers already cannot mutate the new query |
| Global search is 720x620 with a 54% list column | The preview pane is part of the pattern; keep both panes and the keycap footer |
| Session history is a slide-over in the panel and inline in the Agent rail | Same data and loader, two presentations; do not build a second history service |
| Role permission dialog is 920px, not a round 900px | The measured width wins |
| The Agent page conversation wrapper is 792px with 760px messages | Preserve both widths; the difference is intentional padding |
| The CRUD template implements list row selection and batch deletion | Use the CRUD template for batch actions, form/409 errors, permission-gated columns and CSV |
| `FileDropZone` uses a dashed border while all surfaces are solid | The dashed border is the deliberate file-target exception |
| Assistant settings uses its own registry-driven workspace shell | It follows the shared settings geometry at full available width; System settings keeps its independent behavior |
| The app renders no help center, only an optional help link | Help-center page patterns are omitted rather than invented |

## Fidelity boundary

This specification supplies exact values where the code makes them observable and explicit decisions where evidence conflicts. It does not promise automatic pixel identity across browsers, operating systems, fonts, or component libraries. For pixel-level acceptance, compare the running page at a matched viewport using the same font and icon resources and inspect computed styles.

The reusable identity is the shared geometry, density, colors, component states, and scroll behavior. Business labels, routes, records, and backend integrations remain properties of the target project.

## Assistant loading boundaries

`AppLayout` is a cached route-level split so login does not load the console shell. `AssistantRuntimeLayout` and `useAssistantChat` stay eager above the router outlets; neither lazy host creates a provider. `AIAssistant.tsx` keeps panel keyboard control and loading/error feedback eager. `assistantResources.ts` caches the `AssistantUI.tsx` import shared by the panel and `AgentWorkspace`; the admin shell prefetches it on idle and the footer entry on hover/focus. `Markdown.tsx` shows plain text while loading `MarkdownRenderer.tsx` and its parser dependencies. `agentService.ts` imports the mock engine on demand and checks abort signals after loading, before execution. `src/utils/lazyResource.ts` releases failed imports for inline/service retry without the route chunk auto-reload path.
