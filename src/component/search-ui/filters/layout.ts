/**
 * Расположение панели фильтров {@link SearchUIFilters}.
 *
 * - `header` — полоса «Filters» над критериями, действия справа в ней (по умолчанию).
 * - `compact` — без полосы: критерии и строка действий лежат в одной сетке, кнопки
 *   [Saved filters] [Add filter] [Search] стоят под критериями по колонке значений, шеврон
 *   свёртки — в той же строке слева, ластик и крестик критерия — в колонке между его
 *   названием и значением (крестик левее, ластик у значения).
 */
export type SearchUIFiltersLayout = 'header' | 'compact'

/** Телефонная вёрстка панели: критерий в две строки, действия переносятся. */
export const SEARCH_UI_FILTERS_PHONE_MEDIA = '@media (max-width: 599px)'

/** Браузеры без subgrid получают колонку названий фиксированной ширины. */
export const SEARCH_UI_FILTERS_NO_SUBGRID = '@supports not (grid-template-columns: subgrid)'

/**
 * Колонки компактной сетки: названия по самому длинному критерию, но не шире 240px;
 * 48px под два значка 24px; значения занимают остальное.
 */
export const SEARCH_UI_FILTERS_COMPACT_COLUMNS = 'fit-content(240px) 48px minmax(0, 1fr)'

/** То же без subgrid: каждая строка — своя сетка, поэтому колонка названий фиксированная. */
export const SEARCH_UI_FILTERS_COMPACT_FALLBACK_COLUMNS = '180px 48px minmax(0, 1fr)'

export const SEARCH_UI_FILTERS_COMPACT_COLUMN_GAP = '12px'
