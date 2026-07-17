# pne-ui

[![NPM version][npm-image]][npm-url]
[![Build][github-build]][github-build-url]

Мега обертка над MUI

## Установка

Установите `pne-ui` вместе с peer-зависимостями:

```bash
yarn add pne-ui @emotion/react@^11 @emotion/styled@^11 @mui/material@^7 @mui/system@^7 @mui/x-date-pickers-pro@^7 @mui/icons-material@^7 i18next@^23 react@^18 react-dom@^18 react-i18next@^11
```

Подбирайте версии React и React DOM (`^18` или `^19`) в зависимости от вашего приложения.  
Пакеты MUI поддерживают `^6` и `^7`, установите major-версию, которая совпадает с версией хост-приложения.

Необходимые peer-зависимости и минимальные версии:

- `@emotion/react@^11`
- `@emotion/styled@^11`
- `@mui/material@^6 || ^7`
- `@mui/system@^6 || ^7`
- `@mui/x-date-pickers-pro@^6 || ^7`
- `@mui/icons-material@^6 || ^7`
- `i18next@^23`
- `react@^18 || ^19`
- `react-dom@^18 || ^19`
- `react-i18next@^11`

## Якоря для автотестов

Для нового кода добавляйте якорь непосредственно на существующий DOM-элемент или нужный MUI slot через
`createAutoTestAttributes`. Helper не создаёт дополнительный wrapper и возвращает стабильные
`data-autotest` и, при наличии значения, `data-autotest-value`:

```tsx
import { createAutoTestAttributes } from 'pne-ui'

export const OrdersTable = () => (
    <section {...createAutoTestAttributes('orders-table', 'active')}>
        {/* content */}
    </section>
)
```

Атрибуты присутствуют во всех build modes. `undefined` не добавляет `data-autotest-value`, а `''`, `0` и
`false` сохраняются как явные значения. Используйте только стабильные несекретные идентификаторы; состояние
`disabled`, `checked`, `selected` и похожие состояния проверяйте через нативные DOM/ARIA-свойства.

`AutoTestAttribute` остаётся compatibility API для существующего кода. Он принимает ровно одного React child:

- DOM-элемент получает атрибуты без дополнительного узла;
- custom component обязан передать неизвестные DOM props на нужный элемент;
- React Fragment временно оборачивается в `div` для обратной совместимости.

Поэтому во внутренней реализации новых компонентов библиотеки используйте `createAutoTestAttributes`, а не
wrapper-компонент.

### PneTable

Передавайте `autoTestId` для каждой логической таблицы; если на странице их несколько, значения обязаны быть
уникальными. Существующий внешний root получает `data-autotest="table"` и переданный ID в
`data-autotest-value`. `tableAriaLabel` или `tableAriaLabelledBy` независимо задают пользовательское имя
semantic `<table>` для role-запросов.

```tsx
<PneTable<Order>
    autoTestId="orders"
    tableAriaLabel="Orders"
    data={orders}
    createRow={order => (
        <PneTableRow
            key={order.id}
            {...createAutoTestAttributes('row', order.id)}
        >
            <PneTableCell {...createAutoTestAttributes('cell', 'status')}>
                {order.statusLabel}
            </PneTableCell>
        </PneTableRow>
    )}
    /* остальные props */
/>
```

Идентичность строк и колонок принадлежит caller-коду в `createRow`/`createTableHeader`: используйте
стабильные domain ID и column keys. Библиотека намеренно не выводит их из array index, переведённого текста,
DOM-позиции или пользовательских/секретных данных. Для sortable header передавайте те же `sortOptions` и
`sortIndex` в `PneHeaderTableCell`; MUI выставит `aria-sort` только на активном `<th>`.

Внутренний контракт таблицы:

- пагинации: `data-autotest="pagination"` со значением `top` или `bottom`; action IDs ищутся внутри этого scope;
- загрузка: `aria-busy` на semantic table;
- пустой результат: существующая строка `data-autotest="empty-state"`;
- disabled/checked/selected состояния: только нативные DOM/ARIA-свойства, без test-only копий.

### SearchUI и SearchUIFilters

