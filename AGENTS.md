Codex Compass
=============

This file gives Codex a quick-start cheat sheet: tools, commands, and where to look.

Fast facts
----------
- Package manager: Yarn 4.18.1 (berry; repo ships `.yarn/`). Use `yarn`, not `npm`.
- Development/release runtime: Node 24.22.3 (`.nvmrc`) with its bundled npm (publication needs npm 11.5.1+); Yarn 4.18.1 (TypeScript 6, React 19, MUI 9).
- Sources live in `src/`, tests in `test/`. Built outputs `cjs/`, `esm/`, `storybook-static/` are generated — do not edit.

Core commands
-------------
- Install: `yarn install`
- Lint: `yarn lint`
- Tests: `yarn test` (Jest 30, `@swc/jest`, env `jsdom`; see `jestconfig.json`). SWC only strips the types: `yarn typecheck:tests` checks them.
- Build library: `yarn build` (esm + cjs)
- Type-check public contracts: `yarn typecheck:contracts`
- Type-check stories: `yarn typecheck:stories`
- Storybook: `yarn storybook` (dev) / `yarn build-storybook`
- Storybook in a browser: `yarn storybook:check` builds Storybook and opens every story in headless Chrome in three views (light, dark, near-black skin); it fails on errors and failed play functions. `--baseline origin/master` also lists the stories whose picture changed; `--help` shows the rest.
- Usage map: `yarn usage:map <application checkout>...` reports which public names and props the given applications use and which nobody imports.
- Vulnerability audit: `yarn audit:package` (what an application gets with pne-ui; any advisory fails) and `yarn audit:tools` (everything in the lock file; high and critical fail). Both read `yarn.lock` only. `audit.yml` runs them on a push that touches the dependencies and weekly.

Releases
--------
- Read `docs/releasing.md` before release work. Use the explicit `release:prepare`, `release:send`, and `release:status` commands.
- `release:prepare` changes the local version and creates a local commit/tag. `release:send` pushes the branch and selected release tag to origin, triggering npm publication; treat it as release authorization, not a routine sync.
- `release:send --dry-run` does not push. `release:status` is read-only. Never run a real prepare/send just to check the tooling.
- Branch pushes and pull requests run `ci.yml` (build and every check in one job, `storybook:check` without pictures in another; no publication). CI publication uses the single tag-triggered `publish.yml` (a manual run on the same tag covers a push that created no run); RC goes to `next`, stable to `latest` from `master`.

Search and edits
----------------
- Read/modify code in `src/`. Ignore duplicates in `cjs/`, `esm/`, `storybook-static/` (also covered by `.rgignore`).
- Main barrel: `src/index.ts` (exports components and types). Shared types: `src/common`; UI components: `src/component/**`.
- For prop examples and flows, see `src/stories/*.stories.tsx`.

Before changing things
----------------------
- Keep peer compatibility: React 19 and MUI 9.
- If you touch public API, update exports in `src/index.ts` (and the grouped barrels in `src/exports/`) and adjust stories if needed.
- Prefer running `yarn lint` and `yarn test` after changes; for UI work, run `yarn storybook:check` (it builds Storybook itself), with `--baseline origin/master` when the look may change.
- `storybook:check` takes the picture of a story once its play function is done and the page has been still for 0.6 s; it does not move the clock. A story that changes its look later, on a timer (a slow load), needs a play function that waits for the look its picture is to show; a look that passes (a skeleton) gets a story of its own whose data never arrives.

Notable specifics
-----------------
- Dependencies: `.yarnrc.yml` refuses a version younger than a week (`npmMinimalAgeGate`), and Yarn 4.18 runs no install scripts. When refreshing `yarn.lock`, keep `@mui/*` and `@emotion/*` where they are (`yarn up -R` with the other names): a full re-resolve brings a second `@mui/system` under `@mui/material` and the build fails with TS2883.
- Theming comes from `createPneTheme(skin)` and MUI palette extensions (module declarations in `src/index.ts`).
- SearchUI stores state in zustand (`src/component/search-ui/state/*`); filters and table sync via `settingsContextName`.
- Backend-facing types for filters live in `src/common/paynet` and are used across SearchUI. Relevant tests: `test/searchUI.*`.
