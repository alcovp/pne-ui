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
- Theming: `createPneTheme.ts` builds an extended MUI theme from `Skin` (`common/paynet/skin`); `usePneTheme.ts` is a convenience hook.
- Stories: `src/stories/*.stories.tsx` show props and usage patterns.
- Tests: `test/` — Jest + ts-jest; currently cover parts of SearchUI (store/utils) and shared helpers.

Key flows
---------
- SearchUI:
  - Criteria live in the zustand store (`state/store.ts`) as `searchCriteria`.
  - Filters render via `SearchUIFilters` and push updates into the store.
  - Table uses `PneTable` + `useTable`: criteria become request params via `createSearchParams`, then `searchData` is called.
  - `settingsContextName` is used as a key-prefix for persisted settings/context.
- Theming:
  - `createPneTheme(skin, overrides?)` injects `skin` and extends the palette (`pneNeutral`, `pnePrimaryLight`, `pneAccentuated`, etc.) via module declarations in `src/index.ts`.
  - MUI components (`MuiIconButton`, `MuiButton`, `MuiToggleButtonGroup`) define styleOverrides for custom colors.

Working with the public API
---------------------------
- Exports are grouped via `src/index.ts` and the sub-barrels in `src/exports/`. When adding/renaming components, update exports and stories accordingly.
- Peer dependencies target React 18/19 and MUI 6/7 — keep compatibility in mind.

Navigation tips
---------------
- Backend-facing schemas/types: `src/common/paynet/schema.ts` and matching types in `type.ts`.
- Stories show prop interplay; table header/row factories (`createTableHeader`, `createTableRow`) are demonstrated in `src/stories/PneTable.stories.tsx`.