Передавайте стабильный несекретный `autoTestId` как Selenium scope поискового интерфейса. Если prop не задан,
используется `settingsContextName`. Для нескольких одновременно отображаемых `SearchUI` или самостоятельных
`SearchUIFilters` задавайте разные явные значения, даже если компоненты намеренно используют один
`settingsContextName` для состояния.

`SearchUI` не получает общего test-only root: фильтры и результаты имеют отдельные anchors с одним значением
scope. Таблица ищется от document/page scope, а не внутри `search-filters`:

- `data-autotest="search-filters"` / `data-autotest-value="<scope>"` — панель фильтров;
- `data-autotest="table"` / `data-autotest-value="<scope>"` — таблица результатов;
- `data-autotest="criterion"` / `data-autotest-value="<raw CriterionTypeEnum>"` — существующий root критерия.

Например, очистку критерия `STATUS` в поиске заказов можно найти обычным CSS locator:

```css
[data-autotest="search-filters"][data-autotest-value="orders"] [data-autotest="criterion"][data-autotest-value="STATUS"] [data-autotest="clear-criterion"]
```

Общие действия внутри `search-filters/<scope>`:

- `toggle-filters` — native button; состояние панели находится в `aria-expanded`, связь с панелью — в
  `aria-controls`;
- `clear-all` и `run-search` — реальные кнопки; доступность запуска поиска проверяется через native `disabled`
  (`run-search` одинаков для режимов Search и Refresh);
- `templates` — native button с `aria-expanded` и open-state `aria-controls`;
- `add-filter` — реально кликаемый MUI `role="combobox"`, а не декоративная кнопка над ним; состояние и связь с
  listbox находятся в `aria-expanded` и open-state `aria-controls`;
- `clear-criterion` и `remove-criterion` — native `button type="button"` внутри соответствующего
  `criterion/<raw type>`; remove отсутствует у non-removable predefined-критерия.

Часть roots/actions условна: критерий, `clear-all`, `remove-criterion`, templates и add-filter могут отсутствовать
из-за `config` или текущего состояния. Такое отсутствие является состоянием UI, а не ошибкой locator contract.

Popover и modal рендерятся через React portal вне `search-filters`, поэтому Selenium должен искать их отдельно
по тому же owner scope:

```css
[data-autotest="templates-panel"][data-autotest-value="orders"]
[data-autotest="add-filter-options"][data-autotest-value="orders"]
[data-autotest="template-editor"][data-autotest-value="orders"]
```

`templates-panel` и `template-editor` имеют dialog semantics, а `add-filter-options` — native MUI listbox.
Generated IDs из `aria-controls` не хардкодируйте: при необходимости считывайте ID у trigger во время теста;
стабильным owner locator остаётся `data-autotest` + scope. Строки сохранённых шаблонов отмечены одинаковым
`template-item` без value; внутри используются `select-template` и `remove-template`. Имя шаблона остаётся
видимым пользовательским значением и доступным именем, но намеренно не попадает в `data-autotest-value`.
Icon-only закрытие editor имеет `close-template-editor`; поле имени, Create и Cancel остаются стандартными
required textbox/text buttons и ищутся по role/name внутри scoped editor.

Обычные inputs, text buttons, options, checkboxes и switches ищите по native role/name и проверяйте их native/ARIA
state. Не используйте MUI classes, SVG/path, DOM depth, array index, переведённый текст как технический ID или
сгенерированный `aria-controls` ID.

Полная Selenium-документация, включая матрицу всех 31 критериев, detached portals, date pickers, grouping,
transaction session status и все девять multiget-панелей: [docs/selenium-locators.md](docs/selenium-locators.md).

## OverlayHost

Компоненты, которые используют `overlayActions` напрямую или косвенно, требуют смонтированный
`<OverlayHost />` в приложении-хосте. Это касается и `SearchUI`, потому что `Clear all` использует
undo-snackbar.

Подключайте `OverlayHost` ровно один раз, обычно рядом с корнем приложения:

```tsx
import { OverlayHost } from 'pne-ui'

export const App = () => (
    <OverlayHost>
        <ApplicationRoutes />
    </OverlayHost>
)
```

