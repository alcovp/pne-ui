/** Телефонная вёрстка панели фильтров: критерий в две строки, действия переносятся. */
export const SEARCH_UI_FILTERS_PHONE_MEDIA = '@media (max-width: 599px)'

/** Браузеры без subgrid получают колонку названий фиксированной ширины. */
export const SEARCH_UI_FILTERS_NO_SUBGRID = '@supports not (grid-template-columns: subgrid)'

/** Зазор между крестиком и ластиком: зоны нажатия не соприкасаются. */
export const SEARCH_UI_FILTERS_ICON_GAP = '4px'

/**
 * Колонки сетки панели: названия по самому длинному критерию, но не шире 240px;
 * 52px под два значка 24px с зазором между ними; значения занимают остальное.
 */
export const SEARCH_UI_FILTERS_COLUMNS = 'fit-content(240px) 52px minmax(0, 1fr)'

/** То же без subgrid: каждая строка — своя сетка, поэтому колонка названий фиксированная. */
export const SEARCH_UI_FILTERS_FALLBACK_COLUMNS = '180px 52px minmax(0, 1fr)'

export const SEARCH_UI_FILTERS_COLUMN_GAP = '12px'
