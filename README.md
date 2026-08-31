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

Параметр `maxRangeSpanInDays` задаёт включительную верхнюю границу диапазона.
Он проверяет уже разрешённые границы всех режимов даты; для date-only `EXACTLY`
пользовательская конечная дата считается включительной. Значение должно быть
положительным целым числом.

### Критерии отчёта по транзакциям

Для экранов полного и краткого отчётов специализированная конфигурация включает
шесть критериев: диапазон дат и пять новых критериев отчёта. Имена их полей в
`SearchCriteria` совместимы с контрактом API: `scope` вместе с
`transactionIds`, `datesType`, `recurrentFilter`, `timeZoneOffsetHours` и
`csvCharset`. Поддерживаемые библиотекой значения местами намеренно уже полного
backend-контракта; различия перечислены ниже.

Все шесть специализированных критериев следует передавать в
`predefinedCriteria`, чтобы их нельзя было удалить. Их необходимо объединить с
уже существующими обязательными критериями конкретного отчёта. В примере ниже
использован базовый набор Wicket-страниц: типы транзакций, статусы транзакций и
типы карт. Дополнительные доступные критерии, например валюты, можно добавить
только в `possibleCriteria`.

```tsx
import {useState} from 'react'
import {
    CriterionTypeEnum,
    DATE_RANGE_SPEC_TYPES,
    OverlayHost,
    PneButton,
    type SearchCriteria,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIValidationResult,
} from 'pne-ui'

const BASE_REQUIRED_REPORT_CRITERIA: CriterionTypeEnum[] = [
    CriterionTypeEnum.TRANSACTION_TYPES,
    CriterionTypeEnum.TRANSACTION_STATUS,
    CriterionTypeEnum.CARD_TYPES,
]

const SPECIALIZED_TRANSACTION_REPORT_CRITERIA: CriterionTypeEnum[] = [
    CriterionTypeEnum.DATE_RANGE,
    CriterionTypeEnum.TRANSACTION_REPORT_SCOPE,
    CriterionTypeEnum.TRANSACTION_DATE_TYPE,
    CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER,
    CriterionTypeEnum.TIME_ZONE,
    CriterionTypeEnum.CSV_CHARSET,
]

const REQUIRED_TRANSACTION_REPORT_CRITERIA: CriterionTypeEnum[] = [
    ...BASE_REQUIRED_REPORT_CRITERIA,
    ...SPECIALIZED_TRANSACTION_REPORT_CRITERIA,
]

type TransactionReportFiltersExampleProps = {
    onGenerate: (criteria: SearchCriteria) => void
}

export const TransactionReportFiltersExample = ({
    onGenerate,
}: TransactionReportFiltersExampleProps) => {
    const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null)
    const [validation, setValidation] = useState<SearchUIValidationResult | null>(null)

    const generateReport = () => {
        if (searchCriteria !== null) {
            onGenerate(searchCriteria)
        }
    }

    return <OverlayHost>
        <SearchUIProvider>
            <SearchUIFilters
                settingsContextName="transaction-report"
                possibleCriteria={REQUIRED_TRANSACTION_REPORT_CRITERIA}
                predefinedCriteria={REQUIRED_TRANSACTION_REPORT_CRITERIA}
                initialSearchConditions={{
                    dateRangeSpec: {
                        dateRangeSpecType: 'EXACTLY',
                        dateFrom: new Date(2026, 0, 1),
                        dateTo: new Date(2026, 0, 31),
                    },
                    scope: 'ALL',
                    transactionIds: '',
                    datesType: 'CREATED',
                    recurrentFilter: 'ALL',
                    timeZoneOffsetHours: null,
                    csvCharset: null,
                }}
                onFiltersUpdate={criteria => setSearchCriteria(criteria)}
                onValidationChange={setValidation}
                config={{
                    manualSearch: true,
                    dateRange: {
                        dateRangeSpecTypes: DATE_RANGE_SPEC_TYPES.filter(
                            type => type !== 'DATE_INDEPENDENT',
                        ),
                        maxRangeSpanInDays: 93,
                    },
                }}
            />

            <PneButton
                disabled={searchCriteria === null || !validation?.isValid}
                onClick={generateReport}
            >
                Generate report
            </PneButton>
        </SearchUIProvider>
    </OverlayHost>
}
```

У высокоуровневого `SearchUI` используются те же `possibleCriteria`,
`predefinedCriteria`, `initialSearchConditions`, `config` и
`onValidationChange`; результат для бэкенда передаётся в `searchData` как часть
`SearchParams`.

Поддерживаемые значения специализированных полей:

- `scope`: `ALL`, `SELECTED_BY_SESS_ID`, `SELECTED_BY_PROCESSOR_TX_ID`,
  `SELECTED_BY_MOTHER_SESS_ID`, `SELECTED_BY_MOTHER_PROCESSOR_TX_ID`,
  `SELECTED_BY_TX_RRN`;
- `datesType`: библиотека поддерживает только `CREATED`. Backend enum и Wicket
  также принимают deprecated-вариант `BANK`, который сейчас обрабатывается как
  тот же диапазон created dates; библиотека намеренно его не показывает;
- `recurrentFilter`: `ALL`, `RECURRENTS_ONLY`, `NON_RECURRENTS_ONLY`;
- `timeZoneOffsetHours`: `null` либо целое число от `-12` до `12`;
- `csvCharset`: `null`, `UTF-8`, `UTF-8-SIG` или `windows-1251`.