Важные правила интеграции:
- если `overlayActions.*` вызываются без смонтированного `OverlayHost`, библиотека пишет явный `console.error`, а snackbar не будет виден пользователю;
- если в DOM смонтировано больше одного `OverlayHost`, библиотека пишет явный `console.error`, потому что такая конфигурация дублирует snackbar-ы и может рассинхронизировать их таймеры;
- `OverlayHost` должен подключаться в приложении-хосте, а не внутри отдельных виджетов библиотеки.

## Интеграция SearchUI

### Подключение контекста через `SearchUIProvider`

Компоненты `SearchUI` и его фильтры получают конфигурацию через контекст `SearchUIDefaultsContext`.  
Чтобы отдать реальные источники данных и управлять видимостью критериев, оберните SearchUI в `SearchUIProvider`
и передайте нужные обработчики в проп `defaults`:

```tsx
import {
    SearchUI,
    SearchUIProvider,
    CriterionTypeEnum,
    ExactCriterionSearchLabelEnum,
} from 'pne-ui'

export const TransactionsPage = () => (
    <SearchUIProvider
        defaults={{
            getDefaultCurrency: () => ({ id: 643, displayName: 'RUB' }),
            getCurrencies: fetchCurrencies,
            getMatchLinkedItems: request => api.multiget(request),
            showProjectsCriterion: () => true,
            showManagersCriterion: () => false,
            // Методы ниже нужны для работы шаблонов фильтров (панель Templates)
            // Возвращает список шаблонов поиска для выпадающего списка
            getSearchTemplates: contextName => templatesApi.list(contextName),
            // Сохраняет текущие настройки фильтров под именем шаблона
            saveSearchTemplate: request => templatesApi.save(request),
            // Удаляет ранее сохраненный шаблон
            deleteSearchTemplate: request => templatesApi.remove(request),
            // Проверяет, существует ли шаблон с указанным именем
            searchTemplateExists: request => templatesApi.exists(request),
        }}
    >
        <SearchUI
            settingsContextName="transactions"
            possibleCriteria={[
                CriterionTypeEnum.DATE_RANGE,
                CriterionTypeEnum.TRANSACTION_TYPES,
            ]}
            exactSearchLabels={[ExactCriterionSearchLabelEnum.ID]}
            /* остальные пропсы */
        />
    </SearchUIProvider>
) 
```

Передавайте только те поля `SearchUIDefaults`, которые хотите переопределить — остальные значения берутся из
`initialSearchUIDefaults`. Более развернутый пример можно посмотреть в `src/stories/SearchUI.stories.tsx`.
`templatesApi` в примере — любая ваша обертка над бэкендом, которая умеет получать/сохранять шаблоны.

### Кастомизация фильтра диапазона дат

Чтобы ограничить список вариантов диапазона дат, передайте `dateRangeSpecTypes` в `config.dateRange`.
Например, чтобы убрать вариант `DATE_INDEPENDENT`:

```tsx
import { DATE_RANGE_SPEC_TYPES } from 'pne-ui'

const config = {
    dateRange: {
        dateRangeSpecTypes: DATE_RANGE_SPEC_TYPES.filter(type => type !== 'DATE_INDEPENDENT'),
    },
}

<SearchUI
    settingsContextName="transactions"
    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
    config={config}
    /* остальные пропсы */
/>
```

### Динамическая доступность критериев

Если критерий должен быть доступен только при определённом состоянии фильтров,
передайте правила в `config.criterionAvailabilityRules`. Недоступный критерий
удаляется из активных `criteria`, его значение очищается тем же способом, что и
при ручном удалении фильтра, и он не показывается в списке добавления. Если
такой критерий входит в `predefinedCriteria`, он автоматически вернётся в
активные фильтры, когда снова станет доступен.

Например, `ORDERS_SEARCH` можно оставлять активным только для
`orderDateType === 'SESSION_STATUS_CHANGED'`:

