Codex Compass
=============

This file gives Codex a quick-start cheat sheet: tools, commands, and where to look.

Fast facts
----------
- Package manager: Yarn 4.2.2 (berry; repo ships `.yarn/`). Use `yarn`, not `npm`.
- Node target: 18+ (works with TS 5.4 and MUI 7).
- Sources live in `src/`, tests in `test/`. Built outputs `cjs/`, `esm/`, `storybook-static/` are generated — do not edit.

Core commands
-------------
- Install: `yarn install`
- Lint: `yarn lint`
- Tests: `yarn test` (ts-jest, see `jestconfig.json`, env `jsdom`)
- Build library: `yarn build` (esm + cjs)
- Storybook: `yarn storybook` (dev) / `yarn build-storybook`

Search and edits
----------------
- Read/modify code in `src/`. Ignore duplicates in `cjs/`, `esm/`, `storybook-static/` (also covered by `.rgignore`).
- Main barrel: `src/index.ts` (exports components and types). Shared types: `src/common`; UI components: `src/component/**`.
- For prop examples and flows, see `src/stories/*.stories.tsx`.

Before changing things
----------------------
- Keep peer compatibility: React 18/19 and MUI 6/7.
- If you touch public API, update exports in `src/index.ts` (and the grouped barrels in `src/exports/`) and adjust stories if needed.
- Prefer running `yarn lint` and `yarn test` after changes; for UI-heavy work, `yarn build-storybook` is helpful when possible.

Notable specifics
-----------------
- Theming comes from `createPneTheme(skin)` and MUI palette extensions (module declarations in `src/index.ts`).
- SearchUI stores state in zustand (`src/component/search-ui/state/*`); filters and table sync via `settingsContextName`.
- Backend-facing types for filters live in `src/common/paynet` and are used across SearchUI. Relevant tests: `test/searchUI.*`.
