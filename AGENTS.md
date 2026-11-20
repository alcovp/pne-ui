# pne-ui

React component library on MUI. Sources are in `src/`, tests in `test/`, type contracts of the public API in `type-tests/`. `cjs/`, `esm/` and `storybook-static/` are generated: do not edit them. `ARCHITECTURE.md` maps the code; `README.md` is the reference for applications.

## Commands

Node comes from `.nvmrc`, Yarn from `packageManager`; use `yarn`, not `npm`.

- `yarn release:check`: the build, every check (lint, Jest, the type checks of the API, contracts, stories and tests) and the package archive. It changes nothing in git or npm. CI runs the same checks as `yarn check`, and `storybook:check --no-pictures`.
- `yarn test <file>`: one test file. There are no jest-dom matchers. SWC only strips the types: `yarn typecheck:tests` checks them.
- `yarn tsc`: the TypeScript 7 compiler.
- `yarn storybook:check`: builds Storybook and opens every story in headless Chrome in three views (light, dark, near-black skin); errors and failed play functions fail it. `--baseline origin/master` also lists the stories whose picture changed; `--help` shows the rest.
- `yarn usage:map <application checkout>...`: which public names and props the applications use and which nobody imports.
- `yarn audit:package`, `yarn audit:tools`: advisories in what an application installs and in the whole lock file.

## Releases

See `docs/releasing.md`. `yarn release:prepare` makes a local version commit and tag. `yarn release:send` pushes the branch and the tag, and the pushed tag publishes to npm. `release:send --dry-run` and `release:status` change nothing.

## Traps

- Two TypeScript packages. `typescript-7` (the native compiler) builds the library and runs every type check. `typescript` stays 6 for the tools that need the compiler API: typescript-eslint, `scripts/usage-map.mjs`, Storybook, the IDE. Drop 6 when typescript-eslint accepts 7.
- Refreshing `yarn.lock`: keep `@mui/*` and `@emotion/*` where they are (`yarn up -R` with the other names). A full re-resolve brings a second `@mui/system` under `@mui/material`, and the build fails with TS2883. `.yarnrc.yml` refuses versions younger than a week.
- `storybook:check` takes the picture of a story once its play function is done and the page has been still for 0.6 s. A story whose look changes later on a timer needs a play function that waits for that look; a look that passes (a skeleton) gets a story of its own whose data never arrives.
- jsdom ignores CSS specificity: the tests read colours and sizes from the rules in `document.styleSheets`.
- A public name is exported from its barrel in `src/exports/`; `src/index.ts` re-exports the barrels and holds the MUI module declarations.