```tsx
<SearchUI
    settingsContextName="orders"
    predefinedCriteria={[
        CriterionTypeEnum.DATE_RANGE_ORDERS,
        CriterionTypeEnum.ORDERS_SEARCH,
    ]}
    possibleCriteria={[
        CriterionTypeEnum.CARD_TYPES,
        CriterionTypeEnum.CURRENCY,
        CriterionTypeEnum.TRANSACTION_TYPES,
    ]}
    config={{
        criterionAvailabilityRules: [{
            criterion: CriterionTypeEnum.ORDERS_SEARCH,
            isAvailable: conditions => (
                conditions.orderDateType === 'SESSION_STATUS_CHANGED'
            ),
        }],
    }}
    /* остальные пропсы */
/>
```

### Ручной режим поиска (manual search)

По умолчанию любое изменение фильтра немедленно запускает новый запрос.
Для экранов с тяжёлыми запросами можно включить ручной режим — фильтры будут
только накапливать изменения, а запрос отправится по нажатию кнопки **Search**
в шапке панели фильтров.

```tsx
<SearchUI
    settingsContextName="heavy-report"
    possibleCriteria={[CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.PROJECT]}
    config={{ manualSearch: true }}
    /* остальные пропсы */
/>
```

Опция работает и для `SearchUIFilters`, если он используется без таблицы:

```tsx
<SearchUIFilters
    settingsContextName="standalone-filters"
    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
    onFiltersUpdate={handleUpdate}
    config={{ manualSearch: true }}
/>
```

При первой загрузке запрос всё равно отправляется автоматически, чтобы
пользователь сразу видел данные. Кнопка Search становится активной только
после того, как фильтры были изменены.

Исключения из этого правила тоже остаются автоматическими:
- применение сохранённого шаблона, включая автозагрузку последнего шаблона;
- внешняя синхронизация через проп `searchConditions` (например, клик по
  значению вне панели SearchUI).

### Автоматическое восстановление состояния

`SearchUI` и `SearchUIFilters` автоматически сохраняют текущее состояние фильтров
в памяти по ключу `settingsContextName`. Если пользователь покинул экран и вернулся
к нему без полной перезагрузки страницы, фильтры и выбранный шаблон восстанавливаются.
В ручном режиме отдельно сохраняются черновик фильтров и условия последнего
выполненного поиска.

Дополнительные props или browser storage для этого не используются. После reload
in-memory состояние исчезает; постоянное хранение по-прежнему выполняется только
явно сохранёнными шаблонами. Данные таблицы не кешируются и после возврата загружаются
заново.

Используйте стабильный `settingsContextName`, уникальный для логического поискового
экрана. Два последовательных экрана с одинаковым именем намеренно разделяют
восстановленное состояние.

## Локализация (i18n)

`pne-ui` не принимает текстовые ресурсы через пропсы и не содержит собственного `I18nextProvider`.  
Все компоненты используют `useTranslation()` из `react-i18next`, поэтому они читают строки из того же контекста,
который инициализирован в приложении-хосте. Если в хосте нет i18next, библиотека будет просто возвращать ключи.

### Что нужно сделать в проекте

1. Инициализировать i18next один раз в корне приложения (например, в точке входа или конфигурации Storybook).
2. Добавить `initReactI18next` или обернуть дерево в `<I18nextProvider i18n={i18nInstance}>`, чтобы контекст был доступен.
3. Зарегистрировать все строки, которые ожидают компоненты `pne-ui` — в первую очередь ключи вида `react.searchUI.*`,
   `clear.all`, `search.delete`, и т.д. Они должны жить в ресурсах самого хоста.

### Пример настройки

```ts
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
    lng: 'ru',
    fallbackLng: 'en',
    defaultNS: 'translation',
    resources: {
        ru: {
            translation: {
                'react.searchUI.filters': 'Фильтры',
                'react.searchUI.template': 'Шаблон',
                'clear.all': 'Очистить всё',
                // добавьте остальные ключи, которые используете
            },
        },
    },
})

export default i18n
```

После инициализации достаточно один раз импортировать `./i18n` в точке входа или Storybook; все компоненты `pne-ui`
подтянутся к уже созданному контексту и будут использовать зарегистрированные строки.

## Темизация компонентов MUI

