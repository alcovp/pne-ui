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
источники данных. Панель (`WidgetLayoutsPanel`) автоматически подключается к борду (по умолчанию без пропсов).

Основные пропсы:
- `widgets`: список `{ id, title, render }` — содержимое виджетов.
- `layoutByBreakpoint`: базовый пресет для дефолтного лейаута.
- `loadLayouts(): Promise<{ options; selectedId? } | null>`: обязательная функция загрузки пользовательских схем (вызывается при маунте). Верните хотя бы дефолтный пресет, если удаленное хранилище пустое.
- `saveLayouts(options, selectedId?)`: обязательная функция сохранения пользовательских схем (дергается после add/update/delete).

Панель `WidgetLayoutsPanel` — отдельный компонент, который слушает активный `WidgetBoard` без пропсов. Можно размещать в любом месте дерева (включая FAB) или передать свои `items/onSelect/...` при необходимости.

### Структура данных для лейаутов

`loadLayouts` и `saveLayouts` работают с массивом `WidgetBoardLayoutOption`:

- `id: string`: уникальный идентификатор лейаута (можно `uuid` или любое значение бэка).
- `name: string`: отображаемое имя пресета.
- `layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>`: карта брейкпоинтов (ключ — число или строка, обычно `12`, `1280`, `1600` и т.д.).
  - `BreakpointLayoutConfig`: `{ columns: number; widgets: Record<widgetId, WidgetLayoutConfig> }`.
  - `WidgetLayoutConfig`: `{ defaultSize: { columnSpan; rowSpan; columnOffset? }; limits?; initialState? }`.
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
import { Box, Stack } from '@mui/material'
import { WidgetBoard, WidgetLayoutsPanel, type WidgetDefinition, type WidgetBoardLayoutOption } from 'pne-ui'

const widgets: WidgetDefinition[] = [
    { id: 'traffic', title: 'Traffic', render: () => <div>Traffic content</div> },
    { id: 'sales', title: 'Sales', render: () => <div>Sales content</div> },
]

const baseLayoutByBreakpoint = {
    12: {
        columns: 12,
        widgets: {
            traffic: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
            sales: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
        },
    },
}

// Загрузка/сохранение пресетов
const loadLayouts = async (): Promise<{ options: WidgetBoardLayoutOption[]; selectedId?: string }> => {
    const response = await api.getUserLayouts() // верните { options, selectedId }
    // Если API пустой, вернем дефолтный пресет
    return (
        response ?? {
            options: [{ id: 'default', name: 'Default', layoutByBreakpoint: baseLayoutByBreakpoint }],
            selectedId: 'default',
        }
    )
}
const saveLayouts = async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
    await api.saveUserLayouts({ options, selectedId })
}

export const Dashboard = () => (
    <Box sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
            <Box sx={{ minWidth: 260 }}>
                <WidgetLayoutsPanel />
            </Box>
            <Box sx={{ flex: 1 }}>
                <WidgetBoard
                    widgets={widgets}
                    layoutByBreakpoint={baseLayoutByBreakpoint}
                    loadLayouts={loadLayouts}
                    saveLayouts={saveLayouts}
                />
            </Box>
        </Stack>
    </Box>
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

- Для уведомлений используйте `overlayActions.showSuccess/showError/showWarning/showInfo` или `showSnackbar`.
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

[npm-url]: https://www.npmjs.com/package/pne-ui

[npm-image]: https://img.shields.io/npm/v/pne-ui

[github-build]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml/badge.svg

[github-build-url]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml
