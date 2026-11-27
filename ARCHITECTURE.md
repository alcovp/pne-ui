# Architecture

## Layout

- `src/index.ts`: the public API. It re-exports the barrels of `src/exports/` (one per area) and declares the MUI module extensions (the palette, the `large` field size, the `soft` button).
- `src/common`: types and helpers without React. `pne` has `ensure`, `exhaustiveCheck`, `Order` and the zustand setter types; `paynet` has the backend-facing types and guards (`type.ts`), the autocomplete options and `Skin`; `responsive` has the breakpoints.
- `src/component`: the components.
  - Fields: `PneField`, `PneTextField`, `PneCheckbox`, `PneSwitch`, `dropdown/` (the select and the autocompletes), `date/` (the pickers).
  - Windows and messages: `PneModal`, `PneModalActions`, `confirm/`, `overlay/` (`OverlayHost`, toasts, the operation centre, API errors), `PneCoachmark`, `PneBanner`.
  - `table/`: `PneTable` over `AbstractTable`, the cells, pagination, selection, `column-settings/` and the `useTable` hook.
  - `search-ui/`: the filter panel (`filters/`), the entity picker (`multiget_select/`) and `SearchUI`, which joins the panel to a table.
  - `non-abstract-entity-selector/`, `PneBreadcrumbs`.
- `src/stories`: one block per component, `pne-ui/<Component>`.
- `test/` (Jest), `type-tests/` (compile-only contracts of the public API), `test-release/` (the release scripts, `node --test`).
- `scripts/`: the release, `storybook:check` and `usage:map`. `.storybook/`: the test skins (`skins.ts`) and the page the stories stand on (`hostPage.tsx`).

## Theme

- `createPneTheme(skin, {colorMode})` in `src/createTheme.ts` takes nothing else. `PneThemeProvider` holds the colour mode in React only; saving it is the application's job.
- The skin gives one brand colour. `brandRamp.ts` turns it into the steps 0…950; `themeColors.ts` has the neutrals of the light and the dark mode and the status colours.
- Colours reach the components as roles in `theme.palette.pne` (`PneSemanticPalette`); each `src/*Palette.ts` builds the roles of one component family. `resolvePneSemanticPalette(theme)` gives them under a plain MUI theme as well.
- The stock MUI components (`Button`, `IconButton`, `Chip`, `Radio`, `Tooltip`, `ToggleButtonGroup`, `Typography`) have no wrappers: the theme draws them from the `src/*Look.ts` files.
- `actionSpacing.tsx`: the gaps between buttons and between button groups, see `docs/action-spacing.md`.

## SearchUI

- Every mounted `SearchUI` or `SearchUIFilters` owns its zustand store (`search-ui/filters/state`).
- `settingsContextName` names the instance. The conditions and the last applied criteria stay in memory under it and come back after a route remount; it also prefixes what the application persists. Only the user's search state is kept: callbacks, configuration, loaded data and table rows are made anew.
- `SearchUI` turns the criteria into request parameters with `createSearchParams` and calls `searchData`.
- The application gives its services and defaults through `SearchUIProvider`.