`pne-ui` поставляет вспомогательную функцию `createPneTheme` и тип `Skin`.  
`Skin` описывает корпоративные цвета Paynet (цвета хедера, меню и т.д.),
а `createPneTheme(skin)` на их основе строит расширенную MUI-тему с дополнительными палитрами:
`pnePrimary`, `pneNeutral`, `pnePrimaryLight`, `pneAccentuated`, `pneWhite`, `pneWarningLight`.

### Быстрый старт

1. Описываете skin (берете, например, из `window.PAYNET_SKIN`).
2. Создаёте тему `const theme = createPneTheme(skin)`.
3. Оборачиваете приложение в `<ThemeProvider theme={theme}>`, чтобы все компоненты `pne-ui` и стандартные MUI
   получили одинаковые значения цветов и стили переопределений.

```tsx
import React from 'react'
import { ThemeProvider } from '@mui/material'
import { createPneTheme, Skin, SearchUI } from 'pne-ui'

const skin: Skin = window.PAYNET_SKIN || {
    headerBackgroundColor: '#18547b',
    headerTextColor: '#fff',
    headerBorder: '1px solid #3899d5',
    menuBackgroundColor: '#fff',
    /* ... */
    experimentalColor: '#0a91bc',
}

const theme = createPneTheme(skin)

export const App = () => (
    <ThemeProvider theme={theme}>
        <SearchUI /* ... */ />
    </ThemeProvider>
)
```

При необходимости можно передать второй аргумент `createPneTheme(skin, muiOverrides)` и дополнительно расширить
тему MUI (тип `ThemeOptions`). Обёрнутые компоненты получают как базовые цвета skin, так и кастомные
color overrides (`pneNeutral`, `pnePrimaryLight`, `pneAccentuated` и др.), объявленные в `src/index.ts`.

## WidgetBoard и работа с лейаутами

`WidgetBoard` — дашборд с драгабл-виджетами и встраиваемой панелью лейаутов. Компонент инкапсулирует состояние:
выбор лейаута, CRUD кастомных схем и сохранение/загрузку лежат внутри `WidgetBoard`; снаружи достаточно передать
источники данных. Для связи `WidgetBoard` с `WidgetLayoutsPanel`/`WidgetBoardFab` используйте
`WidgetBoardScopeProvider` и `useWidgetBoardScopeStore`.

Основные пропсы:
- `widgets`: список `{ id, title, render }` — содержимое виджетов.
- `layoutByBreakpoint`: базовый пресет для дефолтного лейаута.
- `loadLayouts(): Promise<{ options; selectedId? } | null>`: обязательная функция загрузки пользовательских схем (вызывается при маунте). `WidgetBoard` сам добавляет и блокирует встроенный `default`-лейаут.
- `saveLayouts(options, selectedId?)`: обязательная функция сохранения пользовательских схем (вызывается при select/add/delete и автосохранении изменений в выбранном пользовательском лейауте).

Панель `WidgetLayoutsPanel` — презентационный компонент. Передавайте `items/selectedId/onSelect/onAdd/onDelete`
и прочие данные из scoped store (`useWidgetBoardScopeStore`).

### Структура данных для лейаутов

`loadLayouts` и `saveLayouts` работают с массивом `WidgetBoardLayoutOption`:

- `id: string`: уникальный идентификатор лейаута (можно `uuid` или любое значение бэка).
- `name: string`: отображаемое имя пресета.
- `layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>`: карта брейкпоинтов (ключ — число или строка, обычно `12`, `1280`, `1600` и т.д.).
  - `BreakpointLayoutConfig`: `{ widgets: Record<widgetId, WidgetLayoutConfig> }`.
  - `WidgetLayoutConfig`: `{ defaultSize: { columnSpan; rowSpan; columnOffset? }; limits?; initialState?; heightMode? }`.
    - `initialState` поддерживает `isHidden` и `isCollapsed`.

Формат функции `loadLayouts`:

```ts
type LoadLayoutsResult = {
    options: WidgetBoardLayoutOption[]
    selectedId?: string // id активного лейаута, если его нет в options — упадет на первый элемент
} | null
```

`saveLayouts` получает тот же `options` (уже с последними изменениями) и `selectedId`.

### Пример использования