`transactionIds` — необязательная строка, которая показывается только при
`scope !== 'ALL'` и передаётся библиотекой без преобразования и UI-валидации.
Backend заменяет каждую непрерывную группу whitespace, запятых, точек с запятой,
одинарных/двойных кавычек и NUL одним разделителем-запятой. Для scope с числовыми
order ID он затем молча отбрасывает фрагменты с недесятичными символами. Проверка,
отключающая период при непустых ID, выполняется backend по исходной строке до
этой нормализации.

`timeZoneOffsetHours: null` включает backend fallback на серверный сдвиг
таймзоны, а `csvCharset: null` — выбор кодировки на сервере по данным браузера.
Wicket сразу показывает эти вычисленные значения в обязательных dropdown; React
для `null` показывает `Default`. Если нужна точная визуальная parity с Wicket,
передайте вычисленные конкретные значения вместо `null`.

`UTF-8-SIG` экспонируется библиотекой в соответствии с UI-контрактом, но в
текущем endpoint отчётов ещё нет обязательного backend mapping строки
`UTF-8-SIG` на custom charset с BOM. До появления такого mapping выбор этого
значения не является end-to-end поддержанным и не должен отправляться в
production-запросе.

Если диапазон невалиден, встроенная кнопка Search/Refresh блокируется и
`onFiltersUpdate` не публикует невалидный черновик. Для внешней кнопки Generate
используйте `onValidationChange`, как в примере выше.

### Ограничение типов транзакций

Чтобы показать в `TRANSACTION_TYPES` только часть общего справочника, передайте
точные системные имена в `config.transactionTypes.allowedNames`. Имена сравниваются
с полем `displayName`, а числовые ID берутся из справочника текущего инстанса.

```tsx
<SearchUIFilters
    settingsContextName="fraud-chargeback-report"
    possibleCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
    onFiltersUpdate={handleFiltersUpdate}
    config={{
        transactionTypes: {
            allowedNames: ['chargeback', 'fraud'],
        },
    }}
/>
```

При таком ограничении значение `All` соответствует всем разрешённым типам и
передаёт их фактические ID в `SearchCriteria.transactionTypes`. Пока справочник
не загружен, фильтры не инициализируются и промежуточный неограниченный запрос не
отправляется. Без `config.transactionTypes` сохраняется прежний контракт:
`All` сериализуется как пустой массив.

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

### Первичная загрузка и сохранённые шаблоны

При монтировании `SearchUIFilters` определяет источник начальных условий до
первого связанного с шаблонами вызова `onFiltersUpdate`. Источники имеют
следующий приоритет: внешние `searchConditions`, восстановленное in-memory
состояние, последний сохранённый шаблон, затем `initialSearchConditions` и
значения по умолчанию.

Если имя последнего шаблона сохранено, фильтры дожидаются `getSearchTemplates`,
применяют найденный шаблон и только после этого выполняют первый поиск. Если
шаблон отсутствует или загрузка завершилась ошибкой, выполняется один fallback-
поиск с начальными значениями. Когда сохранённого имени нет, начальный поиск не
ждёт фоновой загрузки списка шаблонов.

Поэтому отдельный признак готовности шаблонов потребителю не требуется: загрузка
шаблонов не публикует промежуточные критерии. Компонент `SearchUI` соблюдает тот
же контракт и не вызывает `searchData` сначала с начальными значениями, а затем
повторно с автоматически восстановленным шаблоном.

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

При первой загрузке итоговый запрос всё равно отправляется автоматически, чтобы
пользователь сразу видел данные. Если сохранён последний шаблон, не выполняется
предварительный запрос с начальными значениями: первый связанный с шаблонами
запрос сразу использует его условия. Кнопка Search становится активной только
после того, как фильтры были изменены.

Исключения из этого правила тоже остаются автоматическими:

- применение пользователем сохранённого шаблона после инициализации;
- внешняя синхронизация через проп `searchConditions` (например, клик по
  значению вне панели SearchUI).

### Относительные диапазоны дат

Относительные календарные и скользящие диапазоны (`TODAY`, `DAYS_BEFORE`,
`HOURS_BEFORE` и аналогичные) являются декларативными пресетами. Хост должен
передавать тип диапазона и его параметры, а вычисление конкретных `dateFrom` и
`dateTo` оставлять `SearchUI`:

```tsx
import {SearchUIDateRangeSpec} from 'pne-ui'

const last30Days = {
    dateRangeSpecType: 'DAYS_BEFORE',
    beforeCount: 30,
} satisfies SearchUIDateRangeSpec
```

`SearchUI` пересчитывает такой диапазон при применении внешних `searchConditions`,
восстановлении шаблона или сохранённого состояния и перед выполнением повторного
Search. Поэтому не вычисляйте относительные даты заранее в хосте:
иначе сохранённый `dateTo` со временем превращается в устаревшую верхнюю границу.
Для `EXACTLY`, напротив, `dateFrom` и `dateTo` задаются явно и не пересчитываются;
`DATE_INDEPENDENT` конкретного диапазона вообще не имеет.

Публичные props `SearchUI` и `SearchUIFilters` проверяют эту форму и на этапе
компиляции, и в runtime. Поэтому относительные пресеты не принимают `dateFrom` /
`dateTo`, `EXACTLY` требует обе даты и не принимает `beforeCount`, а
`DAYS_BEFORE` / `HOURS_BEFORE` требуют положительный целый `beforeCount`.
Формат уже сохранённых пользовательских шаблонов не меняется: он остаётся
обратно совместимым внутренним resolved-state форматом.

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

[npm-url]: https://www.npmjs.com/package/pne-ui

[npm-image]: https://img.shields.io/npm/v/pne-ui

[github-build]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml/badge.svg

[github-build-url]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml
