# Contributing

[中文与完整术语表](CONTRIBUTING.md)

Contributions should improve the generic starter, fork workflow, documentation or interaction details. Discuss substantial feature or behavior changes in an issue first. Follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security concerns, follow [SECURITY.md](SECURITY.md) and request private contact without publishing details.

## Setup

Use Node 22+ and pnpm 10. `package.json` pins pnpm 10.8.0; `.nvmrc` selects Node 22.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3300. No backend or environment file is needed. Demo accounts and deployment options are in [README.en.md](README.en.md).

| Command | Purpose |
| --- | --- |
| `pnpm lint` | ESLint; 0 errors / 0 warnings required (`--max-warnings 0`) |
| `pnpm i18n:check` | Dictionary parity, placeholders and source CJK gate |
| `pnpm typecheck` | Strict TypeScript check |
| `pnpm test` | Run Vitest logic unit tests once |
| `pnpm test:watch` | Watch and rerun tests |
| `pnpm test:e2e` | Playwright Chromium browser regressions with automatic build/preview |
| `pnpm test:e2e:ui` | Interactive Playwright UI debugging |
| `pnpm build` | Typecheck and production build |
| `pnpm preview` | Serve the production build locally |

## Changes and pull requests

Read [AGENTS.md](AGENTS.md). For UI work, also read [pilot-ui-spec](skills/pilot-ui-spec/SKILL.md) and the relevant references. Preserve unrelated work and the established design system, component APIs and service boundaries. Pages call services rather than the mock DB. Services recheck permissions. Keep the shared assistant runtime, account isolation, cancellation and metadata-only attachments.

Use Conventional Commits with an optional scope. The project uses concise Chinese subjects; examples and the full workflow are in [CONTRIBUTING.md](CONTRIBUTING.md). Keep unrelated cleanup out of the change. Dependency changes include `pnpm-lock.yaml`.

Before submitting, run:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
```

Verify UI changes in the real running app at **1280×720** and **1440×900**, in zh-CN and en-US, as admin, operator and viewer. Check action columns, document scroll isolation, panel sizes, long lists, keyboard/focus and error recovery. Production preview must send no external or backend requests. Include screenshots and actual results in the PR; identify checks not run.

## Unit tests

Keep pure-logic tests in root `tests/`, mirroring `src/` (for example `tests/agent/commands.test.ts`). The standalone `vitest.config.ts` uses Node and a fixed timezone. Vitest 4.1.12 is pinned because its [official package manifest](https://github.com/vitest-dev/vitest/blob/v4.1.12/packages/vitest/package.json) supports Vite 6 and the full Node 22 line without upgrading Vite or narrowing the project's Node requirement.

`tests/setup.ts` installs a minimal EventTarget-based `window`, `document.documentElement` and in-memory local/session storage before app imports, then clears storage and isolates event listeners for each test. There is no DOM emulator. Import test APIs explicitly from `vitest`. For DB, locale or token singletons, seed storage first, call `vi.resetModules()`, then use dynamic `import()`. Mock network boundaries, and avoid real `delay()` waits. Keep CJK fixtures outside `src/`; do not relax i18n checks. Typecheck and build also check tests and the Vitest config.

Run `pnpm test`, use `pnpm test:watch` during development, or focus a file with `pnpm test tests/agent/commands.test.ts`. CI, Pages and Release run the suite before building. Unit tests complement the real-app UI verification required above.

## Browser end-to-end tests

Run `pnpm test:e2e` when changing authentication, routes, RBAC, navigation, list CRUD, the assistant, internationalization or persistence, and before each milestone. Install the browser once:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Tests live in `e2e/`. The config builds and serves production previews on 3320 (root) and 3321 (`/pilot-admin/`, separate `dist-subpath/` output); no dev server is needed. Local runs can reuse existing previews on these ports; stop old previews after app/config changes to avoid testing stale builds. When several worktrees run E2E in parallel, set `E2E_PORT` / `E2E_SUBPATH_PORT` to other ports so one worktree never reuses another's preview. Chromium is the only browser. Each test gets a fresh context and signs in through the UI without shared authentication storage. Fixtures reject external/backend requests and fail on console errors or page errors. Prefer role/label locators and imported locale strings; use web-first assertions without fixed sleeps.

Use `pnpm test:e2e:ui` to inspect steps and rerun tests, or `pnpm test:e2e e2e/users.spec.ts --project=root` to focus a journey. CI retries failures once and records traces. To record locally, run `pnpm test:e2e --trace on`, then `pnpm exec playwright show-trace test-results/<test-directory>/trace.zip`. CI runs E2E after engineering checks, including fork PRs, and uploads `playwright-report/` and `test-results/` on failure. Download the artifact and open it with `pnpm exec playwright show-report playwright-report`. Pages/Release do not repeat E2E.

E2E complements Vitest and the manual real-page checks at **1280×720 / 1440×900** with **admin / operator / viewer**; retain bilingual checks and visual review. Record actual results and coverage limits in the PR.

## Internationalization

Visible system text lives in `src/i18n/locales`. zh-CN literals define the typed keys; en-US must have the same keys and placeholders. React uses `useT()`; services and event handlers use `t()` at call time. Store stable codes rather than translated labels in metadata and state. Keep user data and saved conversations unchanged when the locale switches.

Use short semantic camelCase key segments, at most 24 characters each, and reuse identical wording from `common`. Preserve complete `{placeholder}` sentences. Do not widen the CJK exemptions or pending list to bypass the gate. See the [Chinese contribution guide](CONTRIBUTING.md#国际化约定与术语) for terminology and detailed rules.