```tsx
import React from 'react'
import { Box, Stack } from '@mui/material'
import {
    WidgetBoard,
    WidgetLayoutsPanel,
    WidgetBoardScopeProvider,
    useWidgetBoardScopeStore,
    type WidgetDefinition,
    type WidgetBoardLayoutOption,
} from 'pne-ui'

const widgets: WidgetDefinition[] = [
    { id: 'traffic', title: 'Traffic', render: () => <div>Traffic content</div> },
    { id: 'sales', title: 'Sales', render: () => <div>Sales content</div> },
]

const baseLayoutByBreakpoint = {
    12: {
        widgets: {
            traffic: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
            sales: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
        },
    },
}

// Загрузка/сохранение пресетов
const loadLayouts = async (): Promise<{ options: WidgetBoardLayoutOption[]; selectedId?: string }> => {
    const response = await api.getUserLayouts() // верните { options, selectedId }
    // Если API пустой, вернем пустой набор: WidgetBoard добавит встроенный default сам
    return response ?? { options: [], selectedId: 'default' }
}
const saveLayouts = async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
    await api.saveUserLayouts({ options, selectedId })
}

const DashboardContent = () => {
    const boardStore = useWidgetBoardScopeStore()
    const panelProps = boardStore(state => ({
        items: state.items,
        selectedId: state.selectedId,
        onSelect: state.onSelect,
        onDelete: state.onDelete,
        onAdd: state.onAdd,
        addInfo: state.addInfo,
        lockedIds: state.lockedIds,
    }))

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Box sx={{ minWidth: 260 }}>
                    <WidgetLayoutsPanel {...panelProps} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <WidgetBoard
                        widgets={widgets}
                        layoutByBreakpoint={baseLayoutByBreakpoint}
                        loadLayouts={loadLayouts}
                        saveLayouts={saveLayouts}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export const Dashboard = () => (
    <WidgetBoardScopeProvider>
        <DashboardContent />
    </WidgetBoardScopeProvider>
)
```

`WidgetBoard` сам обновляет выбранный лейаут, следит за состоянием виджетов и при изменениях дергает `saveLayouts`
с актуальным набором опций.

## OverlayHost и уведомления

`OverlayHost` рендерит snackbars из `overlayActions` и принимает декларативные постоянные оверлеи через `PermanentOverlay`
(по одному на слот: `top-left/top-right/bottom-left/bottom-right`).
```tsx
import React from 'react'
import { OverlayHost, PermanentOverlay, PneFloatingActionButtons, overlayActions } from 'pne-ui'

const AppShell = () => (
    <OverlayHost>
        <PermanentOverlay
            id='page-fab'
            slot='bottom-right'
            render={() => (
                <PneFloatingActionButtons
                    actions={[
                        {
                            id: 'save',
                            label: 'Save',
                            onClick: () => overlayActions.showSuccess({ message: 'Saved!' }),
                        },
                        { id: 'divider', kind: 'divider' },
                        {
                            id: 'info',
                            label: 'Info',
                            onClick: () => overlayActions.showInfo({ message: 'Something happened' }),
                        },
                    ]}
                />
            )}
        />
        {/* ваш layout, роутер, модалки и т.д. */}
    </OverlayHost>
)
```

- Для уведомлений используйте `overlayActions.showSuccess/showError/showWarning/showInfo`, `showSnackbar` или `showUndoSnackbar`.
- `showUndoSnackbar` возвращает `id` snackbar и добавляет встроенную action-кнопку `Undo` (или ваш `undoLabel`).
- Любой snackbar с конечным `autoHideMs` показывает progress bar вверху карточки; если `autoHideMs` не задан, progress bar не рендерится.
- `PermanentOverlay` можно размещать на любом уровне дерева под хостом; последний зарегистрированный в слоте заменяет предыдущий.
- Слоты фиксированы четырьмя углами; сместить позицию можно через `offset`/`zIndex` пропы на `PermanentOverlay`.

## PneFloatingActionButtons

Плавающее меню действий: на десктопе показывает стек FAB над триггером и параллельно меню, на мобильных все пункты уходят
в меню. Поддерживает экшены, произвольные блоки контента и разделители. По умолчанию мобильным считается ширина `<= 800px`
(`mobileBreakpoint`), на десктопе action-кнопки остаются доступны и в меню, и в стеке.

