/** Телефонная вёрстка панели фильтров: критерий в две строки, действия переносятся. */
export const SEARCH_UI_FILTERS_PHONE_MEDIA = '@media (max-width: 599px)'

/** Браузеры без subgrid получают колонку названий фиксированной ширины. */
export const SEARCH_UI_FILTERS_NO_SUBGRID = '@supports not (grid-template-columns: subgrid)'

/** Зазор между значками сброса и удаления (UI Kit: две кнопки 32px в колонке 68px). */
export const SEARCH_UI_FILTERS_ICON_GAP = '4px'

/**
 * Колонки сетки панели (UI Kit Filter row): 68px под два значка 32px с зазором между ними,
 * названия по самому длинному критерию, но не шире 240px; значения занимают остальное.
 */
export const SEARCH_UI_FILTERS_COLUMNS = '68px fit-content(240px) minmax(0, 1fr)'

/** То же без subgrid: каждая строка — своя сетка, поэтому колонка названий фиксированная. */
export const SEARCH_UI_FILTERS_FALLBACK_COLUMNS = '68px 180px minmax(0, 1fr)'

export const SEARCH_UI_FILTERS_COLUMN_GAP = '16px'
