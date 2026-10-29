[中文](README.md) | English

# Pilot Admin

A fork-ready React admin starter with a compact design system, mock authentication and RBAC, system pages, an assistant panel and a full-screen Agent workspace. Data and assistant execution stay in the browser: the default demo sends no backend requests and calls no real model. The application UI currently uses Chinese; zh-CN / en-US localization is planned.

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

Edit `src/config/app.ts`, replace `src/components/logo/index.tsx` and `public/favicon.svg`, and adjust the brand tokens in `tailwind.config.js`. Update assistant defaults in the seed and `agentProfileService.ts` if needed. Persisted branding takes precedence: reset demo data to see new seed values. [Full guide](README.md#换品牌).

### Add a page and permissions

Create an exported page, then add its cached loader / lazy export / preload mapping in `src/routes/routeModules.ts` and its admin child route in `src/routes/index.tsx`. Add a stable menu/button definition in `src/config/menus.ts`, an icon mapping when needed, and grants in the role seed or role editor. Services must still check access. [Full guide](README.md#添加页面与权限).

### Add a service or connect a backend

Pages call `src/api/services`; they never access the mock DB directly. Define entity types and deterministic seeds, validate stored shapes, and bump the DB version for incompatible changes. Use the existing paged response and infinite-list helpers. To connect a backend, replace service function bodies with `http` calls and use `runSseStream` for assistant streaming. Authentication and RBAC must be enforced on the server. [Services and mocks](README.md#添加-service-与-mock), [backend integration](README.md#接真实后端).

### Add an assistant tool

Implement `AgentTool` under `src/mock/agent/tools/` and register it in the ordered `index.ts` registry, before fallback. The tool owns choices, confirmations, task state and plan steps; writes go through authorized services. Use the action registry for client dialogs. Preserve the shared runtime, cancellation and account isolation; send file metadata only. [Tools](README.md#新增助手能力), [client actions](README.md#添加助手弹窗操作).

## Environment

Copy `.env.example` to `.env.local` only when needed. All `.env*` files except the example are Git-ignored.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Shared Axios base and the base for relative SSE paths; use a root path or full HTTP(S) URL |
| `VITE_DEV_PROXY_TARGET` | Empty | Optional development proxy target; empty means no proxy |

The dev proxy matches the API base's pathname on same-origin requests, keeps the prefix, changes the origin and disables WebSocket proxying. For `/api` and `http://localhost:8080`, `/api/users` reaches `http://localhost:8080/api/users`. Full API URLs bypass that proxy. Preview has no proxy; setting variables does not replace mock services automatically.

Axios combines `/users` with its API base. SSE paths such as `agent/chat` or `./agent/chat` use the same base; root-relative paths such as `/api/agent/chat` and absolute URLs are used unchanged. Use SSE paths without a leading slash to follow a custom base. Restart dev after changing env files; production values are applied at build time. Never put secrets in client-readable `VITE_*` variables.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on port 3300; no proxy by default |
| `pnpm lint` | ESLint; zero errors required, Hooks/Refresh warnings remain visible |
| `pnpm typecheck` | Strict TypeScript check |
| `pnpm build` | Typecheck and production build |
| `pnpm preview` | Serve the production build locally |

Before submitting, run `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build`. Verify UI changes in the real app at 1280×720 and 1440×900, including all three roles, scrolling, focus and error recovery. Preview must make no external or backend requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## Demo storage and reset

Use System settings → Demo data → Reset demo data to restore the seed and clear assistant drafts/cache. The current DB key is `pilot-admin:mock-db:v3`; each user retains up to 60 sessions, each session up to 200 messages, and each message up to 16000 characters. [Storage details](README.md#重置与存储边界).

## Roadmap

Upcoming milestones cover a page registry and permission catalog sync, zh-CN / en-US localization, audit logs, a standard CRUD template, a profile page, and UX/performance improvements. These are planned features, not current capabilities.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md). Mock authentication and tokens are not a security boundary; use GitHub's private vulnerability reporting for security issues.

## License

Project code is licensed under [MIT](LICENSE). Third-party dependencies retain their own licenses.