Ключевые пропы:
- `actions: PneFabItem[]` — массив элементов: action `{ id, label, onClick, icon?, disabled?, tooltip? }`,
  divider `{ kind: 'divider' }`, content `{ kind: 'content', node }`.
- `mobileBreakpoint` (default `800`) — ширина, ниже которой показываем только меню.
- `position` (`{ bottom?: number; right?: number }`) — смещение от края.
- `fabLabel`/`fabIcon` — подпись и иконка триггера.
- `bannerText` — необязательный блок внизу меню.

Минимальный пример:

```tsx
import { PneFloatingActionButtons, overlayActions } from 'pne-ui'

const actions = [
    { id: 'reset', label: 'Reset layout', onClick: () => overlayActions.showInfo({ message: 'Reset' }) },
    { id: 'save', label: 'Save', onClick: () => overlayActions.showSuccess({ message: 'Saved' }) },
    { id: 'divider', kind: 'divider' as const },
    { id: 'custom', kind: 'content' as const, node: <div style={{ padding: 8 }}>Any JSX here</div> },
]

export const FabDemo = () => (
    <PneFloatingActionButtons
        actions={actions}
        fabLabel='Actions'
        bannerText='Edit widgets'
        position={{ bottom: 24, right: 24 }}
        mobileBreakpoint={900} // считать мобильным до 900px, иначе поведение как на десктопе
    />
)
```

Поведение по размерам:
- Ширина > `mobileBreakpoint`: стек FAB над триггером + меню (все action-пункты дублируются в меню).
- Ширина <= `mobileBreakpoint`: только триггер + меню, стек FAB скрыт.

## Публикация пакета

Перед публикацией выполните `yarn npmLogin`. Release-команды проверяют npm-сессию, запускают тесты, линтер, сборку и
`npm pack --dry-run` перед `npm publish`.

Стабильные версии публикуются под npm dist-tag `latest`:

| Команда | Результат |
| --- | --- |
| `yarn release` / `yarn release:patch` | Для стабильной версии поднять patch; для RC снять `-rc.N`. Затем опубликовать. Это команда по умолчанию, если отдельный bump был забыт. |
| `yarn release:minor` | Поднять minor и опубликовать. |
| `yarn release:major` | Поднять major и опубликовать. |
| `yarn release:stable` | Снять текущий `-rc.N` и опубликовать стабильную версию; для уже стабильной версии работает как patch release. |
| `yarn release:current` / `yarn publish:stable` | Опубликовать уже выставленную стабильную версию без изменения номера. |

RC-версии публикуются под dist-tag `next`, поэтому не заменяют стабильную версию для обычной установки:

| Команда | Результат |
| --- | --- |
| `yarn release:rc:current` | Опубликовать уже выставленную RC-версию без изменения номера. |
| `yarn release:rc:next` | Например, `4.3.0-rc.0` → `4.3.0-rc.1`, затем опубликовать. |
| `yarn release:rc:patch` | Начать следующую patch RC-линейку и опубликовать. |
| `yarn release:rc:minor` | Начать следующую minor RC-линейку и опубликовать. |
| `yarn release:rc:major` | Начать следующую major RC-линейку и опубликовать. |

Версию можно изменить отдельно, без публикации: `yarn version:patch`, `yarn version:minor`, `yarn version:major`,
`yarn version:rc:patch`, `yarn version:rc:minor`, `yarn version:rc:major` или `yarn version:rc:next`. После ручного bump
используйте `yarn publish:stable` либо `yarn publish:rc`; команда должна соответствовать типу версии в `package.json`.
Повторный запуск составной `release:*`-команды поднимет версию ещё раз.

Если публикация завершилась ошибкой уже после bump, исправьте причину и повторите только `yarn publish:stable` или
`yarn publish:rc`. Скрипты меняют `package.json`, но не создают git commit и tag — их следует оформить отдельно.

[npm-url]: https://www.npmjs.com/package/pne-ui

[npm-image]: https://img.shields.io/npm/v/pne-ui

[github-build]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml/badge.svg

[github-build-url]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml
