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

[npm-url]: https://www.npmjs.com/package/pne-ui

[npm-image]: https://img.shields.io/npm/v/pne-ui

[github-build]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml/badge.svg

[github-build-url]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml
