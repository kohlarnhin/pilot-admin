[中文](README.md) | English

# Pilot Admin

A fork-ready React admin starter with a compact design system, mock authentication and RBAC, system pages, an assistant panel and a full-screen Agent workspace. Data and assistant execution stay in the browser: the default demo sends no backend requests and calls no real model. The shell, admin pages, service messages, demo data, assistant conversations and tools support zh-CN / en-US.

## Features

- React 19, strict TypeScript, Vite 6, Tailwind 3.4, Radix, zustand 5 and react-router 7.
- Fixed sidebar, independent scroll regions, shared controls, a component gallery, virtualized infinite lists and route preloading.
- Dashboard, global search, user / role / menu / settings pages, menu and button permissions.
- One assistant runtime shared by the panel and Agent mode, with account-isolated drafts and sessions, confirmations, plans and metadata-only attachments.
- Replaceable services, HTTP / SSE integration seams, persistent local demo data, ESLint and build CI.

## Quick start

Use Node 22+ and pnpm 10. The repository pins pnpm 10.8.0 through `packageManager`; `.nvmrc` selects Node 22.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3300. No `.env` file or backend is required.

| Account | Password | Access |
| --- | --- | --- |
| `admin` | `admin123` | All pages, actions, assistant and model settings |
| `operator` | `operator123` | Dashboard, user read/edit, examples and assistant; no user create/delete |
| `viewer` | `viewer123` | Dashboard and examples; no assistant |

On first login, eligible accounts can choose the admin console or Agent mode. Ctrl/⌘K opens search; Ctrl/⌘J opens the assistant. Account preferences can remember the entry mode. The demo seeds 150 users, three roles and 25 admin sessions, including a 60-message conversation. Writes persist in browser localStorage; this is not a server account system.

## Directory overview

```text
src/config/                Branding and static menu/button definitions
src/ui/                    Shared controls and feedback
src/components/            Layout, navigation, search and assistant runtime/UI
src/agent/                 Full-screen Agent and entry preferences
src/api/services/          The only data seam; currently backed by mocks
src/api/http.ts, sse.ts    Real-backend integration helpers; unused by default
src/mock/                  Typed seed, local DB and agent engine/tools
src/hooks/, store/         Paging, virtualization and application state
src/pages/, routes/        Pages, routing and cached lazy loaders
src/types/, utils/         Shared types and utilities
skills/pilot-ui-spec/      Portable UI contract and reference assets
```

## Extend the starter

Read [AGENTS.md](AGENTS.md) and the [UI specification](skills/pilot-ui-spec/SKILL.md) before changing the interface. Keep the visual system and existing dependencies.

### Rebrand

