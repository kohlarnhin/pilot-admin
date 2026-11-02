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
| `pnpm lint` | ESLint; zero errors required |
| `pnpm i18n:check` | Dictionary parity, placeholders and source CJK gate |
| `pnpm typecheck` | Strict TypeScript check |
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
pnpm build
```

Verify UI changes in the real running app at **1280×720** and **1440×900**, in zh-CN and en-US, as admin, operator and viewer. Check action columns, document scroll isolation, panel sizes, long lists, keyboard/focus and error recovery. Production preview must send no external or backend requests. Include screenshots and actual results in the PR; identify checks not run. There is currently no additional test framework.

## Internationalization

Visible system text lives in `src/i18n/locales`. zh-CN literals define the typed keys; en-US must have the same keys and placeholders. React uses `useT()`; services and event handlers use `t()` at call time. Store stable codes rather than translated labels in metadata and state. Keep user data and saved conversations unchanged when the locale switches.

Use short semantic camelCase key segments, at most 24 characters each, and reuse identical wording from `common`. Preserve complete `{placeholder}` sentences. Do not widen the CJK exemptions or pending list to bypass the gate. See the [Chinese contribution guide](CONTRIBUTING.md#国际化约定与术语) for terminology and detailed rules.
