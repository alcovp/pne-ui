Codex Compass
=============

This file gives Codex a quick-start cheat sheet: tools, commands, and where to look.

Fast facts
----------
- Package manager: Yarn 4.2.2 (berry; repo ships `.yarn/`). Use `yarn`, not `npm`.
- Development/release runtime: Node 24.14.0 (`.nvmrc`), npm 11.9.0; Yarn 4.2.2 (TypeScript 6, React 19, MUI 9).
- Sources live in `src/`, tests in `test/`. Built outputs `cjs/`, `esm/`, `storybook-static/` are generated — do not edit.

Core commands
-------------
- Install: `yarn install`
- Lint: `yarn lint`
- Tests: `yarn test` (ts-jest, see `jestconfig.json`, env `jsdom`)
- Build library: `yarn build` (esm + cjs)
- Type-check public contracts: `yarn typecheck:contracts`
- Type-check stories: `yarn typecheck:stories`
- Storybook: `yarn storybook` (dev) / `yarn build-storybook`

Releases
--------
- Read `docs/releasing.md` before release work. Use the explicit `release:prepare`, `release:send`, and `release:status` commands.
- `release:prepare` changes the local version and creates a local commit/tag. `release:send` pushes the branch and selected release tag to origin, triggering npm publication; treat it as release authorization, not a routine sync.
- `release:send --dry-run` does not push. `release:status` is read-only. Never run a real prepare/send just to check the tooling.
- Ordinary branch pushes do not run release checks. CI publication uses the single tag-triggered `publish.yml`; RC goes to `next`, stable to `latest` from `master`.

Search and edits
----------------
- Read/modify code in `src/`. Ignore duplicates in `cjs/`, `esm/`, `storybook-static/` (also covered by `.rgignore`).
- Main barrel: `src/index.ts` (exports components and types). Shared types: `src/common`; UI components: `src/component/**`.
- For prop examples and flows, see `src/stories/*.stories.tsx`.

Before changing things
----------------------
- Keep peer compatibility: React 19 and MUI 9.
- If you touch public API, update exports in `src/index.ts` (and the grouped barrels in `src/exports/`) and adjust stories if needed.
- Prefer running `yarn lint` and `yarn test` after changes; for UI-heavy work, `yarn build-storybook` is helpful when possible.

Notable specifics
-----------------
- Theming comes from `createPneTheme(skin)` and MUI palette extensions (module declarations in `src/index.ts`).
- SearchUI stores state in zustand (`src/component/search-ui/state/*`); filters and table sync via `settingsContextName`.
- Backend-facing types for filters live in `src/common/paynet` and are used across SearchUI. Relevant tests: `test/searchUI.*`.