Edit `src/config/app.ts`, replace `src/components/logo/index.tsx` and `public/favicon.svg`, and adjust the brand tokens in `tailwind.config.js`. The bilingual default description is `common.appDescription` in the locale dictionaries; custom descriptions saved in settings keep their original text. Update assistant defaults in the seed and `agentProfileService.ts` if needed. Persisted branding takes precedence: reset demo data to see new seed values. [Full guide](README.md#换品牌).

### Add a page and permissions

Adding a page takes three steps:

1. Export the page from `src/pages/<feature>/index.tsx`.
2. Add one `definePage({ path, load })` entry to `adminPages` in `src/routes/routeModules.ts`. Routes and cached hover/focus preloading derive from it.
3. Add one menu entry with a stable ID, matching route and an icon name from `src/components/icon/registry.ts` to `src/config/menus.ts`. No route or icon-path mapping is needed elsewhere.

The default `access: 'menu'` checks an enabled, visible granted menu. Add `requires: ['feature:manage']` for extra permissions, or use `access: 'authenticated'` for a signed-in page without a menu. Guards, navigation, search and landing routes share `src/routes/access.ts`. Use `usePermission`, `useCan` or `<Access>` for buttons, and `useDataChanged` to refresh after assistant writes. Services must still check access.

Mock catalog sync is recursive, monotonic and add-only. Only the seeded admin role has the internal `auto_grant` flag; newly created roles do not. New permissions are granted on DB load/storage reload without resetting demo data or changing role seeds. Revoked old permissions stay revoked. All roles gain missing route-less ancestors of their existing menus; routed ancestors are never granted implicitly. Removed definitions remain inert and counts reflect current definitions. Other roles need explicit grants; real backends decide and enforce grants server-side. Custom menu names override defaults. [Full guide](README.md#添加页面与权限).

### Add a service or connect a backend

Pages call `src/api/services`; they never access the mock DB directly. Define entity types and deterministic seeds, validate stored shapes, and bump the DB version for incompatible changes. Use the existing paged response and infinite-list helpers. To connect a backend, replace service function bodies with `http` calls and use `runSseStream` for assistant streaming. Authentication and RBAC must be enforced on the server. [Services and mocks](README.md#添加-service-与-mock), [backend integration](README.md#接真实后端).

### Add an assistant tool

Add trigger phrases to both `agentCommands.ts` dictionaries and use the shared `src/agent/commands.ts` parser for matching and argument extraction. It accepts phrases from both languages, ignores Latin case and enforces command boundaries. `commandPrompt` and stored `prompt:*` choices round-trip while retaining stable choice IDs. Page opening accepts custom names, both default translations and route paths. Implement `AgentTool` under `src/mock/agent/tools/` and register it in the ordered `index.ts` registry, before fallback. The tool owns choices, confirmations, task state and plan steps; writes go through authorized services. Use the action registry for client dialogs. Preserve the shared runtime, cancellation and account isolation; send file metadata only. [Tools](README.md#新增助手能力), [client actions](README.md#添加助手弹窗操作).

## Environment

Copy `.env.example` to `.env.local` only when needed. All `.env*` files except the example are Git-ignored.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Shared Axios base and the base for relative SSE paths; use a root path or full HTTP(S) URL |
| `VITE_DEV_PROXY_TARGET` | Empty | Optional development proxy target; empty means no proxy |

The dev proxy matches the API base's pathname on same-origin requests, keeps the prefix, changes the origin and disables WebSocket proxying. For `/api` and `http://localhost:8080`, `/api/users` reaches `http://localhost:8080/api/users`. Full API URLs bypass that proxy. Preview has no proxy; setting variables does not replace mock services automatically.

Axios combines `/users` with its API base. SSE paths such as `agent/chat` or `./agent/chat` use the same base; root-relative paths such as `/api/agent/chat` and absolute URLs are used unchanged. Use SSE paths without a leading slash to follow a custom base. Restart dev after changing env files; production values are applied at build time. Never put secrets in client-readable `VITE_*` variables.

## Internationalization

Use the login language control or Account menu → Language to switch without reloading. The default is zh-CN, with no browser-language detection. `pilot-admin:locale:v1` persists the selection and synchronizes same-origin tabs.

Feature dictionaries live in `src/i18n/locales/zh-CN/<namespace>.ts` (`as const`, source of truth) and `en-US/<namespace>.ts` (`LocalizedDictionary<typeof source>`). Register new namespaces in both roots. React components call `useT()`; services/stores can call `t()` to read the current locale at call time. Keys and required `{placeholder}` parameters are inferred from Chinese literals, for example `t('auth.loginTitle', { name: 'My Admin' })`. Static metadata stores keys; translated memoized columns depend on `locale`.

Default menu/action names are localized when mock services materialize them; custom names override them in every locale. HTTP/SSE send `Accept-Language`. Overview todos use stable codes translated at render. Switching clears query caches, refreshes me and notifies `useDataChanged` with a `locale` reason. Infinite lists discard stale responses and refresh the loaded range while preserving scroll where possible. Routes, assistant drafts, panel state and stored content stay intact. Existing imperative dialogs/toasts keep their opening language.

Use plural-neutral English such as `Users: {count}`; there is no plural engine. `formatNumber` and dayjs follow the active locale; explicit date formats remain unchanged. Admin pages, assistant/Agent chrome, mock tools and service messages are bilingual. Errors use the response-time locale; audit actions are stored as codes and translated at render. Stored names and conversations are not retranslated.

Use short semantic keys grouped by purpose, such as `users.toast.created` and `users.deleteDialog.content`, rather than sentence fragments. Each segment must match `/^[a-z][a-zA-Z0-9]*$/` (camelCase) and contain at most 24 characters. Reuse identical shared wording from `common`; keep feature-specific keys when the wording differs. Domain errors live in `serverErrors`, and audit sentences in `audit`. Menu/action IDs stay unchanged; dictionary keys camel-case hyphenated IDs (for example, `user-reset-password` → `button.userResetPassword`).

Locale-specific seed content is a separate `seedText` export in `src/i18n/locales/<locale>/seed.ts`, typed by `SeedText` in `src/i18n/seed.ts`. It supports name arrays and stays outside the `t()` message tree. Initial creation and demo reset use the current locale for role names, user names, site descriptions, model names and example projects. IDs, login names, emails, deterministic ordering stay unchanged; the current DB version is v5. Assistant profile and all 25 conversation seeds use the creation-time locale; the long session retains 60 messages. Switching locale preserves unsaved role permission selections, menu rename input and settings fields while refreshing menu/action names.

Tool replies, choices, plans and action cards use the locale at reply time and are stored as content; switching never retranslates earlier messages or card labels. IDs and execution state stay code-based. Unmodified default profiles read the current locale; explicitly saved profiles remain data via the optional internal `agentProfileCustomized` flag. Unmarked profiles are treated as defaults only when they exactly match known seed profiles.

`pnpm i18n:check` validates camelCase keys (at most 24 characters per segment), dictionary completeness and placeholder parity and scans CJK in strings, templates, JSX and regexes (comments excluded). Exact justified exemptions live in `scripts/i18n-allowlist.json`; `scripts/i18n-pending.json` is now `[]`; the staged-migration mechanism remains available. Obsolete exemptions fail the check. [Full guide](README.md#国际化).

## Audit logs

System → Audit Logs provides combined keyword/module/result filters, virtualized infinite loading, a detail drawer, trace copying and CSV export. Keywords match actor, target, action code and trace ID. Reading requires the page grant; export also requires `audit-log:export`. Only the seeded administrator receives these grants. Overview shows the latest 5 successful entries, excluding `auth.login` and `auth.logout`, through a restricted projection without actor/target IDs, trace IDs, failure reasons or arbitrary params. Each row shows the action sentence above actor and time. Only authorized users see “View all”.

`AuditLog` stores stable action/module/result/reason codes and names as they were at write time. `src/mock/audit.ts` adds an entry to the same `updateMockDb` draft as the business change. Generate one trace ID and pass it to both the log and `response(data, traceId)`; existing void/token interfaces keep their signatures. Never spread inputs or errors into logs: `AuditParamsMap` and `src/audit/catalog.ts` allow only approved counts/status/section codes and profile field names. `recordAuditFailure` records validation/permission rejections using status-derived reason codes, without saving raw errors or replacing the original failure. Persistence errors never trigger a second write. Login failures are recorded separately; logout cleanup always continues. Personal details and preferences use `profile.update`, targeting the current user; `params.fields` contains only `user_name`, `email`, `agent_mode_entry`, deduplicated in that catalog order and translated as a locale-joined list without field values. `settings.update` accepts only `basic`, `security`, `notifications`. Assistant tools reuse audited services.

To add an action, update the typed map, runtime allowlist, both `audit.ts` dictionaries and `src/audit/format.ts`. Wire codes such as `auth.login_failed` map to camelCase message keys such as `audit.action.auth.loginFailed`. Sentences translate at render/export, while recorded names remain data. [Implementation guide](README.md#操作日志).

DB v5 introduces capped `auditLogs` (1000 newest-first entries, 120 historical seed entries) and `exampleProjects` (80 deterministic rows), removes `activities` and resets older demo data once. The CRUD template uses this same schema. Demo reset records its own action in the same persisted write.

CSV exports the current filters, capped at 5000 service rows (1000 currently stored). `src/utils/csv.ts` quotes every cell, doubles quotes, uses CRLF and includes a UTF-8 BOM. Cells beginning with `=`, `+`, `-`, `@`, Tab or CR, including after leading whitespace, receive an apostrophe prefix so spreadsheets open them as text. This also applies to user-provided names.

## Start a module from the CRUD template

Examples → Standard List (`/examples/crud`) demonstrates paged virtualized lists, filters, forms with inline duplicate-code errors, selection, atomic batch deletion and safe CSV. Export deliberately requires page access only; Audit Logs demonstrates a dedicated export permission. Existing v5 databases grant the new module automatically to auto-grant admins. Operator create/edit and viewer read-only defaults appear after resetting demo data. The template collection ships in DB v5, so adding the page needs no version bump.

Follow the ordered [copy checklist](README.md#从模板开始一个新模块): copy entity/status types; add the mock collection, seed text and `isMockDb` validation (bump the version for a new persisted shape); extend audit types, runtime catalog, target validation, format maps and both audit dictionaries; copy the service and server-error namespace; copy the entire page/form folder; copy both locale namespaces and register them; register one `definePage` plus menu/buttons; optionally seed non-admin grants; run all checks and the real-page matrix. Extend the exhaustive module-target map in `auditSeed.ts`; exclude the new module in its action filter if no historical demo entries are needed.

Rename consistently: `ExampleProject` → your entity, `exampleProjects` → your collection/namespace, `exampleProjectService` → your service, `ProjectInput`/`ProjectFilters` and `PROJECT_CODE_EXISTS` → your equivalents, `example:*` → your permissions, `example.*` → your audit codes, and `/examples/crud` → your route. Rename menu/button IDs, dictionary keys, page/form exports and the English source import too. The numeric duplicate-code error is the field-mapping contract; never compare localized error messages.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on port 3300; no proxy by default |
| `pnpm lint` | ESLint; zero errors required, Hooks/Refresh warnings remain visible |
| `pnpm i18n:check` | Dictionary/placeholder parity and source CJK gate |
| `pnpm typecheck` | Strict TypeScript check |
| `pnpm build` | Typecheck and production build |
| `pnpm preview` | Serve the production build locally |

Before submitting, run `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build && pnpm i18n:check`. Verify UI changes in the real app at 1280×720 and 1440×900, including all three roles, scrolling, focus and error recovery. Preview must make no external or backend requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## Demo storage and reset

Use System settings → Demo data → Reset demo data to restore the seed and clear assistant drafts/cache. The current DB key is `pilot-admin:mock-db:v5`. Upgrading from v4 resets demo data once and removes only lower-version DB keys on read; each user retains up to 60 sessions, each session up to 200 messages, and each message up to 16000 characters. [Storage details](README.md#重置与存储边界).

## Roadmap

zh-CN / en-US localization, audit logs and the standard CRUD template are available. Next comes a profile page, followed by UX/performance improvements and documentation updates.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md). Mock authentication and tokens are not a security boundary; use GitHub's private vulnerability reporting for security issues.

## License

Project code is licensed under [MIT](LICENSE). Third-party dependencies retain their own licenses.
