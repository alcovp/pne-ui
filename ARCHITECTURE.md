Architecture Map
================

Purpose
-------
`pne-ui` is a React component kit (MUI + TypeScript) for Payneteasy projects. The public API is assembled via the main barrel `src/index.ts`; builds land in `esm/` and `cjs/`.

Layers and directories
----------------------
- `src/common`: types, utilities, and validation schemas.
  - `common/pne`: core helpers (`ensure`, `exhaustiveCheck`, `Order`, Zustand setter types).
  - `common/paynet`: domain types and zod schemas (`AbstractEntity`, `AutoCompleteChoice`, pagination requests).
- `src/component`: UI components.
  - Base controls: `PneButton`, `PneTextField`, `PneCheckbox`, `PneSwitch`, modals.
  - Dropdown/autocomplete: `component/dropdown`.
  - Table: `component/table/*` (core `AbstractTable`, header/row factories, sorting/pagination, helper `useTable`).
  - SearchUI: `component/search-ui/*` stitches filter panel and results table, using zustand (`state/*`) to hold criteria.
  - Entity selectors: `component/non-abstract-entity-selector`.
- Theming: `createTheme.ts` builds light/dark MUI themes and semantic tokens from `Skin`; `PneThemeProvider.tsx` scopes a controlled or in-memory color mode without owning persistence; `usePneTheme.ts` is a convenience hook.
- Stories: `src/stories/*.stories.tsx` show props and usage patterns.
- Tests: `test/` — Jest + ts-jest; currently cover parts of SearchUI (store/utils) and shared helpers.

Key flows
---------
- SearchUI:
  - Each mounted SearchUI/SearchUIFilters owns an instance-scoped zustand store.
  - Filter conditions and the last applied criteria are retained in memory by `settingsContextName` and restored after route remounts.
  - Retained snapshots contain user search state only; callbacks, configuration, async data, and table results are recreated.
  - Filters render via `SearchUIFilters` and push updates into the store.
  - Table uses `PneTable` + `useTable`: criteria become request params via `createSearchParams`, then `searchData` is called.
  - Controlled `tableViews` can provide a per-view `searchDataKey` for external request inputs. The combined view/data identity invalidates stale rows and requests; `tableStateOnActivate='restore'` recalls page and sort independently for identities visited by the mounted table.
  - A view option `onClick` runs for both inactive and selected views. Consumers may call `preventDefault()` to open configuration before changing the controlled view.
  - `settingsContextName` is used as a key-prefix for persisted settings/context.
- Theming:
  - `createPneTheme(skin, {colorMode, ...overrides})` injects `skin`, derives accessible `palette.pne` surface/brand roles at runtime, and retains the compatibility palettes (`pneNeutral`, `pnePrimaryLight`, `pneAccentuated`, etc.) via module declarations in `src/index.ts`.
  - `palette.pne.border.subtle` is the low-emphasis separator for sections on `background.paper`; modal and coachmark header/footer dividers consume it without weakening the global MUI divider role.
  - `createPneThemeOptions` exposes the pure options contract; `PneThemeProvider` owns only React/MUI context, while applications own profile or other persistence.
  - MUI components (`MuiIconButton`, `MuiButton`, `MuiToggleButtonGroup`) define styleOverrides for custom colors.

Working with the public API
---------------------------
- Exports are grouped via `src/index.ts` and the sub-barrels in `src/exports/`. When adding/renaming components, update exports and stories accordingly.
- Peer dependencies target React 19 and MUI 9. Earlier majors are outside the supported contract.

Navigation tips
---------------
- Backend-facing schemas/types: `src/common/paynet/schema.ts` and matching types in `type.ts`.
- Stories show prop interplay; table header/row factories (`createTableHeader`, `createTableRow`) are demonstrated in `src/stories/PneTable.stories.tsx`.
