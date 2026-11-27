# pne-ui

[![NPM version][npm-image]][npm-url]
[![npm release][github-publish]][github-publish-url]

Мега обертка над MUI

## Что добавляется в библиотеку

Компонент добавляется, только если выполнены все три условия:

1. **Нужен двум приложениям уже сейчас.** В каждом из двух есть место, где он нужен сегодня. «Пригодится потом»
   и несколько страниц одного приложения не считаются.
   Исключение — компонент, от которого зависит работа многих страниц: он добавляется и при одном приложении,
   чтобы его изменения проходили проверки и выпуски библиотеки. Решает мейнтейнер библиотеки.
2. **Ничего не знает о приложении.** Не ходит в API, не знает маршрутов, прав и хранилищ. Данные и сервисы
   получает пропсами или через провайдер.
3. **Не повторяет существующее.** Если похожий компонент или вариант уже есть, расширяется он. Вид стокового
   компонента MUI задаётся в теме, а не новой обёрткой.

Не выполнено хотя бы одно — компонент остаётся в приложении: перенести его позже проще, чем убрать из
публичного API.

## Установка

`pne-ui` рассчитан на приложения экосистемы Paynet: React 19, MUI 9, react-i18next. Всё, что библиотека
использует вместе с приложением, объявлено в `peerDependencies` и должно стоять в приложении одной
копией. Свои пакеты (`zustand`, `immer`, `react-virtuoso`, `@hello-pangea/dnd`, `react-imask`, `lodash`,
`tslib`) она приносит сама.

В приложении, где React, MUI и react-i18next уже есть, добавьте библиотеку и то, чего ещё нет:

```bash
yarn add pne-ui @mui/x-date-pickers @mui/x-date-pickers-pro dayjs
```

Версии берите по правилам приложения (наши приложения пинят точные версии), `@mui/x-date-pickers` и
`@mui/x-date-pickers-pro` — одной и той же. В пустом проекте добавьте так же все пакеты из таблицы.

| Peer | Диапазон |
|---|---|
| `react`, `react-dom` | `^19` |
| `@mui/material`, `@mui/system`, `@mui/icons-material` | `>=9.0.1 <10` |
| `@mui/x-date-pickers`, `@mui/x-date-pickers-pro` | `^9`, одна версия у обоих |
| `dayjs` | `^1.11.10` |
| `@emotion/react`, `@emotion/styled` | `^11` |
| `i18next` | `>=21 <26` |
| `react-i18next` | `>=11 <17` |

После установки проверьте:

```bash
yarn explain peer-requirements   # ни одной строки с ✘
yarn why @mui/x-date-pickers     # одна версия, та же, что у @mui/x-date-pickers-pro
```

Вторая проверка важна: `@mui/x-date-pickers-pro` зависит от базового пакета по диапазону, и при точных
пинах в приложении Yarn может поставить ему отдельную, более новую копию. Тогда пикеры SearchUI не находят
контекст локализации и падают при рендере. Лечится одной версией базового пакета, в Yarn — записью в
`resolutions`:

```json
"resolutions": {
    "@mui/x-date-pickers": "9.14.0"
}
```

При обновлении MUI X меняйте обе зависимости и эту запись вместе. Так же ведут себя caret-диапазоны
собственных зависимостей `pne-ui` (`immer`, `zustand`, `react-virtuoso`): если приложение пинит эти пакеты
точно, Yarn поставит вторую копию для `pne-ui`, пока диапазон не закреплён
(`yarn set resolution 'immer@npm:^10.0.3' npm:<версия приложения>` или `resolutions`).

Диапазонный пикер SearchUI — компонент MUI X Pro: ключ лицензии ставит приложение
(`LicenseInfo.setLicenseKey` из `@mui/x-license`), иначе пикер рисует водяной знак.

Сборка приходит без транспиляции у потребителя: синтаксис ES2021, встроенные API не новее ES2022.
Это Chrome 93+, Firefox 92+, Safari и iOS Safari 15.4+.

С 5.0 `dayjs` и `@mui/x-date-pickers` стали peer-зависимостями, а zod-схемы `AbstractEntitySchema`,
`AutoCompleteChoiceSchema`, `CountrySchema` и `StateSchema` больше не экспортируются. Типы `AbstractEntity`,
`AutoCompleteChoice` и `Country` остались прежними; приложению, которое валидирует ответы
zod-схемами, нужны свои схемы. `dayjs` берётся у приложения: SearchUI один раз ставит на него плагины
`utc`, `timezone` и `isoWeek`.

С 5.0 из публичного API сняты внутренние помощники библиотеки:

- компонент `AutoTestAttribute` удалён: якорь ставит `createAutoTestAttributes` (см. «Якоря для автотестов»);
- функции модели выбора строк (`createEmptyTableSelection`, `setTableRowSelected`, `setTablePageSelected`,
  `selectAllMatchingTableRows`, `clearTableSelection`, `isTableRowSelected`, `getTableSelectionCount`,
  `getTableSelectionPageState`) — моделью владеет `useTableSelection`;
- помощники настройки колонок (`resolvePneTableColumnSettings`, `createDefaultPneTableColumnSettings`,
  `isSamePneTableColumnSettings`, `assertPneTableColumnCatalog`, `isValidPneTableColumnId`,
  `PNE_TABLE_COLUMN_ID_PATTERN`) — ими владеет `usePneTableColumnSettings`;
- списки значений критериев SearchUI (`CSV_CHARSETS`, `CUSTOMER_LEVEL_DEPENDENCIES`, `ORDER_SEARCH_LABELS`,
  `OTP_STATUS_CRITERION_VALUES`, `TIME_ZONE_OFFSET_HOURS`, `TRANSACTION_DATE_TYPES`,
  `TRANSACTION_RECURRENT_FILTERS`, `TRANSACTION_REPORT_SCOPES`) и константы кодов ошибок
  `SEARCH_UI_DATE_RANGE_*` — значения описаны типами (`CsvCharset`, `OrderSearchLabel`,
  `SearchUIValidationError` и другими);
- `AbstractTableCell` и `AbstractHeaderTableCell` — свою ячейку стройте на `PneTableCell` и `PneHeaderTableCell`
  (см. «Виды ячеек таблицы»);
- `getOptionLabel`, `getOptionKey`, `isOptionEqualToValue`, `dropDownSx`, `assertAbstractEntity`,
  `assertIAutoCompleteChoice`, `isMappedAbstractEntity`, `useBreakpoint`, `resolveBreakpoint`,
  `DEFAULT_BREAKPOINTS`;
- `createPneThemeOptions` — тему строит `createPneTheme`;
- `PNE_ACTION_SPACING` — расстояния даёт `pneActionSpacing`;
- устаревшие пропсы: `htmlFor`, `labelSx` и `helperTextSx` у `PneField` (вместо них `controlId`,
  `slotProps.label.sx` и `slotProps.helperText.sx`), `overlay`, `containerProps` и `closeButtonProps` у `PneModal`
  (вместо них `blockingOverlay`, `slotProps.container` и `slotProps.closeButton`).

Из типов сняты `AutoTestAttributeProps` и те, которые описывают данные приложения, а библиотеке не нужны:
`State` (штат), `SelectOption`, `GetPagedListRequest`, `GetPagedOrderedSortedListRequest`,
`AutoCompleteChoiceAllableCollection`, `IMappedAbstractEntity`, `PneDropdownChoice` и проверка
`isIAutoCompleteChoice` — приложение объявляет их у себя. Опцию выпадающего списка библиотеки описывает
`PneBuiltInAutocompleteOption`, страницу и сортировку, которые SearchUI передаёт в поиск, — сам `SearchParams`
(`startNum`, `rowCount`, `orderBy`, `sortOrder`). Остальные типы экспортируются по-прежнему.

С 5.0 удалено то, чем приложения не пользовались:

- компоненты `PneFloatingActionButtons` и `PermanentOverlay` вместе с их типами;
- `maxSnack` у `OverlayHost` — на экране всегда не больше 10 уведомлений;
- `conflictingCriteriaGroups` в настройках `SearchUIFilters` и `onValidationChange` у `SearchUI` (у
  `SearchUIFilters` он остался);
- `defaultOpen`, `keepPreviousOptions` и `onLoadError` у `PneAsyncAutocomplete`, тип
  `PneAsyncAutocompleteLoadErrorContext`;
- `formControlProps`, `formGroupProps` и `helperTextProps` у `PneLabeledCheckbox`.

Из списка допустимых элементов `AbstractEntitySelector` убран тип платёжного аппарата хоста. Селектор
по-прежнему берёт любой объект с `id` и `name` (тип `AbstractEntitySelectorNamedItem`) или с `id` и
`displayName`; остальные поля объекта возвращаются в `onChange` как были.

## PneBreadcrumbs

`PneBreadcrumbs` — общий визуальный компонент хлебных крошек для host-приложения и микрофронтов. Он не
зависит от роутера, i18next, меню или permissions: consumer передаёт уже локализованные `label`, формирует
доступные ему элементы и при необходимости подключает bridge-aware ссылку через `linkComponent`.
Такой link adapter должен принимать `href`, передавать `className` и прочие DOM props и через `forwardRef`
возвращать ref фактического `<a>` — это нужно для клавиатурного фокуса в overflow-меню.

Элементы имеют стабильный `id` и один из трёх взаимоисключающих типов: `link` с `href`, `action` с `onClick`
или неинтерактивный `text`. Последний `text` автоматически получает `aria-current="page"`. При нехватке места
середина цепочки сворачивается в доступное меню. `ResizeObserver` следит за контейнером компонента, списком
крошек и родительским элементом; кроме него слушается `resize` окна. Для корректного измерения родитель должен
разрешать сжатие через `min-width: 0`.

```tsx
<PneBreadcrumbs
    ariaLabel={t("navigation.breadcrumbs")}
    moreLabel={t("navigation.more")}
    linkComponent={AppLink}
    items={[
        {
            id: "orders",
            label: t("main.nav.orders"),
            icon: <PneOrdersIcon/>,
            type: "text",
        },
        {
            id: "orders-search",
            label: t("sidebar.menu.orders"),
            href: "/paynet-ui/react-orders",
            type: "link",
        },
        {
            id: `order-${orderId}`,
            label: `${t("orders.order.history.order")} ${orderId}`,
            type: "text",
        },
    ]}
/>
```

`AppLink` — ссылка приложения (обёртка над ссылкой его роутера); в `pne-ui` такого компонента нет.

## Кнопка

Своего компонента кнопки в `pne-ui` нет. Кнопка — это `Button` из `@mui/material`: тема `createPneTheme`
рисует его по UI Kit (Variant × Size × State). Под другой темой это обычная кнопка MUI.

```tsx
import {Button} from '@mui/material'

<Button variant="contained" onClick={save}>Save</Button>
<Button variant="outlined" onClick={close}>Cancel</Button>
<Button variant="text" color="error" onClick={remove}>Delete</Button>
```

Вид выбирает пара `variant` и `color`:

| `variant` | `color` | Вариант UI Kit | Назначение |
|---|---|---|---|
| `contained` | не задан или `primary` | Primary | единственное главное действие на странице |
| `contained` | `error` | Destructive | удаление, красная заливка |
| `contained` | `warning` | Warning | неразрушающее предупреждение, янтарная заливка |
| `outlined` | любой | Secondary | второстепенное действие: кольцо цвета бренда; под указателем заливка подкрашивается |
| `text` или не задан | не задан или `primary` | Tertiary | нейтральная кнопка на серой заливке; под указателем меняется только цвет подписи |
| `text` | `error` | Tertiary danger | красная подпись: удаление, которому не нужен вес залитой кнопки |
| `text` | `success` | Tertiary success | зелёная подпись: активация |
| `soft` | любой | Soft | подпись цвета бренда на серой заливке: таблицы, панели, вторичное действие страницы |

Вторичное действие (Cancel, Back, Close) на странице — в шапке страницы или формы и у подножия формы, стоящей
прямо в странице, — `soft`: серая плашка без рамки рядом с основной `contained`. В окне (`PneModalActions`,
выпадающая панель со своими кнопками) вторичное действие — `outlined`, как в UI Kit Modal. `text` в окне — только
третье действие слева (`leading`) и единственная кнопка Close.

`soft` — четвёртый вариант, его добавляют типы `pne-ui`. Как и в MUI, кнопка без `variant` — `text`:
главному действию `variant="contained"` пишется явно. Пара, которой в UI Kit нет (`outlined` + `error`,
`contained` + `success`), рисуется как её `variant` в основном цвете. Цветов `secondary` и `info` у кнопки
нет, типы их не принимают. `color="inherit"` оставляет кнопке цвет места, где она стоит: без заливки,
с подписью цвета окружающего текста.

Пару вне таблицы, записанную в разметке, ловит линтер: правила `buttonRules` в `eslint.config.mjs`
(`no-restricted-syntax`). В приложение на ESLint они переносятся как есть.

Размеры: `small` 24 px (таблицы, группы), `medium` 32 px (формы, по умолчанию — как у полей), `large` 40 px
(главное действие страницы). Подпись Roboto Medium 12/14/14 px, иконки 14/16/18 px, радиус 4 px. Между иконкой
и подписью 2 px у `small` и `medium` и 8 px у `large`. Рамки — внутренние кольца в 1 px, поэтому
наведение и фокус не сдвигают раскладку. Подпись переносится на вторую строку, многоточия нет.

Подпись стоит посередине кнопки при любом масштабе экрана. Браузер центрирует строку, а не буквы, и при масштабе
125–150 % Chrome округляет метрики шрифта так, что буквы уходят на 1–2 px вверх; на снимке при 100 % этого не видно.
Поэтому строка подписи обрезается до полосы заглавных букв (`text-box`, `src/labelCentring.ts`) — так же у чипов,
кнопок полос таблицы и счётчика фильтров. Кнопка, в которую страница положила что-то кроме подписи и иконок
`startIcon` / `endIcon`, остаётся flex-контейнером. Firefox `text-box` пока не знает и рисует по-старому.
Значение однострочного поля (текст, дата, список) стоит посередине по той же причине иначе: у него нет отступов
сверху и снизу, строка занимает всю высоту поля. Отступ и половина межстрочного интервала при 125 % — дробные доли
пикселя экрана, каждая отбрасывалась отдельно, и текст стоял на пиксель выше середины.

Выбранный пункт набора — вкладка, текущая страница — сообщает о себе через `aria-current`, `aria-pressed`
или `aria-selected`. Кнопка `text` с таким атрибутом рисуется белой приподнятой, вид сохраняется под
указателем. Отдельного prop для этого нет.

Необратимый итог активации — кнопка `variant="text" color="success"` с `aria-disabled`: зелёный статус,
который не принимает клики. Из порядка обхода с клавиатуры её убирает вызывающий код (`tabIndex={-1}`),
подпись и иконку итога передаёт он же.

`loading` — штатный prop кнопки MUI: кнопка становится `disabled`, спиннер встаёт на место стартовой
иконки, конечная иконка прячется, цвета покоя остаются (у `outlined` заливка становится Neutral/50). Давайте
такой кнопке стартовую иконку, тогда её ширина не меняется. `loadingPosition="center"` прячет подпись и
ставит спиннер посередине.

Цвета берутся из `theme.palette.pne.button[variant][state]` (роли `btn-*` UI Kit) и выводятся из
одного цвета скина (`experimentalColor`) по шкале `theme.palette.pne.ramp`. Три правила держат любой
скин в рабочем виде:
- цвет бренда на странице берёт первую ступень, которая там читается: текст при 4,5:1, кольцо при 3:1;
- у почти чёрного скина наведение и нажатие светлеют;
- подпись на заливке белая при 4,5:1, иначе та из тёмной и белой, что контрастнее.

Тема действует на каждую кнопку MUI под ней, включая кнопки внутри сторонних компонентов. Точечные
отличия задаются через `sx` кнопки, как у любого компонента MUI.

Кнопки только с иконкой, без подписи, тема не рисует: для них в MUI есть `IconButton`.

Компонента группы кнопок в `pne-ui` нет: для группировки используйте `ButtonGroup` из `@mui/material`;
расстояние между независимыми действиями задавайте на layout-контейнере.

Переход с `PneButton` (до 5.0):

| Было | Стало |
|---|---|
| `<PneButton>` без `pneStyle`, `pneStyle="contained"` | `<Button variant="contained">` |
| `pneStyle="outlined"` | `variant="outlined"` |
| `pneStyle="text"` | `variant="text"` |
| `pneStyle="error"` | `variant="contained" color="error"` |
| `pneStyle="warning"` | `variant="contained" color="warning"` |
| `pneStyle="errorText"` | `variant="text" color="error"` |
| `pneStyle="successText"` | `variant="text" color="success"` |
| `pneStyle="neutral"`, `"neutralText"`, `"primaryLight"`, `"white"` | `variant="soft"` |
| `active` | `aria-current`, `aria-pressed` или `aria-selected` на кнопке `text` |
| `activated` | `aria-disabled` и `tabIndex={-1}` на кнопке `text` + `success` |
| `data-pne-variant`, `data-pne-size`, `data-pne-loading` | классы MUI: `MuiButton-contained`, `MuiButton-colorError`, `MuiButton-sizeSmall`, `MuiButton-loading` |

## Подсказка, радиокнопка, чип, группа переключателей и кнопка-значок: вид рисует тема

Своих компонентов подсказки, радиокнопки, чипа и группы переключателей в `pne-ui` нет. Берите `Tooltip`,
`Radio`, `Chip` и `ToggleButtonGroup` из `@mui/material`: под темой `createPneTheme` они выглядят по UI Kit, без
дополнительных свойств.

```tsx
import {FormControlLabel, Radio, RadioGroup, Tooltip} from '@mui/material'

<Tooltip title="Refresh the list"><IconButton onClick={refresh}><RefreshIcon/></IconButton></Tooltip>

<RadioGroup value={mode} onChange={(_event, next) => setMode(next)}>
    <FormControlLabel value="exact" control={<Radio/>} label="Exact"/>
    <FormControlLabel value="prefix" control={<Radio/>} label="Prefix"/>
</RadioGroup>
```

`Tooltip`:

- тело тёмное с белым текстом (на тёмной странице светлое с тёмным текстом), радиус 4, поля 4/8, текст
  12/16, ширина до 240 px;
- стрелка 10×6 показана по умолчанию и занимает 6 px между подсказкой и элементом; `arrow={false}` её убирает;
- задержки и поведение остаются штатными, их задаёт страница (`enterDelay`, `placement` и так далее).

`Radio`:

- `size="medium"` (по умолчанию) — кружок 20 px для форм, `size="small"` — 16 px для строк и плотных списков;
- выключена — тонкое кольцо, включена — толстое кольцо цвета бренда вокруг светлого центра;
- наведение и нажатие перекрашивают сам кружок, круглой подложки под курсором нет; фокус с клавиатуры —
  кольцо 2 px;
- цвета те же, что у `PneCheckbox` (`palette.pne.checkbox`); свой `icon` / `checkedIcon` страницы сохраняется.

`Chip` (UI Kit Badge: радиус 4, текст 14/20):

```tsx
import {Chip} from '@mui/material'

<Chip label="Visa"/>                                   // значение или тег вне поля
<Chip label="self" variant="outlined"/>                // светлая плашка в кольце
<Chip label="Germany" onDelete={remove}/>              // удаляемое значение
<Chip label="Turnover" color="primary" onClick={toggle}/>  // выбранный пункт переключателя
<Chip label="Yes" color="success"/>                    // оттенок статуса
```

| `variant` | `color` | Вид |
|---|---|---|
| `filled` (по умолчанию) | без цвета | серая заливка без рамки |
| `outlined` | без цвета | светлая плашка в кольце; у кликабельной при наведении кольцо бренда |
| `filled` | `primary` | заливка бренда, белый текст: выбранный пункт |
| `outlined` | `primary` | светлая плашка с кольцом и текстом бренда |
| `filled` | `success`, `error`, `warning` | бледный оттенок статуса с текстом цвета статуса |
| `filled` | `info`, `secondary` | бледный оттенок бренда |
| `outlined` | цвет статуса | светлая плашка с кольцом и текстом статуса |

- `size="medium"` (по умолчанию) — 32 px, для списков и ячеек таблиц; `size="small"` — 24 px;
- `onDelete` добавляет крестик UI Kit; под наведённым крестиком появляется светлый квадрат;
- кликабельный чип (`onClick` или `clickable`) отвечает на наведение и показывает кольцо фокуса;
- свой `deleteIcon` страницы сохраняет собственные размеры;
- чипы внутри `PneAutocomplete` и в фильтрах SearchUI рисуют сами эти компоненты, тема их не меняет.

`ToggleButtonGroup` (UI Kit Tabs: выбор одного из нескольких):

```tsx
import {ToggleButton, ToggleButtonGroup} from '@mui/material'

<ToggleButtonGroup exclusive value={status} onChange={(_event, next) => next && setStatus(next)}>
    <ToggleButton value="disabled">Disabled</ToggleButton>
    <ToggleButton value="enabled">Enabled</ToggleButton>
</ToggleButtonGroup>
```

- серая подложка в кольце, отступ 4 px вокруг пунктов и между ними; пункты — текстовые кнопки без капса;
  выбранный — белая плитка с тенью;
- `size="medium"` (по умолчанию) — группа 40 px, встаёт в ряд с полями и кнопками форм; `size="small"` —
  32 px, как в полосах таблицы;
- вид один: `color` группы ничего не меняет;
- группа шириной по своим пунктам, даже в колонке формы, которая растягивает детей; `fullWidth` занимает весь
  ряд и делит ширину между пунктами поровну, `orientation="vertical"` ставит их столбцом;
- `ToggleButton` без группы — не вкладка, тема его не рисует.

Выбор вида таблицы и переключатели окна Multiget — та же группа `size="small"` (32 px): в окне она стоит
в ряд с полем поиска 32 px.

`IconButton` (UI Kit Icon action: действие без подписи):

```tsx
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {IconButton} from '@mui/material'

<IconButton aria-label="Delete" size="small" color="error" onClick={remove}>
    <DeleteOutlinedIcon/>
</IconButton>
```

- без фона и без круга под указателем: наведение и нажатие красят только значок; скругление 4 px, кольцо
  фокуса с клавиатуры;
- размер кнопки не зависит от значка: `size="small"` — 24 px (строки и ячейки таблиц), по умолчанию — 32 px
  (формы, крестик окна), `size="large"` — 40 px (в ряду с полями 40 px);
- значок Material внутри кнопки получает 14 / 16 / 18 px — и обычный, и `fontSize="small"`; значок, которому
  страница задала размер через `sx`, и собственный svg приложения остаются как есть;
- `color`: по умолчанию значок серый и под указателем берёт цвет бренда; `primary` — цвет бренда сразу;
  `error` — серый, под указателем красный; `inherit` — цвет места, где стоит кнопка;
- `color="pnePrimary"` и `color="pneNeutral"` — закрашенный квадрат: кнопки Primary и Soft из UI Kit в режиме
  «только значок»;
- размер, который страница задала через `sx` или `styled`, сильнее темы.

Действия в строках `PneTable`, крестики окна, тоста и баннера рисуют сами компоненты той же функцией
(`pneIconActionSx`).

Сторис: `pne-ui/Tooltip`, `pne-ui/Radio`, `pne-ui/Chip`, `pne-ui/ToggleButton` и `pne-ui/IconButton`.

## PneField

`PneField` задаёт общий семантический контракт для одного поля: label, helper text, error/disabled/required state и
их ARIA-связи с единственным логическим control или control group. `PneTextField`, `PneSelect`,
`PneAutocomplete`, `PneAsyncAutocomplete`, `PneCheckbox` и `PneSwitch` читают этот контракт автоматически.
Внутри `PneField` должен быть ровно один логический control; для группы передавайте один group component, а не
несколько соседних controls. `PneField` не принимает ID произвольной layout-обёртки за ID самого control.

Подпись стоит над control (UI Kit Field, Label position Top): 12/16 Medium, в ошибке цвет не меняется — краснеет
helper text, у `disabled` подпись бледная.

`id` принадлежит root `FormControl` и служит namespace для сгенерированных ID. `controlId` принадлежит самому
интерактивному control и используется в `label[for]`; эти ID должны различаться. Указанный на child `id` не
переопределяет field-owned ID, поэтому при миграции переносите его в `controlId`. ID обрезаются по краям; пустые
ID и ID с внутренними пробельными символами считаются невалидными, игнорируются и заменяются сгенерированными.

```tsx
<PneField
    id="delivery-field"
    controlId="delivery-control"
    label="Delivery server"
    helperText="Select one server"
    slotProps={{
        label: {id: "delivery-label", "data-autotest": "delivery-label"},
        helperText: {id: "delivery-help", "data-autotest": "delivery-help"},
    }}
>
    <PneSelect options={servers} value={server} onChange={setServer}/>
</PneField>
```

Для произвольного control используйте render prop и передайте результат `getControlProps` на фактический
focusable control или group root. Adapter сохраняет дополнительные props, объединяет consumer
`aria-labelledby`/`aria-describedby` с ID label/helper text и дедуплицирует ссылки. Явный `aria-label`
остаётся самостоятельным naming override и не смешивается с `aria-labelledby`. При disabled field adapter
возвращает одновременно `disabled` и `aria-disabled`; это сохраняет нативную/MUI блокировку и корректно
описывает composite control с group-role.

```tsx
<PneField label="Period" helperText="Choose a unit" error={Boolean(error)} required>
    {({getControlProps, fullWidth}) => (
        <ToggleButtonGroup
            {...getControlProps({"aria-describedby": "period-format"})}
            exclusive
            sx={{width: fullWidth ? "100%" : "auto"}}
            value={period}
            onChange={(_event, value) => setPeriod(value)}
        >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
    )}
</PneField>
```

Если adapter нужен внутри отдельного descendant component, вызовите `usePneFieldControl()` там; вне
`PneField` hook возвращает `undefined`. Render prop предпочтительнее для прямой композиции, потому что явно
показывает место применения DOM-контракта.

`PneField` владеет ID и связями label/helper text. Значения `true` у field-level `disabled`, `error` и
`required` нельзя ослабить props дочернего control; его дополнительные ARIA ID при этом не теряются. Явный
`fullWidth` у встроенного PNE control может переопределить field default. `required` на `PneField` добавляет
asterisk и `aria-required`, но намеренно не устанавливает нативный `required`: browser constraint validation
включается только `required` на самом input/select/checkbox/switch.

`slotProps.label` и `slotProps.helperText` предназначены для `id`, `className`, `sx`, `ref`, ARIA и `data-*`
соответствующих slots. Split-state props MUI FormControl
(`color`, `focused`, `hiddenLabel`, `size`, `variant`) не входят в публичный API `PneField`; внешний вид control
настраивается на самом control, а label/helper — через `slotProps`. Root остаётся polymorphic через `component`,
и тип `ref` выводится из выбранного root element. `margin` остаётся исключительно layout-prop root
`FormControl` и не передаётся дочернему control.

## PneTextField

`PneTextField` сохраняет API MUI `TextField`; `size` — `small`, `medium` (по умолчанию) или `large`. Его `ref` указывает на
root `HTMLDivElement`; в text/multiline-режимах для focus, selection и интеграции с form-библиотеками передавайте
`inputRef`, который получает нативный `input` или `textarea`. В режиме `select` и при custom input slots семантика
`inputRef` остаётся контрактом MUI. В text/multiline-режимах нативные атрибуты (`maxLength`, `min`, `inputMode`) и
привязанные к input test/ARIA anchors передавайте через object или functional `slotProps.htmlInput`; для
интерактивного combobox в режиме `select` используйте `slotProps.select.SelectDisplayProps`. Обычные `data-*`
props самого `PneTextField` остаются на root. Компонент сохраняет результат slot callback и объединяет consumer
`aria-describedby` со связью собственного или внешнего helper text.

В композиции с `PneField` текстовое поле получает control ID, `disabled`, `error`, `fullWidth`, helper-связь и
`aria-required`. `required` внешнего `PneField` намеренно не включает нативный атрибут `required`: если нужна
browser constraint validation, передайте `required` непосредственно в `PneTextField`.

```tsx
const { ref, ...field } = controllerField

<PneField label="Customer reference" required helperText={error?.message}>
    <PneTextField
        {...field}
        inputRef={ref}
        slotProps={{htmlInput: {maxLength: 64}}}
    />
</PneField>
```

Вид поля (UI Kit Field). Вариант `outlined` (по умолчанию) — белое поле с кольцом Neutral/200, `filled` —
серое поле Neutral/100 со скруглением 4, без подчёркивания MUI: кольцо в покое сливается с заливкой, под
указателем поле светлеет до Neutral/50 и получает кольцо Neutral/200. Кольцо по состояниям: наведение темнее,
фокус — шаг бренда, читаемый на странице (кольцо 1px),
ошибка — Red/600, `disabled` — Neutral/100; ошибка остаётся видна и в фокусе. Значение — Neutral/900,
подсказка внутри поля — Neutral/500, helper text — Neutral/700, в ошибке Red/700. Подпись внутри поля
(`slotProps.input.startAdornment`) читается как значение. Цвета берутся из `theme.palette.pne.field`,
тёмная тема — на нейтралях pne-ui.
Поле, в котором есть значение, вне фокуса держит кольцо темнее (Neutral/500, UI Kit Active; root получает
`data-pne-filled`).

Размеры (UI Kit Fields): `small` — 24 px, текст 12/16; `medium` — 32 px, текст 14/20 (по умолчанию); `large` —
40 px, текст 14/20, отступ текста 12 px вместо 8. Размер задаёт `size`, на root стоит `data-pne-size`; MUI под
ним всегда получает свой `small`. Собственная подпись поля (`label`) стоит над полем, 12/16 Medium, в 4 px от
него, как подпись `PneField`, и не «плавает»; у кольца `outlined` нет выреза под неё. Helper text — 12/16 в
4 px под полем без отступа слева, в ошибке перед ним значок предупреждения.

`multiline`: отступы UI Kit 6/4/4/8 у поля 32 px; у поля другого размера сверху и слева — отступы его
однострочного поля (40 px: 10/4/4/12, 24 px: 4/4/4/8), чтобы первая строка и начало текста стояли там же, где у
полей и подписей рядом. Без `rows`, `minRows` и `maxRows` поле — блок UI Kit высотой 88 px, с `rows` — заданное число строк; в обоих случаях это обычный `textarea`, и пользователь тянет его за
уголок по высоте. С `minRows` или `maxRows` поле, как у MUI, растёт вместе с текстом, уголка у него нет.

Вид получает каждое поле, в том числе внутри автокомплитов и фильтров SearchUI. В режиме `select` поле рисует
шеврон и список как `PneSelect` (свой `IconComponent` и `native` остаются за потребителем).

## Поля дат: PneDatePicker и другие

Поля даты и времени — пикеры MUI X в виде UI Kit: коробка `PneTextField` (24, 32 или 40 px, подпись над
коробкой, кольцо по состоянию, ошибка со знаком) и календарь библиотеки.

| Компонент | Что выбирает | Пикер MUI X | Формат по умолчанию |
|---|---|---|---|
| `PneDatePicker` | дату | `DatePicker` | `DD.MM.YYYY` |
| `PneDateTimePicker` | дату и время | `DateTimePicker` | `DD.MM.YYYY HH:mm` |
| `PneTimePicker` | время | `TimePicker` | `HH:mm` |
| `PneDateRangePicker` | период | `DateRangePicker` (Pro) | `DD.MM.YYYY` |

```tsx
import dayjs, {type Dayjs} from 'dayjs'
import {PneDatePicker, PneDateTimePicker} from 'pne-ui'

const [day, setDay] = useState<Dayjs | null>(null)

<PneDatePicker label='Bank date' value={day} onChange={setDay} size='large' fullWidth/>
<PneDateTimePicker label='Created' value={created} onChange={setCreated} format='DD.MM.YYYY HH:mm:ss'/>
```

- Значения — даты dayjs: адаптер и язык календаря (месяцы, дни недели, первый день недели, подписи кнопок)
  компонент ставит сам по языку i18next. Свой `LocalizationProvider` не нужен.
- Все пропсы пикера MUI X проходят насквозь (`value`, `onChange`, `minDate`, `disableFuture`, `views`,
  `referenceDate`, `slots`, `slotProps` и остальные). К ним добавлены пропсы поля: `size` (`small`, `medium` по
  умолчанию, `large`), `error`, `helperText`, `fullWidth`, `required`, `id`. `slotProps.textField` приложения
  сильнее пропсов поля; его data-атрибуты попадают на корень поля.
- Ошибка. Без `error` поле краснеет, когда набранная дата не закончена или не существует (31.02) либо
  нарушает ограничение, которое дал сам пикер (`minDate`, `maxDate`, `disableFuture` и так далее). Год вне
  1900–2099 ошибкой не считается: это ограничение MUI X по умолчанию, а не приложения. `error={true | false}` —
  вердикт приложения, он сильнее; `onError` при этом по-прежнему сообщает причину MUI X.
- Время — 24 часа, в списке каждая минута. Формат с секундами добавляет колонку секунд.
- Внутри `PneField` поле берёт его подпись, подсказку, ошибку и `disabled`, как `PneTextField`.
- Пустое поле показывает свой формат цветом плейсхолдера.
- Поле отдельно — `PnePickerTextField`: его можно поставить в `slots.textField` своего пикера MUI X.
- Диапазонные пикеры — MUI X Pro: ключ лицензии ставит приложение (см. «Установка»).

## PneCheckbox и PneSwitch: общий контракт

`PneCheckbox` и `PneSwitch` сохраняют MUI-контракт `checked` / `defaultChecked` / `onChange`, а также нативные
`name`, `value`, `required` и `disabled`. Основной `ref` указывает на фактический root `HTMLSpanElement`; для
focus, form-библиотек и доступа к нативным свойствам используйте `inputRef: Ref<HTMLInputElement>`. Верхнеуровневые
`aria-*` применяются к нативному input, а `data-*`, включая существующие `data-autotest`, остаются на root.
Object и functional `slotProps.input` сохраняются и объединяются с обоими refs и управляемой семантикой.
Это же объединение применяется к `MuiCheckbox` / `MuiSwitch` theme `defaultProps`, включая их input slots.

`PneSwitch` всегда сохраняет `role="switch"`. `PneCheckbox indeterminate` синхронизирует одновременно
`input.indeterminate` и mixed accessibility state. `readOnly` у обоих компонентов действительно блокирует
pointer, label и keyboard activation, но не делает input disabled: он остаётся focusable и участвует в
`FormData`; состояние также объявляется через `aria-readonly`.

Внешний `PneField` передаёт control ID, label/helper-связь, `disabled`, `error` и `aria-required`. Как и у
`PneTextField`, `required` на `PneField` не включает browser constraint validation; для неё задайте `required`
самому checkbox или switch.

```tsx
<PneField label="Notifications" helperText={error?.message} error={Boolean(error)} required>
    <PneSwitch
        checked={enabled}
        inputRef={controllerRef}
        name="notifications"
        onChange={(_event, checked) => updateNotifications(checked)
            .then(() => setEnabled(checked))}
    />
</PneField>
```

## PneSwitch

Переключатель UI Kit (Switcher): Value × State × Size. Применяется сразу, без кнопки «Сохранить»; для
выбора, который ждёт сохранения, используйте чекбокс. Размеры: `medium` — дорожка 32×20 с ручкой 16
(область нажатия 58×32), `small` — 24×16 с ручкой 12 (40×24). Выключен: серая дорожка Neutral/300 и
белая ручка; включён: дорожка цвета бренда и белая ручка. У ручки нет тени и кольца. Ручка — круг, вырезанный
маской посередине блока высотой с дорожку (`.MuiSwitch-thumb` — этот блок, а не сама ручка): так зазоры сверху и
снизу равны и при дробном масштабе экрана, где отдельный блок ручки округлялся до 2 и 3 пикселей. Дорожка, нажатая в
выключенном состоянии, уже берёт цвет включённого. Цвета берутся из `theme.palette.pne.switch[on|off][state]`
и подчиняются тем же трём правилам для скинов, что и кнопки: на светлой заливке скина ручка тёмная.

Дорожка стоит посередине области нажатия, но в колонке полей переключатель начинается там же, где поля: часть
области нажатия перед дорожкой вынесена за раскладку (`margin-left` −13 px у `medium`, −8 px у `small`). В своей
ячейке таблицы (`PneTableSwitchCell`) переключатель стоит по центру.

Состояния: наведение, нажатие, фокус (кольцо на дорожке), `disabled` с подсказкой `disabledHint`,
`readOnly` (значение в нейтральных цветах, клики не работают) и ожидание ответа: когда `onChange`
возвращает thenable, значение переключается сразу, в ручке крутится спиннер, повторный клик заблокирован,
при отказе значение откатывается (`aria-busy` на input, `data-pne-loading` на корне). Состояния ошибки
нет: о неудачном запросе сообщайте уведомлением.

Если `PneSwitch.onChange` возвращает Promise/thenable, компонент автоматически включает optimistic lifecycle
без отдельного `pending` prop: сразу показывает запрошенное состояние, помечает input через `aria-busy` и
`aria-disabled`, показывает progress-индикатор и игнорирует повторную активацию до settlement. При reject
переключатель откатывается, при resolve сохраняет подтверждённое состояние. Синхронные callbacks работают как
раньше. Для controlled usage возвращаемый Promise должен завершаться после обновления внешнего `checked`;
для `defaultChecked` commit и rollback полностью принадлежат самому `PneSwitch`. Нативный input во время
запроса не становится `disabled`, поэтому не теряет focus и сохраняет текущее ON/OFF-состояние.

У заблокированного (`disabled`) `PneSwitch` дорожка и ручка нейтральные и одинаковые в обоих значениях,
как в UI Kit: ON от OFF отличает положение ручки. Над заблокированным переключателем курсор `not-allowed`, а при наведении появляется
нейтральная подсказка `pne.switch.disabledHint` (по умолчанию «Cannot be changed»). Конкретную причину
передайте в `disabledHint`: она заменит общий текст, а `disabledHint={false}` отключает подсказку (курсор
остаётся). Это касается и `disabled` от `PneField`, но не `readOnly` и не async-запроса. Подсказка рендерится рядом
с переключателем только пока он заблокирован, поэтому сам Switch не
оборачивается: его DOM, refs, locators и число рендеров не меняются.

## PneCheckbox

Флажок UI Kit (Checkboxes/Elements): Value × State × Size. Значения: выключен, включён и `indeterminate` (выбрана
часть дочерних; клик включает). Размеры: `small` — флажок 16 (UI Kit sm, списки; по умолчанию),
`medium` — 20 (md, формы и ячейка выбора строки таблицы), `large` — 24. Область нажатия прежняя: 38×38 и 42×42 (`large` — 46×46). Флажок
рисуется своим SVG в слотах `icon` / `checkedIcon` / `indeterminateIcon`; свои иконки потребителя работают как
раньше.

Цвета берутся из `theme.palette.pne.checkbox[off|on][state]` и подчиняются тем же трём правилам для скинов:
включённый — заливка цвета бренда с галочкой Neutral/50 (тёмной, если светлая не читается), выключенный —
Neutral/50 с кольцом Neutral/400; при наведении кольцо или заливка бренда темнее, при нажатии выключенный
заливается Brand/100. Цвет корня (`color`) — это кольцо выключенного и заливка включённого флажка, поэтому
перекраска через `sx={{color: …}}` работает, как с иконками MUI.

Состояния: фокус с клавиатуры (кольцо 2px), ошибка (красное кольцо или заливка; приходит из `error` у `PneField` и
`PneLabeledCheckbox` или из `aria-invalid`, на корне `data-pne-error`), `disabled` и `readOnly` (нейтральные цвета,
на корне `data-pne-readonly`). Ripple MUI выключен по умолчанию, `disableRipple={false}` возвращает его.

## PneLabeledCheckbox

`PneLabeledCheckbox` добавляет локальные `label`, `helperText` и `error`, генерирует ID helper text и объединяет
все `aria-describedby`.

Вид `PneLabeledCheckbox` — UI Kit Checkboxes/Set: подпись 14/20 в 8 px от флажка и на одной линии с ним,
пояснение 12/16 под подписью, в ошибке пояснение красное. Цвета — `theme.palette.pne.checkbox.text`.

## Шрифты

Дизайн PNE UI набран Roboto, числа в таблицах — Roboto Mono. Оба шрифта лежат в пакете; приложение подключает
их одной строкой в точке входа:

```ts
import 'pne-ui/fonts.css'
```

- Roboto — вариативный шрифт (один файл на набор символов, все начертания 100–900): латиница 43 КБ, кириллица
  24 КБ, расширенные наборы 29 и 37 КБ; курсив — такими же отдельными файлами (47, 25, 32 и 40 КБ). Roboto
  Mono — Regular и Medium, латиница по 13 КБ и кириллица по 7 КБ.
- Это обычные статические файлы: сборщик кладёт их рядом со сборкой, браузер кэширует их отдельно от кода и
  загружает только те наборы, символы которых есть на странице (`unicode-range`), с `font-display: swap`.
- Политика безопасности содержимого должна разрешать шрифты со своего адреса (`font-src 'self'`).
- Микрофронтам строка не нужна: шрифты объявляет документ хоста. Без таблицы текст рисуется следующими
  шрифтами списка (Helvetica, Arial; для чисел — системный моноширинный).
- Лицензия шрифтов — SIL OFL 1.1: `docs/licenses/Roboto-OFL.txt`, `docs/licenses/RobotoMono-OFL.txt`.

## PneBanner

Сообщение, встроенное в страницу (UI Kit Banner): подтверждение массового выбора, предупреждение над формой,
ошибка загрузки с повтором, ход пакетной операции. Для всплывающих уведомлений есть `OverlayHost`.

```tsx
<PneBanner tone='warning' title='Traffic is paused' actionLabel='Change the limit' onAction={openLimit} onClose={hide}>
    The limit of 75% of the daily amount is reached.
</PneBanner>
<PneBanner tone='error' actionLabel='Retry' onAction={reload}>The policy did not load.</PneBanner>
```

- `tone`: `info` (по умолчанию), `success`, `warning`, `error`. Вид: бледная заливка тона в кольце тона,
  радиус 8, отступы 12/16, слева знак тона 20px, текст 14/20. Цвета — `theme.palette.pne.toast[tone]`
  (`bannerFill`, `fill`, `text`), одинаковые для всех скинов.
- `title` — заголовок 14/20 SemiBold над текстом; `children` — текст или своё содержимое (абзацы, полоса
  прогресса).
- `actionLabel` + `onAction` — действие под текстом в виде ссылки; `actionProps` — пропсы этой кнопки
  (`disabled`, локатор). `onClose` показывает крестик 24px справа
  (`closeLabel` — его имя, по умолчанию «Close»). `icon={false}` убирает знак тона.
- Ошибка объявляется как `role="alert"`, остальные тона — `role="status"`. Остальные пропсы (`sx`, `data-*`)
  уходят на корень.

## Виды ячеек таблицы

Содержимое ячейки не стилизуют на странице: для каждого вида значения есть готовая ячейка (UI Kit Cell).
Все они построены на `PneTableCell`. Ячейки числа, ссылки, псевдоссылки, действий и раскрытия несут
`data-pne-cell`: `number`, `link`, `pseudo-link`, `actions`, `expand`. У текстовой ячейки, `PneTableControlCell`,
`PneTableSwitchCell` и `PneTableSelectionCell` атрибута нет.

| Что в ячейке | Компонент |
|---|---|
| Текст | `PneTableCell` |
| Число: сумма, количество, курс | `PneTableNumberCell` |
| Ссылка на другую запись | `PneTableLinkCell` со ссылкой внутри |
| Действие над значением на месте (псевдоссылка) | `PneTableLinkCell` с `onAction` |
| Действия строки: править, удалить, показать | `PneTableActionsCell` с `PneTableAction` внутри |
| Раскрытие строки | `PneTableExpandCell` |
| Переключатель, выбор строки | `PneTableSwitchCell`, `PneTableSelectionCell` |
| Другой элемент управления | `PneTableControlCell` |

Ячеек «без вида» наружу нет: `AbstractTableCell` и `AbstractHeaderTableCell` с 5.0 не экспортируются, свою
ячейку строят на `PneTableCell`.

```tsx
<PneTableRow>
    <PneTableExpandCell aria-label='Details' expanded={open} onToggle={setOpen}/>
    <PneTableLinkCell><AppLink href={orderUrl}>{order.id}</AppLink></PneTableLinkCell>
    <PneTableLinkCell onAction={() => filterBy(order.merchant)}>{order.merchant}</PneTableLinkCell>
    <PneTableNumberCell>{formatAmount(order.amount)}</PneTableNumberCell>
    <PneTableActionsCell>
        <PneTableAction onClick={edit} tooltip='Edit'><ModeEditIcon/></PneTableAction>
        <PneTableAction onClick={remove} tone='danger' tooltip='Delete'><DeleteOutlinedIcon/></PneTableAction>
    </PneTableActionsCell>
</PneTableRow>
```

- `PneTableNumberCell` ставит значение к правому краю моноширинным шрифтом (`"Roboto Mono"`, дальше системный
  моноширинный) в одну строку, чтобы цифры колонки стояли друг под другом. Заголовку такой колонки задайте
  `align='right'`.
- Roboto Mono приходит с таблицей шрифтов библиотеки (см. «Шрифты»). Своему моноширинному тексту задайте
  `fontFamily: PNE_MONO_FONT`.
- `PneTableLinkCell` даёт ссылке внутри цвет ссылки без подчёркивания (оно появляется под указателем). Сама
  ссылка — компонент потребителя (ссылка его роутера или `<a>`). С `onAction` содержимое становится кнопкой с
  линией под текстом: это действие на месте (открыть окно, отфильтровать по значению), а не переход;
  `actionProps` — пропсы этой кнопки (`disabled`, локатор).
- `PneTableActionsCell` ставит действия в ряд через 4px; `align` прижимает их к левому краю (по умолчанию), к
  центру или к правому. `PneTableAction` — кнопка 24px со значком 14px без заливки (UI Kit Icon action sm);
  значок передаётся потомком, как у `IconButton`. `tone='danger'` красит значок красным под указателем,
  `tooltip` показывает подсказку, в том числе у выключенного действия. Локатор и `aria-label` ставятся на саму
  кнопку.
- `PneTableExpandCell` — шеврон в узкой ячейке: вправо у закрытой строки, вверх у открытой (тогда он того же
  цвета, что значок под указателем). `onToggle(expanded, event)` получает новое состояние; `aria-label`
  необязателен; локатор кнопки —
  `row-expand` (`autoTestId`, `autoTestValue`).
- Действие, псевдоссылка и шеврон не передают клик строке, если она сама кликабельна.

## PneTableSwitchCell

Для status-колонки `PneTable` используйте `PneTableSwitchCell`: он размещает `PneSwitch size="small"` в
компактной ячейке шириной `40px` без vertical padding и не передаёт click в интерактивную строку. Один из
`aria-label` / `aria-labelledby` обязателен. Интерактивному варианту нужен `onChange(checked, event)`;
display-only вариант задаётся через `readOnly` без пустого callback. Возвращённый из табличного `onChange`
Promise передаётся в `PneSwitch`, поэтому optimistic/pending/rollback lifecycle работает в status-колонке без
дополнительных props ячейки.
У заблокированной ячейки (`disabled`) подсказка та же, что у `PneSwitch`; свою причину передайте через
`switchProps.disabledHint`.

Props самой ячейки передаются напрямую, а props переключателя — через `switchProps`. В частности, `id`,
`inputRef`, `name`, `slotProps` и существующие верхнеуровневые `PneSwitch` `data-*` селекторы относятся к
`switchProps`; селектор сохраняется на том же Switch DOM anchor, что и при прямом использовании `PneSwitch`,
но это не обязательно внешний wrapper. Размер, controlled state и accessible name принадлежат
`PneTableSwitchCell`. `autoTestId` (по умолчанию `table-switch`) создаёт отдельный locator на нативном input и
имеет приоритет над одноимённым
атрибутом в `switchProps.slotProps.input`, не удаляя верхнеуровневый `PneSwitch` locator из `switchProps`.

```tsx
<PneTableSwitchCell
    aria-label="Enable endpoint"
    checked={enabled}
    onChange={setEnabled}
    switchProps={{
        inputRef: controllerRef,
        name: "enabled",
        "data-autotest": "endpoint-status",
    }}
/>
```

## PneModal и PneModalActions

`PneModal` владеет структурой dialog, focus trap и ARIA-связями. Передайте видимый `title`; для модалок без
визуального заголовка используйте `ariaLabel`. Если компонент внутри `title` сам возвращает `null`, передайте
`title={null}` и `ariaLabel` явно: содержимое произвольного React-компонента нельзя определить до его рендера.
`title` и `subtitle` принимают `ReactNode`. `ref` указывает на
`HTMLDivElement` с `role="dialog"`. Структурные `role`, `aria-modal`, `aria-labelledby` и `aria-describedby`
нельзя переопределить через container slot; дополнительное описание подключается через `ariaDescribedBy`.

`onClose(event, reason)` различает `closeButtonClick`, `escapeKeyDown` и `backdropClick`. Существующие callbacks
без аргументов остаются совместимыми. `closeLabel` необязателен и по умолчанию равен `Close`; передавайте перевод
только там, где он доступен consumer-у. `hideCloseButton` скрывает icon button без дополнительных обязательных
props.

```tsx
<PneModal
    actions={<PneModalActions
        secondary={<Button variant="outlined">Cancel</Button>}
        primary={<Button variant="contained">Save</Button>}
    />}
    closeLabel="Close"
    onClose={(_event, reason) => {
        if (reason !== "backdropClick") setOpen(false)
    }}
    open={open}
    title={<span>Edit account</span>}
    slotProps={{
        container: {"data-autotest": "account-dialog"},
        title: {component: "h2"},
    }}
>
    Account form
</PneModal>
```

Вид (UI Kit Modal). Окно — карточка со скруглением 16 px, отступом 16 px со всех сторон, рамкой 1 px Neutral/200 и
мягкой тенью. Заголовок 18/26 SemiBold, подзаголовок 12/16 Neutral/700; крестик — значок 16 px в кнопке 32 px без
заливки: в покое Neutral/600, под указателем и при нажатии меняется только цвет значка. Шапку и кнопки от тела
отделяют линии 1 px с отступом 8 px сверху и
снизу; линии стоят внутри отступа окна и до его краёв не доходят. Текст тела 14/20. Тело прокручивается на всю
ширину окна, шапка и кнопки остаются на месте; у окна без кнопок нижний край тела — отступ окна. Окно без тела
и окно с телом в один ряд (до 32 px: строка текста, один контрол) линий не рисует. Окно при
открытии получает фокус и рамку вокруг себя не рисует. Кнопки в окне — `size="medium"` (32 px); порядок и
раскладка кнопок — по `PneModalActions`. Цвета берутся из `theme.palette.pne.modal`, тёмная тема — на нейтралях
pne-ui. Ширину окна задаёт потребитель (`containerSx`, `slotProps.container.sx`); минимальная — 400 px.

`blockingOverlay` предназначен для loading-состояния всей модалки. Пока slot присутствует, dialog получает
`aria-busy`, header/body/footer становятся inert, focus остаётся на границе dialog, а Escape, backdrop и close
button не вызывают `onClose`. После снятия overlay прежний focused control восстанавливается, если он всё ещё
существует.

`movable` разрешает двигать окно за шапку, `resizable` — менять размер за правый нижний угол; свойства
независимы, по умолчанию оба выключены. Окно начинает движение с того места и той ширины, где стояло, целиком
остаётся в пределах страницы (и когда уменьшается окно браузера или растёт содержимое) и при следующем открытии
снова стоит по центру. Размер меняется между минимумом и максимумом из стилей окна (`min-width`, `max-height` и
т. п.) и краями страницы; если стили минимума не задают, он равен 240 × 160 px или размеру окна при открытии, если
оно меньше. Тело занимает оставшуюся высоту и прокручивается, шапка и кнопки остаются на месте. Нажатие на
элемент управления в шапке (крестик, ссылка, кнопка) окно не двигает; текст шапки в двигаемом окне не выделяется.
Обработчик `slotProps.header.onPointerDown`, вызвавший `preventDefault()`, отменяет движение. Пока окно закрыто
`blockingOverlay`, оно не двигается и не меняет размер. Маркеры: `data-pne-modal-movable`,
`data-pne-modal-resizable`, во время действия — `data-pne-modal-action="move" | "resize"`; уголок —
`data-pne-modal-resize-handle`.

Внутренние части настраиваются через `slotProps`, но их element type, owned content и dialog semantics остаются
фиксированными. `modalProps` содержит только безопасные настройки MUI root и не позволяет подменять root/backdrop
slots.

Частые тестовые маркеры `data-*` передаются прямо в `PneModal` и попадают на семантический dialog container:
`<PneModal data-testattribute="edit-modal" ... />`. Для них не требуется обёртка `slotProps.container`;
этот slot остаётся для остальных безопасных атрибутов и `sx` контейнера.

`PneModalActions` сохраняет одни и те же keyed action nodes, но синхронизирует DOM/focus order с layout:
`leading → secondary → primary` на desktop и `primary → secondary → leading` на экране до 480 px. При смене
breakpoint существующие controls только перемещаются внутри дерева, не перемонтируются и не теряют focus/state.
Root фиксирован как `div`, поддерживает `ref`, `sx`, обычные HTML/ARIA/data attributes.

## PneSelect

`PneSelect` — controlled single-select для произвольного типа option. `value` имеет тип `T | null`, а `onChange`
получает выбранный `T`. Для строк и чисел key и label выводятся автоматически; объектам нужны явные
`getOptionKey` и `getOptionLabel`. Все option callbacks получают исходный объект, поэтому дополнительные поля не
нужно переносить во вспомогательную форму `{value, label}`.

`getOptionLabel` всегда возвращает plain `string`: он служит также accessible name для option. Rich JSX
передавайте отдельно через `renderOption`, сохраняя в `getOptionLabel` текстовый эквивалент.

Для HOC сначала зафиксируйте generic явным публичным props-типом: стандартный `ComponentProps<typeof PneSelect>`
не может представить сразу primitive и object overloads без потери точности.

```tsx
const RegionSelect = (props: PneSelectObjectProps<Region, string>) => <PneSelect {...props}/>
const MemoRegionSelect = memo(RegionSelect)
```

```tsx
type Region = {
    code: string
    disabled: boolean
    title: string
}

const [region, setRegion] = useState<Region | null>(null)

<PneSelect
    options={regions}
    value={region}
    onChange={setRegion}
    getOptionKey={option => option.code}
    getOptionLabel={option => option.title}
    getOptionDisabled={option => option.disabled}
    getOptionProps={option => ({'data-region': option.code})}
    placeholder="Please select"
/>
```

Компонент намеренно не публикует MUI-режимы `native`, `multiple`, `defaultValue`, custom input и input/slot escape
hatches: его контракт controlled, single и non-native. `ref` указывает на корневой `HTMLDivElement` внутреннего
MUI Select; `sx` и `fullWidth` применяются к внешнему FormControl. Для композиции
label/helper/error/required/fullWidth оборачивайте select в `PneField`.
`SelectDisplayProps` и `MenuProps` сохраняют styling/data/ARIA-настройки, но не позволяют заменить управляемые
combobox/listbox roles, keyboard/pointer handlers, identity или open/close lifecycle.
`getOptionProps` предназначен для неинтерактивных DOM-метаданных, ARIA, styling и `data-*`; содержимое option
задавайте через `renderOption`, disabled-состояние — через `getOptionDisabled`, а выбор обрабатывайте в `onChange`.

Мышью option выбирается только кликом; выбор с клавиатуры работает как в MUI. MUI Select с версии 9.0.1
выбирает ещё и option, над которым отпущена кнопка
мыши, если с нажатия на поле прошло 200 мс. Меню, которому не хватило места под полем, открывается поверх него,
и неторопливый клик по полю выбирал option, оказавшийся под курсором; в `PneSelect` такой выбор отключён.

`null` обозначает только пустое состояние и не может входить в `options`; `undefined` также не является option.
Ключи сериализуются в строки, поэтому после сериализации они должны быть уникальны; например, `1` и `"1"`
конфликтуют. Пустая строка зарезервирована для `null`. Если key текущего `value` отсутствует в `options`, select
показывает empty/placeholder state без MUI `out-of-range` warning и снова отображает значение после появления
совпадающей option.

При миграции object options передавайте в `value` сам выбранный объект или `null`, а не замаскированный через cast
numeric/string ID. `getOptionLabel`, `getOptionProps`, `getOptionDisabled`, `renderOption` и `renderValue` теперь
работают с исходным `T`, а не с нормализованным `{value, label}`.

Вид (UI Kit: поле с шевроном и Dropdown list). Поле выглядит как `PneTextField`: те же цвета `outlined` и `filled`,
кольцо по состояниям, цвет значения и подсказки; пока список открыт, поле остаётся в фокусе. Шеврон UI Kit 14px
(на месте иконки MUI и так же переворачивается) — цвета значения, у `disabled`
бледный; свой `IconComponent` по-прежнему можно передать, он сохраняет свой размер. Список — панель UI Kit: радиус 8, 4px от поля и 4px внутри, тонкое кольцо и тень всплывающей панели.
Строки со скруглением 4: наведение и подсветка с клавиатуры — Neutral/100, выбранная строка — Brand/100 с галочкой в
конце (галочку рисует CSS, в значение поля она не попадает), `disabled` — бледный текст без прозрачности MUI. Строка
списка высотой с поле и с его текстом: 24, 32 или 40 px по `size`; список показывает восемь строк, дальше
прокручивается. Шеврон стоит по центру кнопки значка (16 px у `small`, 20 px у остальных). Цвета берутся из `theme.palette.pne.dropdown` и `field`, тёмная тема — на
нейтралях pne-ui. `sx` из `MenuProps` применяется после вида списка.

Для своего меню или кнопки рядом со списками библиотеки: `createPneMenuPanelStyle(theme)` — панель списка,
`createPnePickedRowStyle(theme)` — выбранная строка с галочкой, значки `PneChevronDownIcon` и `PneCloseIcon`.

## PneAutocomplete

`PneAutocomplete` сохраняет MUI-контракт single/multiple, `disableClearable` и `freeSolo`, но не ограничивает
данные Paynet DTO. Для строк, чисел и структур `{id, displayName}` / `{choiceId, displayName}` key, label и
сравнение выводятся автоматически. `id` и `choiceId` могут быть строками или числами; восстановленный из API
объект считается выбранным по key, а не по ссылке. Значения разных форм (например, freeSolo-строка и объект)
всегда считаются различными и не приводят к исключению.

Для произвольного объекта обязательны `getOptionKey` и `getOptionLabel`. Явный key также становится default
правилом сравнения, если caller не передал `isOptionEqualToValue`:

```tsx
type Region = {code: string; title: string; disabled: boolean}

<PneAutocomplete
    options={regions}
    value={selectedRegion}
    onChange={(_event, value) => setSelectedRegion(value)}
    getOptionKey={region => region.code}
    getOptionLabel={region => region.title}
    getOptionDisabled={region => region.disabled}
    label="Region"
/>
```

Обычный `ref` указывает на фиксированный root `HTMLDivElement`, `inputRef` — на нативный `HTMLInputElement`.
`htmlInputProps` принимает только безопасные native metadata: `data-*`, name/ARIA и ограниченный набор
текстовых input-атрибутов. Lifecycle handlers, `value`, `id`, `role`, `disabled`, `readOnly` и другие управляемые
свойства задаются через API Autocomplete. Имя input автоматически переносится на portal listbox; это работает
для собственного `label`, внешнего `PneField`, `aria-label` и `aria-labelledby`.

Вид (UI Kit: поле и Dropdown list, у `PneAsyncAutocomplete` такой же). Поле — как у `PneTextField`. Шеврон и крестик
очистки — тонкие значки UI Kit 14px цвета значения, на местах значков MUI (крестик MUI показывает при наведении и в
фокусе). Значения `multiple` — бейджи UI Kit: скругление 4, цвета страницы с кольцом Neutral/300, тонкий крестик
удаления. Список — панель UI Kit, как у `PneSelect`: строки со скруглением 4, подсветка Neutral/100, выбранная
строка одиночного списка — Brand/100 с галочкой. В списке `multiple` в каждой строке флажок PneCheckbox, выбранные строки не
подкрашиваются. Строки, которые рисует потребитель (`renderOption`), остаются его: в списке `multiple` их выбранные
строки подкрашиваются, потому что флажок у них может быть свой. Подписи групп `groupBy` — 12px Neutral/600 с линией
между группами; строки «загрузка» и «ничего не найдено» — по центру, Neutral/600, ошибка загрузки
`PneAsyncAutocomplete` — красным, со значком предупреждения. Размеры по `size`, как у поля: строка списка
24/32/40 px с текстом поля, флажок 14/16/20 px, служебная строка высотой в две обычные, в списке восемь строк и
дальше прокрутка; бейджи значений на 8 px ниже поля (16/24/32 px) с 4 px вокруг; кнопки шеврона и крестика 16 px
у `small` и 20 px у остальных. У `PneAsyncAutocomplete` спиннер загрузки крутится в строке «загрузка» списка, не в
поле. Свои `popupIcon`, `clearIcon`, значок
удаления в `slotProps.chip` и `sx` в `slotProps.paper` по-прежнему можно передать. Цвета — `theme.palette.pne.dropdown`.

## PneAsyncAutocomplete

`PneAsyncAutocomplete` владеет remote options, loading и отключением локальной MUI-фильтрации. Loader получает
plain query и контекст запроса:

```tsx
<PneAsyncAutocomplete
    value={merchant}
    onChange={(_event, value) => setMerchant(value)}
    loadOptions={(query, {signal}) => api.searchMerchants({query, signal})}
    reloadKey={manager?.id}
    minQueryLength={2}
    label="Merchant"
/>
```

```ts
type PneLoadOptions<T> = (
    query: string,
    context: {
        signal: AbortSignal
        reason: 'open' | 'input' | 'clear' | 'reload'
    },
) => Promise<readonly T[]>
```

Новый запрос отменяет предыдущий через `AbortSignal` и дополнительно защищён request ID на случай, если loader
игнорирует signal. Закрытие и unmount также отменяют активный запрос. Sync throw и rejected Promise переходят в
одно error-состояние; `AbortError` ошибкой не считается. `loadErrorText`, `minQueryLengthText`, MUI
`loadingText` и `noOptionsText` разделяют error/min-query/loading/empty состояния и объявляются assistive
technology. На время новой загрузки прежние варианты из списка убираются.

`open` и `inputValue` поддерживают controlled и uncontrolled режимы с исходными MUI callbacks/reasons.
Изменение identity `loadOptions` не перезапускает открытый поиск: для реальной зависимости результата от
manager/status/currency передавайте стабильный primitive `reloadKey`.

Компонент намеренно не делает debounce и вызывает loader сразу для `open`, пользовательского `input`, `clear`
и изменения `reloadKey`. Если сервисный метод уже обёрнут React/service debounce-декоратором, дополнительного
слоя в компоненте нет и конфликтовать с ним нечему.

Props `options`, `loading` и `filterOptions` не входят в async API: ими владеет компонент.

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

Компонент-обёртка `AutoTestAttribute` удалён из библиотеки. Вместо `<AutoTestAttribute id="…" value={…}>`
вокруг элемента разверните `createAutoTestAttributes(id, value)` на самом элементе; custom component обязан
передать неизвестные DOM props на нужный элемент.

### PneTable

Вид каркаса (UI Kit Cell и Table row). Строка тела — 40 px при одной строке текста: ячейка `PneTableCell` 14/20
Neutral/900 с 12 px по бокам, под каждой строкой, кроме последней, линия 1 px Neutral/200. Строка под указателем
заливается Neutral/100 (`PneTableRow hover={false}` отключает), выбранная (`selected` у строки и у ячеек) — Brand/100
и остаётся такой под указателем. Заголовок `PneHeaderTableCell` — 14/20 SemiBold над такой же линией. Знак
сортировки `PneTableSortLabel` — две стрелки UI Kit рядом с подписью, видны всегда: у неотсортированной колонки обе
серые (под указателем — цвета ссылки), у отсортированной направление в силе — цвета ссылки, второе приглушено;
подпись сохраняет цвет заголовка. Цвета берутся из `theme.palette.pne.table`. Для видов значений UI Kit есть
готовые ячейки: число, ссылка и псевдоссылка, действия строки, раскрытие строки, переключатель — см. «Виды ячеек
таблицы». Ячейки статуса в библиотеке нет: её содержимое рисует экран.

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

`createRow` и `createTableHeader` — обычные функции: таблица вызывает их во время своего рендера и держит
построенные строки, пока не поменяются `data` и сама функция. Хуков в них быть не должно: они станут хуками
таблицы, их число будет меняться от рендера к рендеру, и страница упадёт. Строка со своим состоянием (меню,
раскрытие) — отдельный компонент, который возвращает `createRow`, или состояние на уровне страницы.

Основные якоря таблицы (полный список — в «Справочнике Selenium-якорей», раздел `PneTable`):

- пагинации: `data-autotest="pagination"` со значением `top` или `bottom`; action IDs ищутся внутри этого scope;
- загрузка: `aria-busy` на semantic table;
- пустой результат: существующая строка `data-autotest="empty-state"`;
- disabled/checked/selected состояния: только нативные DOM/ARIA-свойства, без test-only копий.

#### Полосы управления

Вид полос (UI Kit Paginations, Tabs, Button group). Кнопки полос над таблицей и под ней — страницы, размеры
страницы, виды `PneTableViewSelector`, свои кнопки полосы — это маленькие кнопки UI Kit Tertiary: высота 24px,
квадратные — 24×24, подпись 12/16 Medium цвета Neutral/700 на серой заливке Neutral/100; под указателем подпись
принимает цвет текста бренда, нажатие темнит заливку, кольцо фокуса стоит внутри кнопки. Группы стоят в
оболочках высотой 32px со скруглением 8, кольцом 1px и 4px вокруг кнопок и между ними: навигация по страницам
и размеры страницы — в белой (действия над строками), виды — в серой Neutral/100 (как вкладки). Текущий размер
страницы залит цветом бренда (UI Kit Primary); выбранный вид — белая кнопка с тенью вкладки, подпись не
меняется. Диапазон строк («1 - 50») — подпись в виде соседних кнопок. Группы в одной строке стоят через 8px,
строки, на которые полоса переносится на узком экране, — через 4px. Значки страниц — 14px цвета своей кнопки.
Действия вида (`PneTableColumnSettingsAction`, кнопки-иконки в `actions` вида) — Icon action UI Kit: квадрат
24px со значком 14px без заливки, под указателем меняется только цвет значка.

Свои кнопки полосы (выбор строк, меню массовых действий) — `PneTableControlButton`: та же маленькая кнопка
Tertiary. `menu` добавляет шеврон 14px, `emphasis='strong'` даёт включённой кнопке цвет значения
(Neutral/900, главное действие выбора), у выключенной подпись бледная при любом `emphasis`.
`PneTableSelectionControls` ставит всё через 4px; счётчик (`summary`) — строка 24px, 14/20 цветом значения,
первое действие стоит в 12px от него; без `summary` его нет вовсе, так что пока ничего не выбрано, его можно
не передавать. Ячейки выбора (`PneTableSelectionCell`, `PneTableSelectionHeaderCell`) — UI Kit Cell: Checkbox:
флажок 20px с 8px по бокам, колонка 36px; вся ширина ячейки — зона нажатия.

Пустая таблица (UI Kit Empty state, только вид): сообщение `noRowsMessage` стоит по центру под значком поиска
в круге 48px, 14/20 Medium, с отступами 32px сверху и снизу. Описания и действия у пустой таблицы нет: она
знает только своё сообщение.

Заголовок таблицы бывает двух видов, пропс `headerVariant` (UI Kit Cell/Header и Cell/Header-island). `main`
(по умолчанию) — таблица является главным блоком страницы: строка 40px, 14/20 SemiBold над тонкой линией.
`island` — на странице несколько таблиц или таблица делит блок с заголовком и другим содержимым: полоса 24px
на заливке Neutral/100 со скруглением 4px, текст 12/16 Medium цветом Neutral/700, линии под ней нет. Ячейки
заголовка (`PneHeaderTableCell`) узнают вид от таблицы сами, им ничего передавать не нужно. Флажок выбора
страницы выше полосы (36px), поэтому таблице с выбором строк `island` не подходит.

Загрузка (UI Kit Skeleton/Line): вместо текста в ячейках стоят полоски 12px с радиусом 2 на заливке
Neutral/100 с мягкой пульсацией 1.4 с; строка, пока вид не показан с данными, — 40px (`skeletonRowHeight`
задаёт другую). Сколько полосок в высокой строке и какой они ширины, таблица решает сама, как и раньше.

Подсказки при наведении (через 300 мс, как у настройки колонок; на пагинации их нет): у видов
`PneTableViewSelector` — «Switch to <вид>», у выбранного — «<вид> — current view» (ключи `pneTable.views.switchTo`
и `pneTable.views.current`, у выключенного вида подсказки нет); у `PneTableControlButton` — проп `tooltip`, текст
задаёт страница своими ключами. Подсказка видна и на выключенной кнопке и не меняет её имя: подпись кнопки
остаётся её доступным именем.

#### Выбор строк

`useTableSelection` хранит выбор в одной из двух взаимоисключающих форм:

- `explicit` — явно выбранные стабильные ID;
- `allMatching` — все selectable-строки текущей применённой выдачи, кроме `excludedIds`.

Header checkbox управляет только загруженной страницей. Выбор всей выдачи является отдельным действием:
consumer получает точное число selectable-результатов от своего API и передаёт его в
`selectAllMatching(matchingCount)`. `matchingCount`, `excludedIds`, `isRowSelectable` и backend query обязаны
описывать один и тот же applied-result scope. Сериализацию `Set` и domain request выполняйте только на границе
приложения.

```tsx
const selection = useTableSelection({
    rows: orders,
    getRowId: order => order.id,
    maxSelected: 20_000,
    scopeKey: appliedSearchFingerprint,
})

<PneTable<Order>
    autoTestId="orders"
    tableAriaLabel="Orders"
    data={orders}
    createTableHeader={() => <PneTableRow>
        <PneTableSelectionHeaderCell
            aria-label="Select current page"
            state={selection.pageState}
            disabled={selection.interactionDisabled || selection.pageSelectableCount === 0}
            onChange={selection.setPageSelected}
        />
        {/* business headers */}
    </PneTableRow>}
    createRow={order => <PneTableRow
        key={order.id}
        selected={selection.isRowSelected(order)}
        aria-selected={selection.isRowSelected(order)}
    >
        <PneTableSelectionCell
            aria-label={`Select order ${order.id}`}
            checked={selection.isRowSelected(order)}
            disabled={selection.interactionDisabled || !selection.isRowSelectable(order)}
            onChange={checked => selection.setRowSelected(order, checked)}
        />
        {/* business cells */}
    </PneTableRow>}
    feedback={consumerOwnedLimitWarning}
    toolbar={<PneTableToolbar
        aria-label="Table controls"
        contextual={<PneTableSelectionControls
            summary={`${selection.selectedCount} selected`}
            actions={consumerOwnedBulkActions}
        />}
        persistent={optionalViewSelector}
    />}
    /* остальные props */
/>
```

`maxSelected` отклоняет всю row/page/all-matching операцию атомарно: возвращённый
`TableSelectionUpdate.limitExceeded` равен `true`, а модель не меняется. Смена primitive `scopeKey` очищает
выбор; pagination, sort и refresh не должны входить в этот ключ. В controlled-режиме consumer обязан принять
scope-reset и вернуть canonical empty-модель `{mode: 'explicit', selectedIds: new Set()}`.

`PneTableToolbar` объединяет contextual selection controls и persistent View controls в существующей верхней
полосе таблицы. Раскладка полностью определяется CSS: каждая группа контролов запрашивает свою естественную
ширину в одну строку (`flex-basis: max-content`), поэтому не поместившаяся группа переносится целиком, а
сжимается и переносится внутри себя только получив отдельную строку.

Полоса пагинации построена на container query (`container-type: inline-size`), то есть реагирует на
собственную ширину, а не на viewport: таблица в узкой колонке ведёт себя как на узком экране. Обе половины
пагинации — навигация и размеры страницы — лежат в одной группе, которую тулбар не может разделить: в широкой
раскладке группа прозрачна (`display: contents`) и тулбар стоит между её половинами через grid-области, а в
узкой становится собственной строкой и переносит размеры страницы под навигацию ровно тогда, когда они
перестают помещаться рядом — при любой локализации и любой метке страницы.

Порог, на котором тулбар перестаёт делить строку с пагинацией, вычисляется из содержимого: естественные
ширины тулбара, навигации и размеров страницы измеряются при монтировании и при смене контента. Содержимое
toolbar задаёт consumer и оно у каждой страницы своё — от пустого (чаще всего) до полосы гейтов с выбором
строк, батчевыми операциями и View, — поэтому константа тут не работает: на фикстурах библиотеки требуемая
ширина меняется от ~590px до ~1330px. Измеряется только естественная ширина контента, которая не зависит от
выбранной раскладки, поэтому обратной связи не возникает и `ResizeObserver` не нужен.
`PaginatorProps.controlRowBreakpoints.toolbar` позволяет задать порог вручную, но в норме этого не требуется.

Минимальная поддерживаемая ширина — 360px.

Ни один из компонентов не измеряет собственный результат и не использует `ResizeObserver`, поэтому раскладка
не может зациклиться на дробных CSS-пикселях (page zoom, масштаб ОС). DOM-порядок постоянен: тулбар, затем
пагинация одной группой — он совпадает с визуальным во всех перенесённых раскладках; в самой широкой
раскладке все три группы стоят рядом в одной строке. Поддерживаемая ширина viewport 360px сохранена.

`PneTable.feedback` — отдельный full-width slot над всей верхней полосой. Warning, error и informational alert
нужно передавать туда, а не внутрь toolbar: feedback лежит вне полосы контролов и поэтому не меняет их
раскладку даже при переносе текста на несколько строк.

#### Выбор строк в SearchUI

`SearchUI.tableSelection` добавляет тот же controller к consumer-owned header/row factories и автоматически
связывает его scope с применёнными критериями поиска. Draft-фильтры manual search, page, page size, sort и
value-equivalent refresh сохраняют выбор. Новые применённые критерии очищают его. При настроенных Views в scope
по умолчанию входит фактически выбранный View; `preserveAcrossViews` включайте только для Views с одинаковой
семантикой строк и совместимыми ID.

```tsx
<SearchUI<Order, OrderViewId, number>
    /* search props */
    tableSelection={{
        selection,
        onSelectionChange: setSelection,
        getRowId: order => order.id,
        maxSelected: knownClientLimit,
        resolveAllMatchingCount: async ({appliedSearchCriteria, viewId}) => {
            const summary = await getSelectionSummary(appliedSearchCriteria, viewId)
            if (summary.limitExceeded) {
                showConsumerOwnedLimitWarning(summary.selectionLimit)
                throw new Error('Selection limit exceeded')
            }
            return summary.matchingCount
        },
        renderControls: ({selection: controller}) => (
            <PneTableSelectionControls
                summary={`${controller.selectedCount} selected`}
                actions={<button
                    disabled={controller.interactionDisabled}
                    onClick={() => controller.selectAllMatchingResults?.().catch(handleSelectionError)}
                >
                    Select all results
                </button>}
            />
        ),
        renderFeedback: ({selection: controller}) => (
            controller.selectingAllMatching ? 'Selecting…' : selectionFeedback
        ),
        toolbarAriaLabel: 'Order table controls',
    }}
    createTableHeader={(params, context) => {
        const controller = context?.selection
        if (!controller) throw new Error('Table selection context is required')
        return <>{/* explicit selection cell + headers */}</>
    }}
    createTableRow={(row, index, data, setData, context) => {
        const controller = context?.selection
        if (!controller) throw new Error('Table selection context is required')
        return <>{/* explicit selection cell + business cells */}</>
    }}
/>
```

Factory context optional только для source compatibility с прежними прямыми вызовами фабрик; сам `SearchUI`
всегда передаёт context, а `selection` присутствует при настроенном `tableSelection`. Selection-aware consumer
всё равно должен сделать явный guard/assertion, чтобы его callback оставался корректным вне вызова из `SearchUI`.

`resolveAllMatchingCount` получает snapshot применённых критериев и resolved View. На один SearchUI допускается
один in-flight запрос: повторный вызов возвращает тот же Promise, controller временно блокирует selection, а
ответ применяется только к той же occurrence scope. Старые ответы после `A → B → A`, unmount, смены
`maxSelected` или consumer `disabled` игнорируются. Активная ошибка возвращается caller-коду, после чего controller
снова доступен. Same-scope refresh/pagination/sort не отменяют запрос. Уже начатый запрос детерминированно
завершается тем resolver, с которым он был запущен: замена callback действует со следующего запроса, а удаление
resolver отменяет pending work.

Если backend возвращает typed summary, consumer должен обработать server `limitExceeded` до возврата count.
`maxSelected` — синхронный client-side guard, а не замена повторной серверной проверке при batch operation.

Selection не записывается в SearchUI retention/profile/browser storage. Uncontrolled selection исчезает при
remount. В controlled-режиме lifetime принадлежит consumer: если state намеренно расположен выше размонтируемого
экрана, consumer сам должен очистить его при navigation/remount. Строковое представление applied scope остаётся
в памяти библиотеки и не выводится в DOM/storage.

#### Настройка колонок

Пользовательский состав колонок для одного view таблицы. Библиотека не знает, где хранится настройка:
consumer передаёт загруженное значение и колбэк сохранения, а получает упорядоченный список видимых колонок.

- Каталог — массив `PneTableColumnOption` (`id`, текстовый `label`, `defaultVisible`) в порядке по умолчанию.
  `id` стабилен и не зависит от языка и позиции; поля consumer-типа (например, `render`) сохраняются
  в `visibleColumns`. `id` обязан соответствовать шаблону `[A-Za-z0-9][A-Za-z0-9._-]*`: он попадает
  в ключи хранения, DOM id, Selenium-локаторы и идентификаторы перетаскивания. Пустой каталог, повтор `id`
  или `id` вне шаблона — ошибка при первом рендере, а не при сохранении.
- Значение `PneTableColumnSettingsValue` — `visibleColumnIds` в порядке отображения и `hiddenColumnIds`.
  Колонки каталога, отсутствующие в обоих списках, считаются новыми и показываются; неизвестные `id`
  отбрасываются; значение без видимых колонок заменяется умолчанием.
- `usePneTableColumnSettings({columns, value, onSave})` сверяет значение с каталогом и владеет состоянием
  окна. Для нескольких view создавайте по одному хуку на view.
- `PneTableColumnSettingsAction` — кнопка вызова (`variant='icon'` для слота `actions` селектора view,
  `variant='button'` для широкой панели). `PneTableColumnSettingsDialog` — модальное окно: поиск, один
  чеклист по каталогу, «Reset to default», «Cancel», «Save». Последняя видимая колонка не снимается:
  её строка заблокирована, подсказка показывается tooltip-ом при наведении.
- Вид строки — UI Kit Table/Column row: 36px, флажок 20px вровень с полем поиска, подпись 14/20 в 8px от
  него, справа ручка перетаскивания — Icon action 24px с шестью точками. Нажимается вся строка, но под
  указателем она не заливается; с клавиатуры строку обводит кольцо фокуса. Поле поиска — размера по
  умолчанию (32px), строки начинаются в 16px под ним.
- Порядок строк фиксируется при открытии: видимые колонки в порядке отображения, затем скрытые.
  Переключение галочки строку не двигает, поэтому скрытая и снова включённая колонка остаётся на своём
  месте; порядок меняют только перетаскивание и «Reset to default». При Save порядок видимых колонок —
  порядок отмеченных строк в списке.
- Видимые колонки переставляются перетаскиванием за отдельную ручку (мышь, клавиатура: Space, стрелки,
  Space; тач без задержки). Ручки показываются только у видимых колонок и только без активного поиска;
  `reorderable={false}` отключает перестановку. Список растёт с высотой окна и прокручивается сам.
  Перетаскиваемая строка рендерится клоном в `document.body` (`renderClone`): контейнер `PneModal`
  центрируется через `transform`, и строка с `position: fixed` внутри него уезжала за пределы
  поверхности и обрезалась.
- `onSave` получает нормализованное значение. Окно закрывается после resolve; при reject остаётся открытым
  с черновиком, сообщение об ошибке показывает consumer.
- Колонки без текстового заголовка (выбор строки, кнопки действий, impersonate) тоже описываются в каталоге:
  `label` задаёт их имя в диалоге, а заголовок на странице остаётся пустым или элементом управления.
  Вне каталога колонки оставлять не нужно.

```tsx
const columns = [
    {id: 'id', label: 'ID'},
    {id: 'name', label: 'Name'},
    {id: 'email', label: 'Email', defaultVisible: false},
] as const satisfies readonly PneTableColumnOption[]

const settings = usePneTableColumnSettings({
    columns,
    value: storedValue,            // PneTableColumnSettingsValue | undefined
    onSave: value => api.save(value),
})

<PneTable<Row>
    autoTestId="items"
    data={rows}
    toolbar={<PneTableToolbar
        aria-label="Items table controls"
        persistent={<PneTableColumnSettingsAction autoTestId="items" onClick={settings.openDialog}/>}
    />}
    createTableHeader={() => <PneTableRow>
        {settings.visibleColumns.map(column => (
            <PneHeaderTableCell key={column.id}>{column.label}</PneHeaderTableCell>
        ))}
    </PneTableRow>}
    createRow={row => <PneTableRow key={row.id}>
        {settings.visibleColumns.map(column => (
            <PneTableCell key={column.id}>{row[column.id]}</PneTableCell>
        ))}
    </PneTableRow>}
/>
<PneTableColumnSettingsDialog {...settings.dialogProps} autoTestId="items"/>
```

Ключи локализации задаются в библиотеке с английским `defaultValue`: `pneTable.columnSettings.action`,
`.title`, `.search`, `.reset`, `.cancel`, `.save`, `.noMatches`, `.lastVisible`, `.reorder` (с `{{name}}`).

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

- `toggle-filters` — native button «Filters» с шевроном в заголовке панели
  (`[data-autotest="filters-header"]`); рядом с ней, не внутри, число критериев
  `[data-autotest="filters-count"]` — оно видно и в развёрнутой панели; состояние панели находится в
  `aria-expanded`, связь с панелью — в `aria-controls`. Кнопка есть, только когда в панели есть критерии и не
  задан `hideShowFiltersButton`; иначе «Filters» — подпись без локатора. `templates` всегда стоит в заголовке.
  `add-filter`, `clear-all` и `run-search` стоят в нижней полосе `[data-autotest="filters-footer"]`, пока панель
  развёрнута и в ней есть критерии; в свёрнутой панели и в панели без критериев они стоят в заголовке, а
  `filters-footer` в DOM нет;
- `clear-all` и `run-search` — реальные кнопки; доступность запуска поиска проверяется через native `disabled`
  (`run-search` одинаков для режимов Search и Refresh). `clear-all` есть только при скрытом меню шаблонов
  (`hideTemplatesSelect`); с меню к умолчаниям возвращает его пункт `select-default-template`;
- `templates` — native button с `aria-expanded` и open-state `aria-controls`;
- `add-filter` — native button с меню, как `templates`: `aria-haspopup="menu"`, `aria-expanded` и open-state
  `aria-controls`;
- `clear-criterion` и `remove-criterion` — native `button type="button"` внутри соответствующего
  `criterion/<raw type>`; remove отсутствует у non-removable predefined-критерия.

Часть roots/actions условна: критерий, `toggle-filters`, `filters-count`, `filters-footer`, `clear-all`,
`run-search`, `remove-criterion`, templates и add-filter могут отсутствовать из-за `config` или текущего
состояния. В свёрнутой панели строк `criterion` в DOM нет; `run-search` нет при `hideRefreshButton` без
`manualSearch`; `clear-all` нет, когда очищать нечего. Такое отсутствие является состоянием UI, а не ошибкой
locator contract.
Критерий из `hiddenCriteria` активного вида таблицы не имеет root `criterion` и не предлагается в add-filter;
исключение — значение, которое блокирует поиск (ошибка валидации): тогда строка остаётся. Критерий из
`disabledCriteria` остаётся в DOM с `aria-disabled="true"` на значении.

Панель — рамка с двумя полосами. Root `search-filters` имеет `role="region"` с именем «Filters». В заголовке
`filters-header` слева стоят `toggle-filters` и `filters-count`, справа — `templates`. В нижней полосе
`filters-footer` слева стоит `add-filter`, справа — `clear-all` и `run-search`. В строке критерия
`clear-criterion` и `remove-criterion` стоят первыми, перед названием и значением; в DOM `clear-criterion` идёт
раньше `remove-criterion`. На порядок дочерних элементов внутри `criterion` полагаться нельзя.

Пока хост не ответил, свёрнута ли панель и какой набор выбран, на её месте стоит скелетон
`search-filters-skeleton/<scope>` (`aria-busy="true"`): `search-filters/<scope>` появляется после него.

Popover и modal рендерятся через React portal вне `search-filters`, поэтому Selenium должен искать их отдельно
по тому же owner scope:

```css
[data-autotest="templates-panel"][data-autotest-value="orders"]
[data-autotest="add-filter-options"][data-autotest-value="orders"]
[data-autotest="template-editor"][data-autotest-value="orders"]
```

`templates-panel` и `add-filter-options` — MUI menu (`role="menu"`), `template-editor` — dialog.
Generated IDs из `aria-controls` не хардкодируйте: при необходимости считывайте ID у trigger во время теста;
стабильным owner locator остаётся `data-autotest` + scope. Строки сохранённых шаблонов отмечены одинаковым
`template-item` без value; внутри используются `select-template`, `remove-template` и `reorder-template` — если
хост сохраняет порядок, шаблонов больше одного и список не отфильтрован. Имя шаблона остаётся видимым
пользовательским значением и доступным именем, но намеренно не попадает в `data-autotest-value`. Список
открывает пункт `select-default-template` («Default»); от 10 шаблонов над ним стоит поле `template-search`, и
пока в нём есть текст, пункта «Default» нет. Действия меню — `create-template`, `update-template` (пока шаблон
применён) и `discard-template-changes` (пока применённый шаблон изменён).
Icon-only закрытие editor имеет `close-template-editor`; поле имени, Create и Cancel остаются стандартными
required textbox/text buttons и ищутся по role/name внутри scoped editor.

Обычные inputs, text buttons, options, checkboxes и switches ищите по native role/name и проверяйте их native/ARIA
state. Не используйте MUI classes, SVG/path, DOM depth, array index, переведённый текст как технический ID или
сгенерированный `aria-controls` ID.

## Справочник Selenium-якорей `pne-ui`

Документ предназначен для тестировщиков, которые пишут Selenium-автотесты. Здесь перечислены готовые
стабильные якоря `PneTable`, `SearchUI`, `SearchUIFilters`, всех 37 типов критериев и вынесенных в portal
панелей. Искать нужный элемент по JSX, структуре MUI или случайным классам не требуется.

Примеры ниже используют CSS selectors, поддерживаемые обычным Selenium WebDriver. Это справочник публичного
DOM-контракта, а не руководство по реализации компонентов библиотеки.

### Быстрый старт

Тест всегда проходит три уровня:

1. Находит scope экземпляра компонента.
2. Внутри scope находит смысловой slot/action/control.
3. Читает состояние из native DOM или ARIA, а не из отдельной test-only копии.

Три служебных атрибута имеют разные назначения:

| Атрибут | Назначение |
|---|---|
| `data-autotest` | Стабильное имя slot/action/control |
| `data-autotest-value` | Scope экземпляра или raw domain/enum ID |
| `data-autotest-criterion` | Raw `CriterionTypeEnum` владельца portal-контента |

Короткая запись, используемая дальше в документе:

```text
slot/value
= [data-autotest="<slot>"][data-autotest-value="<value>"]

portal/scope + criterion
= [data-autotest="<portal>"][data-autotest-value="<scope>"][data-autotest-criterion="<criterion>"]
```

`<scope>` в примерах ниже — стабильное имя конкретного экземпляра компонента на странице, например `orders`.
У нескольких таблиц scopes обязаны различаться. SearchUI и связанная таблица результатов используют общий
scope.

`data-autotest-value` не является универсальным полем состояния. В зависимости от якоря это scope либо raw
domain/enum ID. Введённый текст и состояния `checked/disabled` Selenium читает из настоящего DOM-свойства или
ARIA.

#### Пример scoped lookup

```java
WebElement filters = driver.findElement(By.cssSelector(
    "[data-autotest='search-filters'][data-autotest-value='orders']"
));

WebElement status = filters.findElement(By.cssSelector(
    "[data-autotest='criterion'][data-autotest-value='STATUS']"
));

WebElement enabled = status.findElement(By.cssSelector(
    "[data-autotest='criterion-option'][data-autotest-value='ENABLED']"
));

enabled.click();
assertEquals("true", enabled.getAttribute("aria-pressed"));
```

Эти lookup-операции удобно инкапсулировать в Selenium Page/Component Object. Selenium штатно поддерживает
поиск от найденного `WebElement`, поэтому внутренний selector не обязан быть глобально уникальным на всей
странице.

### Как читать состояние

| Состояние | Источник истины в Selenium/DOM |
|---|---|
| Enabled/disabled native control | `element.isEnabled()`; native `disabled` присутствует только у disabled |
| Enabled/disabled MUI control с `role="combobox"` | `aria-disabled="true"` у disabled; у enabled атрибут отсутствует |
| Checkbox/radio/switch на native input | `element.isSelected()` или DOM property `checked` |
| Custom switch/checkbox | `aria-checked` |
| Toggle button | `aria-pressed` |
| Option | `aria-selected` |
| Открыт/закрыт trigger | `aria-expanded`; связь с popup — текущее `aria-controls` |
| Loading | `aria-busy` |
| Активная сортировка | `aria-sort="ascending|descending"` на semantic `<th>` |
| Текущая страница semantic Pagination | `aria-current="page"` |
| Значение input | DOM property `value` |

Не ожидайте `disabled="false"`: `disabled` является boolean HTML attribute. Если он присутствует, control
отключён независимо от текстового значения атрибута.

### `PneTable`

#### Scope экземпляра

```css
[data-autotest="table"][data-autotest-value="orders"]
```

`PneTable` может повторяться на одной странице, поэтому для нового page contract значение `<scope>` является
обязательной частью локатора и должно быть уникальным для каждой логической таблицы. Конкретное значение
задаёт интеграция страницы через `autoTestId`; оно должно быть зафиксировано в тестовых данных/Page Object.
Пример `orders` ниже иллюстративный. Не заменяйте scope заголовком, текущим переводом, порядковым номером или
именем WhiteLabel.

Технически legacy-страница ещё может отрендерить только `[data-autotest="table"]` без value. Такой selector
не различает несколько таблиц: для страницы, входящей в автоматизацию, отсутствие согласованного scope нужно
фиксировать как пробел page-level контракта.

Таблица результатов SearchUI получает тот же scope, что SearchUI:

```css
[data-autotest="table"][data-autotest-value="orders"]
```

#### Внутренние элементы

| Элемент | Selector относительно table scope | Состояние |
|---|---|---|
| Верхняя пагинация | `[data-autotest="pagination"][data-autotest-value="top"]` | Native button `disabled`; `current-page` внутри |
| Нижняя пагинация | `[data-autotest="pagination"][data-autotest-value="bottom"]` | Native button `disabled`; `current-page` внутри |
| Feedback над таблицей | `[data-autotest="table-feedback"]` | Full-width slot перед верхней полосой; alert/status semantics задаёт consumer |
| Общая полоса контролов | `[data-autotest="table-control-bar"]` | Раскладка определяется CSS; состояние в атрибуте не публикуется |
| Выбор текущей страницы | `input[data-autotest="page-selection"]` | Native `checked`, `disabled`, `aria-checked="mixed"` |
| Выбор строки | `input[data-autotest="row-selection"]` | Native `checked`, `disabled`; consumer может задать `autoTestId`/`autoTestValue` |
| Selection summary/actions | `[data-autotest="selection-summary"]`, `[data-autotest="selection-actions"]` | Summary является polite live status и есть только тогда, когда страница его передаёт (обычно — пока что-то выбрано); `selection-actions` — прозрачная группа (`display: contents`) без собственного бокса, действия внутри неё надо адресовать напрямую |
| Пустой результат | `[data-autotest="empty-state"]` | Наличие существующей empty row |
| Загрузка | Semantic `table` | `aria-busy="true|false"` |
| Активная сортировка | `th[aria-sort="ascending"], th[aria-sort="descending"]` | Значение `aria-sort` |
| Кнопка настройки колонок | `[data-autotest="column-settings"][data-autotest-value="<scope>"]` | Native button `disabled`; `<scope>` задаёт consumer через `autoTestId` |
| Окно настройки колонок | `[data-autotest="column-settings-dialog"][data-autotest-value="<scope>"]` | Существование `role="dialog"`; внутри `column-settings-search`, `column-settings-reset`, `column-settings-cancel`, `column-settings-save` |
| Колонка в окне настройки | `input[data-autotest="column-settings-option"][data-autotest-value="<columnId>"]` | Native `checked`, `disabled`; при открытии порядок в DOM = порядок отображения, скрытые в конце; переключение галочки строку не двигает |
| Ручка перестановки колонки | `button[data-autotest="column-settings-reorder"][data-autotest-value="<columnId>"]` | Есть только у видимых колонок без активного поиска; keyboard: Space, ArrowUp/ArrowDown, Space |
| Пустой поиск по колонкам | `[data-autotest="column-settings-empty"]` | Наличие строки |
| Виды таблицы | `[data-autotest="table-views"][data-autotest-value="<scope>"]` | Группа; в SearchUI scope тот же, что у фильтров и таблицы |
| Вид | `button[data-autotest="table-view"][data-autotest-value="<viewId>"]` | `aria-pressed`, native `disabled` |
| Действия вида | `[data-autotest="table-view-actions"]` | Есть, только если страница передала действия |
| Раскрытие строки | `button[data-autotest="row-expand"]` | `aria-expanded`; consumer может задать `autoTestId`/`autoTestValue` |
| Переключатель в ячейке | `input[data-autotest="table-switch"]` | Native `checked`, `disabled`; consumer может задать `autoTestId`/`autoTestValue` |

Внутри каждого `pagination/top|bottom` уже существуют:

- `[data-autotest="first-page"]`, `[data-autotest="prev-page"]`, `[data-autotest="next-page"]` — actual native
  buttons; доступность через `isEnabled()`;
- `[data-autotest="current-page"]` — отображаемый текущий диапазон/номер;
- `[data-autotest="page-sizes"][data-autotest-value="<current size>"]` — группа размеров и текущее raw value;
- `[data-autotest="page-size"][data-autotest-value="<raw size>"]` — конкретный вариант.

Отдельной last-page кнопки нет. Конец списка определяется disabled-состоянием `next-page`.

У библиотеки нет универсальных якорей business-строк и business-колонок: их identity определяется конкретной
страницей. Если странице нужны локаторы вида `row/<orderId>` или `cell/<columnKey>`, они должны быть описаны в
контракте этой страницы, а не угадываться по позиции строки или тексту ячейки.

### SearchUI/SearchUIFilters

На текущих продуктовых страницах обычно присутствует один SearchUI/SearchUIFilters. Его scope задаётся
страницей или наследуется из стабильного `settingsContextName`. Если в DOM окажутся два экземпляра, они будут
иметь разные scopes.

Не ожидайте общего DOM-wrapper вокруг SearchUI. Фильтры и результаты — отдельные roots с одним scope:

```css
[data-autotest="search-filters"][data-autotest-value="orders"]
[data-autotest="table"][data-autotest-value="orders"]
```

Каждый критерий ищется внутри filter scope по raw enum:

```css
[data-autotest="criterion"][data-autotest-value="STATUS"]
```

#### Общие actions

Selectors ниже относительны к `search-filters/<scope>`.

| Action | Selector | Состояние/примечание |
|---|---|---|
| Показать/скрыть фильтры | `[data-autotest="toggle-filters"]` | Native button «Filters» в заголовке панели `[data-autotest="filters-header"]`; `aria-expanded`, `aria-controls`. Есть, только пока в панели есть хотя бы один критерий и не задан `hideShowFiltersButton` |
| Число критериев | `[data-autotest="filters-count"]` | Стоит в `filters-header` рядом с `toggle-filters`, не внутри неё; видно и в свёрнутой, и в развёрнутой панели; без критериев отсутствует |
| Очистить всё | `[data-autotest="clear-all"]` | Только при `hideTemplatesSelect` и пока есть что сбрасывать; иначе — `select-default-template` в меню шаблонов. Undo-snackbar — «All filters cleared» (`react.searchUI.clearAll.cleared`) |
| Запустить поиск/refresh | `[data-autotest="run-search"]` | Native `disabled`/`isEnabled()` |
| Шаблоны | `[data-autotest="templates"]` | Native button, `aria-expanded`, `aria-controls` |
| Добавить фильтр | `[data-autotest="add-filter"]` | Native button, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` |
| Очистить критерий | `[data-autotest="clear-criterion"]` | Native button внутри criterion root |
| Удалить критерий | `[data-autotest="remove-criterion"]` | Отсутствует у non-removable predefined criterion |

`toggle-filters`, `filters-count`, `clear-all`, `run-search`, templates, add-filter и отдельные criterion actions
могут отсутствовать из-за config или текущего состояния. Это условный UI, а не нарушение locator contract.

Панель — рамка из двух полос. В заголовке `[data-autotest="filters-header"]` стоят `toggle-filters`,
`filters-count` и `templates`. `add-filter`, `clear-all` и `run-search` стоят в нижней полосе
`[data-autotest="filters-footer"]`, пока панель развёрнута и в ней есть критерии; в свёрнутой панели и в панели
без критериев они стоят в заголовке, а `filters-footer` отсутствует. Selectors относительно
`search-filters/<scope>` работают в обоих случаях.

В свёрнутой панели (`toggle-filters` с `aria-expanded="false"`) строк `criterion/<type>` в DOM нет: сначала
разверните панель.

Внутри `add-filter-options/<scope>` пункты меню — `[data-autotest="add-filter-option"]` с raw
`data-autotest-value="<CriterionTypeEnum>"` (`role="menuitem"`); их accessible name — переведённое название
критерия.

#### Общие portals

MUI popover/modal/listbox может находиться вне DOM-поддерева `search-filters`. Такие roots ищутся от document по
тому же owner scope:

```css
[data-autotest="templates-panel"][data-autotest-value="orders"]
[data-autotest="add-filter-options"][data-autotest-value="orders"]
[data-autotest="template-editor"][data-autotest-value="orders"]
```

Внутри templates panel (`role="menu"`):

- вернуться к умолчаниям страницы без шаблона: `button[data-autotest="select-default-template"]`
  («Default», `role="menuitemradio"`, первый пункт; `aria-checked="true"`, пока свой шаблон не применён). Он
  делает то же, что `clear-all`: восстанавливает умолчания страницы (предопределённые критерии и
  `initialSearchConditions`), снимает шаблон, забывает его как последний и,
  если что-то изменилось, показывает undo-snackbar «Default filters restored» (`react.searchUI.default.restored`).
  Умолчания ищутся сразу, как и выбранный шаблон, в том числе при `manualSearch`. Пока поле поиска шаблонов не
  пустое, пункта нет; стрелка вверх с него уводит в поле поиска;
- строка: `[data-autotest="template-item"]`;
- применить конкретный шаблон: `button[data-autotest="select-template"][title="<template name>"]`
  (`role="menuitemradio"`, применённый шаблон отмечен `aria-checked="true"`);
- удалить: сначала найти строку выбранного шаблона, затем внутри неё
  `button[data-autotest="remove-template"]`. Крестик проявляется при наведении, но кликабелен и без него.
  Если у хоста смонтирован `PneConfirmProvider`, удаление подтверждается в
  `[data-autotest="alert.container"][data-autotest-value="<scope>"]` кнопкой
  `[data-autotest="alert.button.submit"]` (отмена — `alert.button.cancel`, крестик — `alert.button.close`); без
  провайдера шаблон удаляется сразу;
- ручка перетаскивания: `[data-autotest="reorder-template"]` внутри строки, справа перед крестиком. Есть
  только когда хост передал `reorderSearchTemplates`, шаблонов больше одного и список не отфильтрован; ручка
  `aria-hidden`, для клавиатуры порядок меняется через Alt+↑/Alt+↓ на `select-template`;
- поиск: `input[data-autotest="template-search"]` появляется от 10 шаблонов и фильтрует список в браузере;
  пустой результат — `[data-autotest="template-search-empty"]`;
- создать шаблон из текущих фильтров: `button[data-autotest="create-template"]` (открывает
  `template-editor/<scope>`, меню при этом закрывается);
- сохранить текущие фильтры в применённый шаблон: `button[data-autotest="update-template"]` (есть, только
  пока шаблон применён);
- вернуть фильтры к применённому шаблону: `button[data-autotest="discard-template-changes"]` (есть, только пока
  фильтры отличаются от него).

Если фильтры отличаются от применённого шаблона, в кнопке `templates` после имени появляется точка
`[data-autotest="template-modified"]`, а accessible name и `title` получают «Unsaved changes». Сравнивается то,
что фильтры решают о поиске: значения критериев, набор критериев и для относительного периода — его режим, а не
даты, которые сдвигаются со временем. Вернули значение как в шаблоне — точка пропадает; сохранение в шаблон или
`discard-template-changes` тоже её снимают.

`template-editor/<scope>` является отдельным dialog portal, а не потомком `templates-panel`. Его close button:
`button[data-autotest="close-template-editor"]`.

Имя шаблона остаётся пользовательским значением/accessible name и не копируется в technical ID. Create,
Cancel и обычные поля формы ищутся внутри scoped dialog по native role/name.

Имя сохраняется и проверяется на занятость без пробелов по краям. Одни пробелы именем не считаются: поле
остаётся пустым, и его `required` останавливает Create так же, как у незаполненного поля.

#### Actions без отдельного `data-autotest`

Для нескольких стандартных dialog actions контрактом служат native button + computed accessible name внутри
уже найденного scoped dialog:

- Date-time picker: Cancel, OK/Next;
- Template editor: Create, Cancel;
- Grouping: Save, Cancel;
- Multiget: Clear в selected column, Save, Cancel;
- Transaction Session Status: Close.

В Selenium 4 их можно находить без XPath по внутренней разметке:

```java
static WebElement byAccessibleName(SearchContext scope, String css, String expectedName) {
    return scope.findElements(By.cssSelector(css)).stream()
        .filter(element -> expectedName.equals(element.getAccessibleName()))
        .findFirst()
        .orElseThrow();
}

WebElement save = byAccessibleName(dialog, "button, [role='button']", "Save");
```

`expectedName` берётся из фиксированной locale тестового сценария. Это явно перечисленные locale-aware actions;
raw IDs критериев, options и entities по переведённому тексту не ищутся.

Для portal конкретного критерия используются все три owner attributes:

```css
[data-autotest="criterion-project-currency-options"][data-autotest-value="orders"][data-autotest-criterion="PROJECT_CURRENCY"]
```

Generated ID из `aria-controls` не хардкодируется; при необходимости он считывается у trigger после открытия
popup.

### Матрица всех 37 критериев

В таблице указан primary selector внутри соответствующего `criterion/<CriterionTypeEnum>` root. Он находит ровно
один элемент; исключение — Enum buttons: там selector находит по кнопке на каждый вариант, выбранная — с
`aria-pressed="true"`.

| `CriterionTypeEnum` | Primary selector внутри criterion root | Family |
|---|---|---|
| `EXACT` | `input[data-autotest="criterion-input"]` | Exact input |
| `ORDERS_SEARCH` | `button[role="combobox"][data-autotest="criterion-label"]` | Orders input |
| `CURRENCY` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `CUSTOMER_LEVEL` | `[role="combobox"][data-autotest="criterion-customer-level"]` | Dependent select |
| `THREE_D` | `[role="button"][data-autotest="criterion-option"]` | Enum buttons |
| `STATUS` | `[role="button"][data-autotest="criterion-option"]` | Enum buttons |
| `MERCHANT` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `ENDPOINT` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `RESELLER` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `PROCESSOR` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `MANAGER` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `PROJECT` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `COMPANY` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `GATE` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `DEALER` | `button[data-autotest="criterion-multiget-trigger"]` | Multiget |
| `DATE_RANGE` | `[role="combobox"][data-autotest="criterion-range-spec"]` | Date |
| `DATE_RANGE_ORDERS` | `[role="combobox"][data-autotest="criterion-order-date-type"]` | Date |
| `PROJECT_CURRENCY` | `[role="combobox"][data-autotest="criterion-project-currency"]` | Dependent select |
| `CARD_TYPES` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `COUNTRIES` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `GROUPING` | `button[data-autotest="criterion-grouping-groups"]` | Grouping dialog |
| `TRANSACTION_TYPES` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `TRANSACTION_STATUS` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `RECURRENCE_TYPE` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `RECURRENCE_STATUS` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `MFO_CONFIGURATION_TYPE` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `MARKER_TYPE` | `input[role="combobox"][data-autotest="criterion-collection"]` | Collection |
| `MARKER_STATUS` | `[role="button"][data-autotest="criterion-option"]` | Enum buttons |
| `PROCESSOR_LOG_ENTRY_TYPE` | `[role="combobox"][data-autotest="criterion-processor-log-entry-type"]` | Single select |
| `ERROR_CODE` | `input[role="combobox"][data-autotest="criterion-error-code"]` | Async autocomplete |
| `TRANSACTION_SESSION_STATUS` | `button[data-autotest="criterion-transaction-session-status"]` | Session dialog |
| `OTP_STATUS` | `[role="button"][data-autotest="criterion-option"]` | Enum buttons |
| `TRANSACTION_REPORT_SCOPE` | `[role="combobox"][data-autotest="criterion-select"]` | Enum select |
| `TRANSACTION_DATE_TYPE` | `[data-autotest="criterion-option"][data-autotest-value="CREATED"]` | Static value |
| `TRANSACTION_RECURRENT_FILTER` | `[role="combobox"][data-autotest="criterion-select"]` | Enum select |
| `TIME_ZONE` | `[role="combobox"][data-autotest="criterion-select"]` | Enum select |
| `CSV_CHARSET` | `[role="combobox"][data-autotest="criterion-select"]` | Enum select |

Ниже описаны controls и panels каждой family.

### `EXACT`

Внутри `criterion/EXACT`:

| Элемент | Contract |
|---|---|
| Native input | `input[data-autotest="criterion-input"]`; текст читается из `.value` |
| Выбранное поле | `[role="combobox"][data-autotest="criterion-label"][data-autotest-value="<raw ExactCriterionSearchLabelEnum>"]` |
| Portal listbox | `criterion-label-options/<scope>` + `data-autotest-criterion="EXACT"` |
| Option | `[role="option"][data-autotest="criterion-label-option"][data-autotest-value="<raw label>"]` |

Selection option читается из `aria-selected`.

Raw values `ExactCriterionSearchLabelEnum`:

`ALL`, `NAME`, `DESCRIPTION`, `TAGS`, `IDENTIFIER`, `BEAN`, `END_POINT_GROUP_ID`, `ID`, `AMOUNT`,
`FINAL_CLEARING_DATE`, `MANAGER`, `SERIAL_NUMBER`, `INVOICE`, `CARD_FROM_RECURRENCE_NUMBER`, `FIRST_6`,
`LAST_4`, `FIRST_6_LAST_4`, `ORDER_IDENTIFIER`, `EMAIL`, `LOGIN`, `PRINCIPAL_DEALER`, `PRINCIPAL_MANAGER`,
`PRINCIPAL_MERCHANT`, `PRINCIPAL_RESELLER`, `PRINCIPAL_SUPERIOR`, `END_POINT_IDENTIFIER`,
`END_POINT_GROUP_IDENTIFIER`.

### `ORDERS_SEARCH`

Внутри `criterion/ORDERS_SEARCH`:

- label trigger: `button[role="combobox"][data-autotest="criterion-label"]`;
- выбранный raw search label находится в `data-autotest-value` trigger;
- обычные, numeric, IP и masked inputs используют actual
  `input[data-autotest="criterion-input"]`; значение читается из `.value`;
- country-вариант использует actual combobox `criterion-input/<raw country id>`.

Группированный label dialog:

```css
[role="dialog"][data-autotest="criterion-label-options"][data-autotest-value="<scope>"][data-autotest-criterion="ORDERS_SEARCH"]
```

Внутри него:

- семь native disclosure summaries: `criterion-label-group/<main|customer|source-card|destination-card|wire|card-present-api|mobile-api>`;
- 45 native radio inputs: `criterion-label-option/<raw ORDER_SEARCH_LABEL>`; если хост вернул `false` из
  `showCMSOrderSearchLabels`, их 43 — без `customer_id` и `merchant_customer_identifier`;
- expanded state группы: `aria-expanded` на `summary` и native `details.open`;
- выбранное поле: native radio `checked`/Selenium `isSelected()`;
- поле поиска над списком: `input[data-autotest="criterion-label-search"]`, при открытии курсор стоит в нём и оно
  пустое. Пока в нём есть текст, в dialog остаются только radio подходящих полей (по названию поля или группы),
  группы — простые подписи без `summary`, свёрнутые группы тоже отдают свои совпадения; Enter выбирает первое
  совпадение. Если совпадений нет — `criterion-label-search-empty`.

Selectable raw labels по группам:

- `main`: `merchant_invoice_id`, `order_id`, `processor_order_id`, `purpose`, `transaction_amount`,
  `session_token`, `batch_id`;
- `customer`: `customer_id`, `merchant_customer_identifier`, `customer_phone`, `customer_email`, `customer_ip`,
  `customer_ip_country`, `customer_billing_country`;
- `source-card`: `source_bank_name`, `source_country`, `source_from_order_id`, `source_bin`,
  `source_bin_range_from_order_id`, `source_last4`, `source_bin_last4`, `source_auth_code`, `source_arn`,
  `source_rrn`, `source_card_holder`, `source_card_ref_id`;
- `destination-card`: `dest_bank_name`, `dest_country`, `dest_from_order_id`, `dest_bin`,
  `dest_bin_range_from_order_id`, `dest_last4`, `dest_bin_last`, `dest_auth_code`, `dest_arn`, `dest_rrn`,
  `dest_card_ref_id`;
- `wire`: `account_number`, `routing_number`;
- `card-present-api`: `reader_id`, `reader_key_serial_number`, `reader_device_serial_number`;
- `mobile-api`: `device_serial_number`, `phone_serial_number`, `phone_imei`.

Не проверяйте, что в dialog обязательно присутствуют все legacy values сохранённого фильтра. Десять значений
можно восстановить из сохранённого поиска, но нельзя выбрать в текущем dialog:
`customer_dna_id`, `registration_info_id`, `inn`, `mtcn`, `rebill`, `swift_number`, `webmoney_account`,
`yamoney_account`, `wire_account`, `card_number_hash_hash`. Для них trigger и input работают, но ни один radio
не будет выбран.

Country options portal:

- owner listbox: `criterion-input-options/<scope>` + `data-autotest-criterion="ORDERS_SEARCH"`;
- option: `criterion-input-option/<raw numeric country id>`;
- selection: `aria-selected`.

### Enum buttons: `STATUS`, `THREE_D`, `MARKER_STATUS`, `OTP_STATUS`

Каждый вариант — `div` с `role="button"` (не native `<button>`), все варианты стоят в `[role="group"]` с именем
критерия:

```css
[role="button"][data-autotest="criterion-option"][data-autotest-value="<raw enum>"]
```

Состояние читается из `aria-pressed`.

| Criterion | Raw values |
|---|---|
| `STATUS` | `ANY`, `DISABLED`, `ENABLED` |
| `THREE_D` | `ANY`, `NO`, `YES` |
| `MARKER_STATUS` | `any`, `unprocessed`, `processed` |
| `OTP_STATUS` | `ANY`, `DISABLED`, `ENABLED` |

Регистр raw value значим.

### Enum select: `TRANSACTION_REPORT_SCOPE`, `TRANSACTION_RECURRENT_FILTER`, `TIME_ZONE`, `CSV_CHARSET`

- control: `[role="combobox"][data-autotest="criterion-select"]`; `data-autotest-value` у него нет;
- у listbox собственного якоря нет: после открытия его ID читается из `aria-controls` control;
- option: `[role="option"][data-autotest="criterion-option"][data-autotest-value="<raw value>"]`; выбранный —
  `aria-selected="true"`.

| Criterion | Raw values |
|---|---|
| `TRANSACTION_REPORT_SCOPE` | `ALL`, `SELECTED_BY_SESS_ID`, `SELECTED_BY_PROCESSOR_TX_ID`, `SELECTED_BY_MOTHER_SESS_ID`, `SELECTED_BY_MOTHER_PROCESSOR_TX_ID`, `SELECTED_BY_TX_RRN` |
| `TRANSACTION_RECURRENT_FILTER` | `ALL`, `RECURRENTS_ONLY`, `NON_RECURRENTS_ONLY` |
| `TIME_ZONE` | `__DEFAULT__`, целые от `-12` до `12` |
| `CSV_CHARSET` | `__DEFAULT__`, `UTF-8`, `UTF-8-SIG`, `windows-1251` |

При `TRANSACTION_REPORT_SCOPE`, отличном от `ALL`, под control появляется многострочное поле ID транзакций:
`textarea` без `data-autotest`, accessible name — `react.searchUI.transactionIds`.

`TRANSACTION_DATE_TYPE` — не control: один статичный chip `criterion-option/CREATED` без role и без
`aria-pressed`.

### Collections

Один общий contract используется для:

- `CURRENCY`;
- `CARD_TYPES`;
- `COUNTRIES`;
- `TRANSACTION_TYPES`;
- `TRANSACTION_STATUS`;
- `RECURRENCE_TYPE`;
- `RECURRENCE_STATUS`;
- `MFO_CONFIGURATION_TYPE`;
- `MARKER_TYPE`.

Внутри criterion root:

- actual input: `input[role="combobox"][data-autotest="criterion-collection"]`;
- выбранные Chips: `criterion-collection-value/<raw entity id>`;
- synthetic All имеет literal value `all`, а не translated label.

Detached content:

| Элемент | Contract |
|---|---|
| Autocomplete paper | `criterion-collection-panel/<scope>` + owning criterion |
| Named listbox | `criterion-collection-options/<scope>` + owning criterion |
| Option | `criterion-collection-option/<raw entity id|all>` |

Option selection читается из `aria-selected`. Состояние All определяется raw `all`, а не сравнением количества
выбранных и доступных options.

### `CUSTOMER_LEVEL`

- control: `criterion-customer-level/<raw selected level id>`;
- listbox: `criterion-customer-level-options/<scope>` + `data-autotest-criterion="CUSTOMER_LEVEL"`;
- option: `criterion-customer-level-option/<raw level id>`;
- loading: `aria-busy`;
- недоступность до выбора зависимостей/при loading: `aria-disabled="true"` на combobox;
- выбранный option: `aria-selected`.

Control disabled (`aria-disabled="true"`), пока не выбран ровно один Merchant, пока идёт загрузка, если загрузка
не удалась или provider не вернул ни одного уровня. Это product state.

### `PROJECT_CURRENCY`

- control: `criterion-project-currency/<raw currency id>`;
- listbox: `criterion-project-currency-options/<scope>` + owning criterion;
- option: `criterion-project-currency-option/<raw currency id>`;
- conversion checkbox: native
  `input[data-autotest="criterion-project-currency-convert"]`; состояние через `isSelected()`/`checked`;
- loading: `aria-busy`; disabled selector: `aria-disabled="true"` на combobox.

Conversion checkbox остаётся отдельным native control и не становится disabled автоматически только из-за
недоступности currency combobox.

### Date criteria

Оба date criteria имеют range-spec selector:

- control: `criterion-range-spec/<raw DateRangeSpecType>`;
- listbox: `criterion-range-spec-options/<scope>` + owning criterion;
- option: `criterion-range-spec-option/<raw DateRangeSpecType>`;
- option selection: `aria-selected`.

Raw `DateRangeSpecType`:

`EXACTLY`, `TODAY`, `YESTERDAY`, `THIS_WEEK`, `LAST_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `DAYS_BEFORE`,
`HOURS_BEFORE`, `DATE_INDEPENDENT`.

Конкретная страница может разрешать только подмножество этих режимов, поэтому автотест не должен ожидать все
десять options без соответствующей фикстуры/config.

`DATE_RANGE_ORDERS` дополнительно имеет:

- control: `criterion-order-date-type/<raw order date type>`;
- listbox: `criterion-order-date-type-options/<scope>` + `data-autotest-criterion="DATE_RANGE_ORDERS"`;
- option: `criterion-order-date-type-option/<raw order date type>`.

Raw order date types: `SESSION_CREATED`, `SESSION_STATUS_CHANGED`, `TX_CREATED`, `BANK`, `TX_SETTLED`,
`TX_UNSETTLED`.

Зависимые от режима inputs:

| Режим | Contract |
|---|---|
| `DAYS_BEFORE`/`HOURS_BEFORE` | Native number input `criterion-before-count`; значение из `.value` |
| Exact date-only | Named composite group `criterion-date-range`; picker button `criterion-date-range-picker-toggle` |
| Exact date-time start | Composite `criterion-date-time-from`; button `criterion-date-time-from-picker-toggle` |
| Exact date-time end | Composite `criterion-date-time-to`; button `criterion-date-time-to-picker-toggle` |

Picker portal roots:

- `criterion-date-range-picker/<scope>`;
- `criterion-date-time-from-picker/<scope>`;
- `criterion-date-time-to-picker/<scope>`;
- каждый также получает `data-autotest-criterion` владельца.

Внутри picker:

- day gridcell: `criterion-date-option/<YYYY-MM-DD>`, selection через `aria-selected`;
- clock option: `[role="option"][data-autotest="criterion-time-option"]`; конкретное число берётся из option
  content/accessible name внутри уже scoped picker, selection — из `aria-selected`.

Не используйте hidden serialized input date picker: контрактом являются visible composite sections и actual
picker controls.

Поля exact-дат показывают день первым на любом языке, как Wicket `dd.MM.yyyy` и страница заказа:
`DD.MM.YYYY` без времени и `DD.MM.YYYY HH:mm:ss` со временем. Секции идут в том же порядке (день, месяц, год).
Календарь говорит на языке интерфейса (`i18n.language`: `en`, `ru`, `fr`, `zh_CN`): названия месяцев и дней,
первый день недели. Значение `criterion-date-option` остаётся ISO `YYYY-MM-DD`.

Введённая дата проверяется так же, как на странице заказа:

- недописанная (`22.10.____`) или несуществующая (`31.02.2026`) дата — ошибка
  `DATE_RANGE_INVALID_DATE` (`react.searchUI.dateRange.invalidDate`, `params.boundary`: `from`/`to`).
  Несуществующая видна сразу, недописанная — когда фокус уходит из поля;
- конец раньше начала — `DATE_RANGE_END_BEFORE_START` (`react.searchUI.dateRange.endBeforeStart`); равные концы
  допустимы;
- год не ограничивается: 3000 и 1800 — обычные даты, красная подсветка MUI за пределами 1900–2099 отключена.

С ошибкой `run-search` заблокирован, `onFiltersUpdate` не вызывается, а результат приходит в
`onValidationChange`. Пустое начало или конец — не ошибка, а открытая сторона периода: ищется от
2000-01-01 00:00 или до 2999-12-31 00:00, как `DATE_INDEPENDENT`. В календаре первый выбранный день ждёт второго,
поиск идёт по готовому диапазону.

### `PROCESSOR_LOG_ENTRY_TYPE`

- control: `criterion-processor-log-entry-type/<raw numeric provider id>`;
- listbox: `criterion-processor-log-entry-type-options/<scope>` + owning criterion;
- option: `criterion-processor-log-entry-type-option/<raw numeric provider id>`;
- selection: `aria-selected`.

### `ERROR_CODE`

- actual autocomplete input: `criterion-error-code/<raw committed choice id>`;
- текст запроса читается из `.value`, а не из test attribute;
- clear action: `criterion-error-code-clear`;
- paper: `criterion-error-code-panel/<scope>` + owning criterion;
- listbox: `criterion-error-code-options/<scope>` + owning criterion;
- option: `criterion-error-code-option/<raw choice id>`;
- loading: `aria-busy`; selection: `aria-selected`.

Одинаковые display labels не создают коллизию, потому что identity option — raw ID.

### `GROUPING`

Inline controls:

- dialog trigger: `button[data-autotest="criterion-grouping-groups"]`;
- selected Chips: `criterion-grouping-value/<raw GroupingType>`;
- date-type control: `criterion-grouping-date-type/<raw date type>`;
- date-type listbox: `criterion-grouping-date-type-options/<scope>` + owning criterion;
- date-type option: `criterion-grouping-date-type-option/<raw date type>`.

Raw grouping date types: `MONTH`, `DAY`, `CLOSE_DAY`, `SETTLEMENT_DAY`, `SETTLEMENT_MONTH`.

Raw `GroupingType` values: `MERCHANT`, `MANAGER`, `PROJECT`, `CURRENCY`, `ENDPOINT`, `CARD_TYPE`, `GATE`,
`PROCESSOR`, `MID`, `COUNTERPARTY`, `PROJECT_CODE`, `DATE`, `MONTH`, `DAY`, `CLOSE_DAY`, `SETTLEMENT_DAY`,
`SETTLEMENT_MONTH`. Страница может передать только подмножество available types.

Detached dialog:

```css
[role="dialog"][data-autotest="criterion-grouping-panel"][data-autotest-value="<scope>"][data-autotest-criterion="GROUPING"]
```

Внутри dialog:

| Элемент | Contract |
|---|---|
| Available group | `criterion-grouping-available` |
| Selected group | `criterion-grouping-selected` |
| Add/remove row | `criterion-grouping-option/<raw GroupingType>`; actual native button |
| Search input | `criterion-grouping-search` |
| Conditional clear search | `criterion-grouping-search-clear` |
| Add all | `criterion-grouping-add-all` |
| Remove all | `criterion-grouping-remove-all` |

После переноса row из available в selected тот же raw ID сохраняется, а action/accessible name меняется.
Save/Cancel ищутся по native role/name внутри scoped dialog.

### `TRANSACTION_SESSION_STATUS`

Inline:

- trigger: `criterion-transaction-session-status/<raw current group>`;
- current group Chip: `criterion-transaction-session-status-group-value/<raw group>`;
- selected status Chips: `criterion-transaction-session-status-value/<status.displayName>`;
- trigger state: `aria-expanded`, `aria-controls`, `aria-busy`.

Portal dialog:

- root: `criterion-transaction-session-status-panel/<scope>` +
  `data-autotest-criterion="TRANSACTION_SESSION_STATUS"`;
- group combobox: `criterion-transaction-session-status-group/<raw group>`;
- group listbox: `criterion-transaction-session-status-group-options/<scope>` + owning criterion;
- group option: `criterion-transaction-session-status-group-option/<raw group>`;
- status checkbox input: `criterion-transaction-session-status-option/<status.displayName>`;
- checkbox state: native `checked`/Selenium `isSelected()`.

Список group/status приходит от provider и является динамическим: не проверяйте фиксированное число групп без
соответствующей фикстуры. `status.displayName` является backend identity статуса внутри группы; locator не
зависит от перевода или позиции в массиве. Изменения статусов применяются сразу, без отдельного Save.

Group listbox является отдельным portal и не находится внутри status dialog card. После открытия combobox его
нужно искать от `document` по owner scope и `data-autotest-criterion`, а не descendant-поиском от dialog.

### Multiget: девять типов критериев

| Criterion | `LinkedEntityTypeEnum` | Only enabled control | Gate search labels |
|---|---|---|---|
| `PROJECT` | `PROJECT` | Да | Нет |
| `ENDPOINT` | `ENDPOINT` | Да | Нет |
| `GATE` | `GATE` | Да | Да |
| `PROCESSOR` | `PROCESSOR` | Да | Нет |
| `COMPANY` | `COMPANY` | Да | Нет |
| `MANAGER` | `MANAGER` | Нет | Нет |
| `MERCHANT` | `MERCHANT` | Да | Нет |
| `RESELLER` | `RESELLER` | Да | Нет |
| `DEALER` | `DEALER` | Нет | Нет |

#### Inline trigger и summary

- actual native button: `criterion-multiget-trigger/<NONE|ALL|SEARCH>`;
- selected/excluded summary Chip: `criterion-multiget-value/<raw numeric entity.id>`;
- open state: `aria-expanded`; portal link: `aria-controls`; popup type: `aria-haspopup="dialog"`.

Сохранённый фильтр может восстановить режим `SEARCH`, однако внутри dialog переключатели режима существуют
только для `NONE` и `ALL`. В таком восстановленном состоянии не ожидайте обязательный `aria-pressed="true"`
у одного из этих двух переключателей.

#### Owner-scoped dialog

```css
[role="dialog"][data-autotest="criterion-multiget-panel"][data-autotest-value="<scope>"][data-autotest-criterion="<multiget CriterionTypeEnum>"]
```

Внутри dialog:

| Элемент | Contract/state |
|---|---|
| Close | `criterion-multiget-close` |
| Include mode | `criterion-multiget-mode/NONE`, `aria-pressed` |
| Exclude mode | `criterion-multiget-mode/ALL`, `aria-pressed` |
| Only enabled | Native `input[type="checkbox"]` с `role="switch"` `criterion-multiget-only-enabled`; состояние через `isSelected()`/`checked`; только для семи типов из таблицы |
| Search | Native input `criterion-multiget-search`; query из `.value` |
| Gate search field | `criterion-multiget-search-label/<all|mid|descriptor>`, `aria-pressed` |
| Available column | Named group `criterion-multiget-available`, loading через `aria-busy` |
| Selected/excluded column | Named group `criterion-multiget-selected` |
| Add entity | Native button `criterion-multiget-add/<raw numeric entity.id>` |
| Remove entity | Native button `criterion-multiget-remove/<raw numeric entity.id>` |

Одинаковый entity ID допустим в разных SearchUI scopes. Внутри одного dialog hidden duplicate может оставаться в
available column после выбора, поэтому add/remove всегда ищутся сначала относительно нужной колонки.

Clear в selected column, Save и Cancel ищутся по native role/name внутри scoped dialog. Pagination остаётся
semantic `nav`; текущая страница — `aria-current="page"`, unavailable controls — native disabled. Отдельные
anchors для этих стандартных действий отсутствуют.

### Ожидания и асинхронный UI

Для async lists/pickers/modal используйте explicit waits на смысловое состояние:

- owner-scoped portal появился;
- trigger получил `aria-expanded="true"`;
- `aria-busy` стал `false`;
- ожидаемый raw option появился;
- после action изменился native/ARIA state или portal исчез;
- панель фильтров: `[data-autotest="search-filters-skeleton"][data-autotest-value="<scope>"]` исчез и появился
  `search-filters/<scope>`.

У таблицы `aria-busy` следует за скелетоном, а не за запросом: при повторной загрузке он становится `true`
только через 300 мс и держится не меньше 500 мс. Поэтому `aria-busy="false"` сразу после действия ещё не
значит, что строки новые: ждите изменения данных.

Не используйте fixed sleeps. Не считайте empty result ошибкой locator, если provider действительно вернул
пустой список.

### На чём не строить Selenium-локаторы

Не используйте как постоянную identity:

- MUI/Emotion class names (`Mui*`, `css-*`);
- `svg`, `path`, декоративную стрелку/иконку;
- DOM depth, `nth-child`, array index;
- translated visible text как технический ID raw-критерия, option или entity; явно перечисленные выше
  role/name actions являются locale-aware исключением;
- generated React/MUI IDs из `aria-controls`;
- `PNE`, `Paynet`, WhiteLabel/product name;
- произвольное введённое или секретное значение как переиспользуемый технический ID; поиск заранее созданного
  template fixture по его имени является test-data lookup, а не общей identity компонента;
- tag name как единственный признак (`//button`, `//div`).

Если элемент кликабельный, выбирайте якорь на actual meaningful control из таблиц выше, а не вложенную
декоративную иконку.

### Где находится источник истины

Этот раздел README — основной реестр поддерживаемых Selenium-якорей библиотеки. Storybook используется только для
интерактивных примеров.

## OverlayHost и уведомления

Компоненты, которые используют `overlayActions` напрямую или косвенно, требуют смонтированный
`<OverlayHost />` в приложении-хосте. Это касается и `SearchUI`, потому что пункт `Default` меню сохранённых фильтров
(и `Clear all` при скрытом меню) использует undo-snackbar.

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

### Пропсы `OverlayHost`

- `anchorOrigin` — угол стопки уведомлений, по умолчанию слева внизу; уведомление может задать свой;
- `leftOffset` — отступ левой стопки от края экрана, по умолчанию 24 px; рядом с левым меню Paynet передайте
  `PAYNET_LEFT_MENU_OVERLAY_OFFSET` (16 px, от 1080 px — 64, от 1600 px — 272);
- `container` — куда рисовать стопки и панель операций: по умолчанию одним React portal в
  `document.body`, без обёртки в DOM приложения; можно передать `Element` или функцию, `null` рисует на месте.
  Слой берётся из `theme.zIndex.snackbar` / `theme.zIndex.modal`;
- `operationCenter` — панель фоновых операций, см. `PneOperationCenter` ниже;
- `resolveViolationMessage` — см. «Ошибки валидации UI API».

### `overlayActions`

- Для уведомлений используйте `overlayActions.showSuccess/showError/showWarning/showInfo`, `showSnackbar` или
  `showUndoSnackbar`; `removeSnackbar(id)` убирает одно уведомление, `clearSnackbars()` — все.
- На экране не больше 10 уведомлений сразу: при переполнении самые старые удаляются, а не остаются скрытой
  очередью.
- `showError` принимает как готовый UI-текст (`{ message }`), так и исходную Paynet/transport ошибку (`{ error }`). Во втором случае библиотека сама разворачивает Paynet v1, Axios/Fetch/Blob payload, переводит `messageId`, показывает `errorId`, `errorI18N` и доступный пользователю `details`.
- `showUndoSnackbar` возвращает `id` snackbar и добавляет встроенную action-кнопку `Undo` (или ваш `undoLabel`).
- Уведомление без `autoHideMs` закрывается само через 5000 мс; ошибка (`showError`, `variant: 'error'`)
  остаётся до закрытия крестиком, `showTransientError` закрывает её через 5000 мс. Явный
  `autoHideMs: undefined` или `0` отключает автозакрытие. Пока уведомление закрывается по таймеру, по его
  нижнему краю идёт полоса таймера; под указателем и в фокусе таймер стоит. При `prefers-reduced-motion`
  полосы нет.
- Отменённый запрос (`AbortError`, `ERR_CANCELED`) в `showError({error})` уведомления не показывает.
- для обычного уведомления о завершившемся действии не передавайте `id`: каждый вызов получит собственную внутреннюю
  identity, поэтому даже одинаковые сообщения будут показаны отдельными элементами стека;
- явный `id` нужен только для управляемого lifecycle, когда вызывающий код должен позднее адресно удалить или заменить
  конкретный snackbar (например, после Undo);
- повторный enqueue с тем же явным `id` игнорируется, пока первый snackbar присутствует. Для замены сначала вызовите `removeSnackbar(id)`.

### Вид уведомлений

Вид уведомлений (UI Kit Toast и Banner). Каждое уведомление шириной 448 px (на телефоне — по ширине экрана),
между уведомлениями 8 px; нижние рисуются поверх теней верхних. Тост залит цветом своего тона (успех — зелёный,
информация — синий, предупреждение — янтарный, ошибка — красный), скругление 8, отступы 8/16, тень тоста; значка
тона нет. `message` — заголовок 18/26 SemiBold, необязательное `description` — вторая строка 12/16 цветом текста
тона. Справа, в 64 px от текста, стоят действие потребителя (`action`) и крестик — значок 16 px в кнопке 32 px
без заливки, цветом текста тона; крестик есть и рядом с действием. Полоса таймера 3 px идёт по нижнему краю и
убывает влево. Кнопка «Undo» из `showUndoSnackbar` — мягкая `small` с подписью цвета основного текста, без значка.
Ошибка Paynet с идентификатором и деталями (`showError({error})`) — баннер, и это тот же `PneBanner`, что
стоит на страницах: бледная заливка тона в кольце его цвета, отступы 12/16, знак тона 20 px слева, крестик
24 px. Уведомление добавляет к нему только своё: ширину стопки, тень тоста поверх кольца и полосу таймера;
действие потребителя встаёт под текстом. Цвета — `theme.palette.pne.toast`, одинаковые для всех скинов.

### Панель фоновых операций: `PneOperationCenter`

Управляемая панель фоновых операций (генерация отчётов и подобное), которую приложение отдаёт в
`<OverlayHost operationCenter={…}>`. Она стоит справа внизу в 16 px от краёв, под подложками модальных окон;
стопка уведомлений и нижние оверлеи встают над ней. Без операций панель ничего не рисует.

Панель не хранит список, не опрашивает сервер и не повторяет запросы: приложение передаёт `operations` и
обрабатывает `onAction(operationId, actionId)`, `onDismiss(operationId)` и `onClearTerminal(ids)`.

- `PneOperationCenterItem`: `{id, title, status, statusLabel?, context?, detail?, progress?, actions?,
  dismissible?}`;
- `status`: `starting`, `queued`, `running`, `finalizing`, `monitoring-error`, `succeeded`, `failed`,
  `cancelled`, `unknown`;
- `progress`: `{kind: 'indeterminate'}` или `{kind: 'determinate', value}` со значением от 0 до 100;
- `expanded` / `defaultExpanded` (по умолчанию свёрнута) / `onExpandedChange` — раскрытие панели;
- `labels` — подписи панели; без них берутся ключи `pne.operationCenter.*`.

### Ошибки валидации UI API (`violations[]`)

Ответ Paynet на запрос, не прошедший Bean Validation на сервере, несёт `errorType: VALIDATION_ERROR` и список
`violations[]` (`property`, `propertyPath`, `message`, `messageFormat`, `messageParams`). `normalizePaynetError`
сохраняет корректные элементы списка, а `PaynetErrorContent` показывает их под основным сообщением: имя поля
моноширинным шрифтом и текст нарушения, не больше восьми строк, дальше счётчик `pne.error.moreViolations`.

Текст нарушения библиотека выбирает так: сначала резолвер хоста, затем для шаблона вида `{key}` перевод `t(key, messageParams)`
через i18next хоста, иначе серверный `message`. Какие форматы сообщений отдаёт бэкенд и под какими ключами лежат переводы,
знает только приложение-хост, поэтому таблица соответствий живёт там и передаётся пропсом:

```tsx
<OverlayHost resolveViolationMessage={violation => hostViolationText(violation)}>
    <ApplicationRoutes />
</OverlayHost>
```

Резолвер возвращает `undefined`, чтобы оставить библиотечное поведение для конкретного нарушения. Тот же проп есть у
`PaynetErrorContent` для inline-рендера. Поля `errorI18N`, `details` и их отображение не меняются: ответ валидации
без `violations[]` показывается как раньше.

## PneConfirmProvider

Компоненты вызывают подтверждение через Promise API `usePneConfirm`. Подключайте
`PneConfirmProvider` ровно один раз рядом с корнем приложения и вызывайте исходное действие только после
результата `true`:

```tsx
import { PneConfirmProvider, usePneConfirm } from 'pne-ui'

const DeleteButton = () => {
    const { confirm } = usePneConfirm()

    const handleDelete = async () => {
        const accepted = await confirm({
            autoTestValue: item.id,
            danger: true,
            title: 'Delete item?',
            message: 'This action cannot be undone.',
            confirmLabel: 'Delete',
        })

        if (accepted) {
            await deleteItem()
        }
    }

    return <button onClick={handleDelete}>Delete</button>
}

export const App = () => (
    <PneConfirmProvider>
        <ApplicationRoutes />
    </PneConfirmProvider>
)
```

`danger: true` задаёт destructive/error оформление primary action. Для dismissible acknowledgement-flow без
Cancel используйте `showCancel: false`: Close, Escape и backdrop по-прежнему возвращают `false`. Параллельные
вызовы обслуживаются по FIFO; повторное событие от action предыдущего dialog не подтверждает следующий запрос.
При размонтировании provider текущий и ожидающие Promise завершаются значением `false`.

Для повторяемого или бизнес-специфичного действия передавайте стабильный не-секретный
`autoTestValue` (raw entity ID, enum или caller-owned scope). Это значение получает контейнер диалога
(`role='dialog'`), поэтому dialog
однозначно связывается с инициировавшим control даже вне его DOM-поддерева. Очередь хранит scope каждого
запроса независимо и меняет его вместе с текущим confirm.

Поддерживаемые Selenium-якоря размещены на существующих интерактивных/смысловых DOM nodes без
дополнительных wrapper-элементов:

| Якорь | Назначение |
|-------|------------|
| `alert.container/<autoTestValue?>` | контейнер confirm modal и опциональный owner scope |
| `alert.message` | содержимое сообщения |
| `alert.button.close` | кнопка закрытия |
| `alert.button.cancel` | cancel action; отсутствует при `showCancel: false` |
| `alert.button.submit` | confirm action |

## Интеграция SearchUI

### Подключение контекста через `SearchUIProvider`

Компоненты `SearchUI` и его фильтры получают конфигурацию из `SearchUIProvider`.  
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
            // Методы ниже нужны для работы сохранённых наборов фильтров (меню «Saved filters»)
            // Возвращает список шаблонов поиска для выпадающего списка
            getSearchTemplates: contextName => templatesApi.list(contextName),
            // Сохраняет текущие настройки фильтров под именем шаблона
            saveSearchTemplate: request => templatesApi.save(request),
            // Удаляет ранее сохраненный шаблон
            deleteSearchTemplate: request => templatesApi.remove(request),
            // Проверяет, существует ли шаблон с указанным именем
            searchTemplateExists: request => templatesApi.exists(request),
            // Необязательно: сохраняет порядок шаблонов ({contextName, templateNames} — все имена контекста
            // в новом порядке). Без него меню не предлагает перетаскивание.
            reorderSearchTemplates: request => templatesApi.reorder(request),
            // Необязательно, только парой: где живёт имя последнего выбранного шаблона контекста
            // (например, на сервере у пользователя). Без них имя хранится в localStorage браузера.
            getLastSearchTemplateName: contextName => templatesApi.lastName(contextName),
            saveLastSearchTemplateName: request => templatesApi.saveLastName(request),
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

Передавайте только те поля `SearchUIDefaults`, которые хотите переопределить — остальные берутся из значений
библиотеки по умолчанию (пустые списки, все `show…` — `true`). Более развернутый пример — история Storybook
`pne-ui/SearchUI`.
`templatesApi` в примере — любая ваша обертка над бэкендом, которая умеет получать/сохранять шаблоны.

### Раскладка панели фильтров

Панель — блок в рамке со скруглением 8px (UI Kit Filter): полоса-заголовок, строки критериев и нижняя
полоса. Строки и нижняя полоса лежат в одной сетке из трёх колонок — значки, название и значение. Блок
отступает от краёв страницы на 16px, как таблица под ним.

- Заголовок — полоса 32px на заливке `pne.table.band.tabs.fill`: слева кнопка «Filters» с шевроном
  (сворачивает панель; без критериев или при `hideShowFiltersButton` это просто подпись) и счётчик критериев,
  справа меню сохранённых наборов. Кнопки заголовка — 24px.
- Нижняя полоса есть у развёрнутой панели с критериями: `Add filter` (плюс и подпись, без шеврона) начинается
  там же, где значения, `Search` / `Refresh` (и `Clear all` при `hideTemplatesSelect`) стоят у правого края.
  Кнопки полосы — 32px. Полоса складывается вместе со строками.
- В свёрнутой панели и в панели без критериев нижней полосы нет: `Add filter` и `Search` стоят в заголовке
  справа, после меню наборов, кнопками 24px. Заголовок тогда — вся панель.
- Строки отделены тонкой линией цвета рамки на всю ширину блока; содержимое строки отступает от рамки на 8px
  слева и 4px справа.

- Колонка названий берёт ширину по самому длинному названию на странице, но не уже 120px и не шире 240px.
  Название — 14/20, цвет из палитры (`pne.text.default`). Название, которое не помещается, обрезается
  многоточием, и только тогда при наведении показывает полное название в подсказке. Линии между строками — цвет
  рамки панели, поэтому в тёмной теме панель читается.
- Строка критерия (UI Kit Filter row): значки сброса и удаления, затем название, затем значение; высота
  строки от 45px вместе с линией над ней (элементы 32px и по 6px сверху и снизу), между колонками 16px. Колонка значков — 68px под две
  кнопки 32px с зазором 4px: сброс (круговые стрелки) всегда первый, крестик удаления — второй; у критерия,
  который нельзя убрать, место крестика остаётся пустым, поэтому значки сброса всех строк стоят на одной
  вертикали. На телефоне название стоит слева, значки — у правого края, значение — отдельной строкой.
- Значки — Icon action UI Kit: квадрат 32px со значком 16px без заливки, в покое цвет Neutral/600, под
  указателем и при фокусе с клавиатуры — цвет текста бренда. Подсказка при наведении и фокусе повторяет
  доступное имя: `Clear filter: <критерий>`, `Remove filter: <критерий>`.
- Значения в строке (UI Kit Filter row) — 32px, между ними 4px, по 6px до линий строки, в том числе когда
  значения переносятся на вторую строку. Выпадающий выбор — поле-чип: заливка вкладок, радиус 4, текст 14/20,
  шеврон библиотеки 16px. Выбранное значение — бейдж в тонкой рамке, тот же, что у множественного поля
  (`pne.dropdown.chip`), с крестиком библиотеки вместо залитого кружка MUI; группа значений (группа статусов
  заказа) — нейтральный бейдж без рамки (`data-pne-tone="neutral"`). Выбор одного из нескольких
  (`data-pne-tabs`) — группа вкладок: кнопки 24px на подложке вкладок, выбранная — белая. Поля ввода (поиск,
  даты, число дней) — 32px на заливке полей; точные даты стоят в одной строке с выбором типа диапазона и
  уходят под него, только когда строка узкая. Число критериев в шапке — бейдж тона Info, как информационный
  баннер.
- Меню панели (UI Kit Dropdown menu) — панель выпадающих списков библиотеки: радиус 8, тонкая рамка, тень,
  отступ 4px; строки 32px, текст 14/20, значки 16px, подсветка строки — цвет наведения списков. `Add filter`
  берёт этот вид целиком, но не ограничен восемью строками; меню `Saved filters` рисует свои строки (имя, ручка,
  удаление) на той же панели шириной 320px, поле поиска в нём — 32px.
- Окно Multiget и окно группировки (UI Kit Transfer list): два списка в рамке с радиусом 8, над каждым подпись
  12/16; действие над всем списком есть у обоих списков окна группировки, в Multiget — только `Clear` над
  выбранными. Строка 32px без собственной заливки, в конце строки знак того, что сделает щелчок, — стрелка
  (добавить) или крестик (вернуть), под указателем знак окрашивается. Строка, которую щелчок не двигает, знака
  не несёт. Поиск — поле 32px с лупой. Переключатели Include / Exclude и All / MID / Descriptor — группа
  вкладок, страницы списка — кнопки пагинации таблицы.
- Календарь точных дат (UI Kit Date picker): панель списков, день —
  ячейка 36×32 с радиусом 4 без зазора в неделе, 6px между неделями; под указателем заливка вкладок, сегодня —
  рамка цвета ссылки, концы диапазона — основная заливка, дни между ними — заливка выбранной строки таблицы.
  Колонку готовых периодов из макета панель не берёт: период выбирается выпадающим типом диапазона. У поля
  «дата и время» под календарём стоят кнопки самого MUI X («Cancel», «OK»), нарисованные кнопками библиотеки,
  а списки часов, минут и секунд — строки 32px того же вида. Имена
  классов — MUI X 9: один день — `MuiPickerDay`, день диапазона — `MuiDateRangePickerDay`. Поля дат в строке —
  32px, кнопка календаря в них — 24px со значком 16px.
- Фокус с клавиатуры выглядит одинаково на всех элементах строк критериев: кольцо 2px цвета `primary.main` с
  отступом 1px по форме элемента — на значках сброса и удаления, полях ввода, полях дат, полях автодополнения,
  полях-чипах, кнопках группы вкладок и ссылках-триггерах. Кнопки заголовка и нижней полосы — обычные
  кнопки MUI в виде темы и показывают стандартный фокус кнопки; `Add filter` — такая же кнопка с меню, как `Saved filters`,
  а не прозрачный select поверх кнопки.
- Шеврон у выпадающих элементов один — шеврон библиотеки в цвете текста элемента: 16px на полях-чипах критериев
  (`in …`, тип диапазона дат, тип даты заказа, валюта проекта, тип даты группировки, тип записи, страна) и в
  поле кода ошибки, 14px на кнопке `Saved filters`. Поле кода ошибки (автодополнение) — поле 32px с радиусом 4,
  как поле `Exact`, шириной 220px, с крестиком очистки и шевроном внутри; его список открывается от левого края
  поля шириной 420px, но не шире экрана минус 32px (на 360px — 328px). Строка списка: текст ошибки 14px/20px
  (не больше двух строк, полный текст в `title`, набранный запрос выделен жирным `<mark>`), под ним
  идентификаторы 12px/16px цветом `pne.text.muted` — только `тип · id · внешний код`, без повтора
  текста (описание с сервера — поисковая строка `тип:id текст код`; описание другой формы показывается как
  есть); между строками линия `pne.border.subtle`. Пустой запрос не уходит на сервер: список показывает
  подсказку `react.searchUI.errorCode.typeToSearch`.
- Кнопка `Filters` в заголовке — текстовая кнопка 24px с шевроном слева: у развёрнутой панели он смотрит вверх,
  у свёрнутой — вправо. Кнопка называется `Filters` и сообщает состояние через `aria-expanded`; подсказка
  говорит, что сделает нажатие: `Hide filters` или `Show filters`. Число критериев — отдельный бейдж высотой
  20px рядом с кнопкой, не её часть; он виден и в развёрнутой, и в свёрнутой панели. Пока критериев нет, вместо
  кнопки стоит подпись `Filters` без шеврона и бейджа: сворачивать нечего, а первый добавленный критерий
  разворачивает панель сам.
- Строки сворачиваются и разворачиваются с анимацией высоты (200 мс, `prefers-reduced-motion` её
  выключает); пока панель закрывается, строки остаются в DOM, закрытая панель их не держит.
- Свёрнутость запоминает хост — см. «Где хранится свёрнутость панели».
- Меню `Add filter` открывается под кнопкой от её левого края, как и меню наборов. Окно выбора сущностей
  (шлюзы, торговцы и т. п.) озаглавлено названием критерия.
- Пока хост не ответил, свёрнута ли панель, какой набор выбран в прошлый раз и что в этом наборе, на месте
  панели стоит скелетон `[data-autotest="search-filters-skeleton"]` (`aria-busy="true"`) той же высоты:
  свёрнутая панель — одна строка кнопок, развёрнутая — столько строк, сколько их было у выбранного набора, если
  хост хранит это число рядом с именем набора (`criteriaCount` в `saveLastSearchTemplateName`, обратно —
  `peekLastSearchTemplateCriteriaCount`), иначе по строке на каждый predefined-фильтр. Число SearchUI сообщает
  хосту при каждом выборе набора и при открытии страницы, если у хоста его нет или оно другое (старые
  сохранения дописываются при первом заходе). Таблица под скелетоном сразу стоит на своём месте и не прыгает.
  Хост, который уже знает ответы (например, загрузил их при старте приложения), отдаёт их синхронно через
  `peekSearchFiltersCollapsed` и `peekLastSearchTemplateName` в `SearchUIDefaults` (`undefined` — «ещё не
  знаю»): тогда панель без выбранного набора рисуется с первого кадра, вовсе без скелетона. Автотесты ждут
  `[data-autotest="search-filters"]`: у скелетона другой якорь.
- `SearchUI` ставит таблицу на 6px ниже разделителя под фильтрами; верхняя полоса пагинации стоит
  вплотную к шапке таблицы, нижняя — на 6px ниже последней строки, под ней отступа нет (у `PneTable` вне
  SearchUI остаются 6px вокруг полос пагинации и 8px снизу).
  Боковые 16px у фильтров и таблицы — единственный отступ страницы от края на телефоне, планшете и с
  левым меню, их SearchUI держит сам. Сверху хост ничего не добавляет: панель начинается сразу под тем,
  что над ней. Отступы полос пагинации любой таблицы меняются через `paginationSx` у `PneTable`
  (`{top, bottom}` — отдельно для верхней и нижней полосы).

Ниже 600px у строки критерия по 8px сверху и снизу и 8px между названием и значением; кнопки заголовка и нижней
полосы переносятся по ширине (в нижней полосе между ними 8px), кнопка Search/Refresh в нижней полосе занимает
остаток своей строки. Браузеры без CSS subgrid получают колонку названий фиксированной ширины 180px.

Истории `pne-ui/SearchUI › Orders Manual Search`, `Orders Auto Refresh`, `Virtual Cards`, `Collapsed Filters`,
`Orders Mobile 360` и `Transaction Report › Report Page` показывают панель в типичных местах.

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

`DATE_INDEPENDENT` ищет между фиксированными днями Wicket `DateRange.dateIndependent()`: с 2000-01-01 00:00 по
2999-12-31 00:00, по умолчанию по Москве, при заданном `dateOnlyTimeZone` — в нём; момент нажатия на результат
не влияет.

Переход на `EXACTLY` с любого другого режима начинает период с сегодняшнего дня, как поле Wicket: без времени
в поле стоит сегодня–сегодня (ищется один день), со временем — с начала сегодняшнего дня до текущего момента.
Даты прежнего режима в поле не переносятся: его конец — полночь после последнего дня, а не сам этот день.

Параметр `maxRangeSpanInDays` задаёт включительную верхнюю границу диапазона.
Он проверяет уже разрешённые границы всех режимов даты, кроме `DATE_INDEPENDENT`; для date-only `EXACTLY`
пользовательская конечная дата считается включительной. Значение должно быть
положительным целым числом. Пустое начало или пустой конец `EXACTLY` открывают период до границ 2000–2999
годов, поэтому при заданном максимуме они тоже дают `DATE_RANGE_MAX_SPAN_EXCEEDED`.

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
import {Button} from '@mui/material'
import {
    CriterionTypeEnum,
    DATE_RANGE_SPEC_TYPES,
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

    return <SearchUIProvider defaults={{}}>
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
                dateRange: {
                    dateRangeSpecTypes: DATE_RANGE_SPEC_TYPES.filter(
                        type => type !== 'DATE_INDEPENDENT',
                    ),
                    maxRangeSpanInDays: 93,
                },
            }}
        />

        <Button
            variant="contained"
            disabled={searchCriteria === null || !validation?.isValid}
            onClick={generateReport}
        >
            Generate report
        </Button>
    </SearchUIProvider>
}
```

`OverlayHost` должен быть смонтирован в приложении-хосте.

У высокоуровневого `SearchUI` используются те же `possibleCriteria`,
`predefinedCriteria`, `initialSearchConditions` и `config`; результат для бэкенда
передаётся в `searchData` как часть `SearchParams`.

Выбор в `initialSearchConditions.multigetCriteria` подразумевает свой критерий: он
активен с первой загрузки и возвращается по «Default». Критерий из `possibleCriteria`
при этом остаётся удаляемым, а критерий, которого нет ни в `predefinedCriteria`, ни в
`possibleCriteria`, показывается как предопределённый, и в не-production сборке в
консоль уходит ошибка с именем контекста: объявите его в `predefinedCriteria`. В поиск
уходят только выборы активных критериев, невидимого фильтра не бывает.

Значок сброса строки (`clear-criterion`) возвращает критерий к значению страницы: к тому, что задано
для него в `initialSearchConditions` (период, выбор в `multigetCriteria`, scope и так далее), а
где страница значения не дала — к пустому значению библиотеки (для дат это Today). Так же, как
«Default» и «Clear all» делают для всех строк сразу, только шаблон и остальные строки не
меняются. Относительный период страницы («This month») считается от дня нажатия. Удаление
строки (`remove-criterion`) значение страницы не возвращает: убранный критерий остаётся пустым.

Подписи вариантов `scope` и `recurrentFilter` библиотека берёт из ключей
`react.TransactionReportScopeCriterionEnum.<scope>` и
`react.TransactionRecurrentFilterCriterionEnum.<recurrentFilter>`: Paynet отдаёт React
только ключи с разрешёнными префиксами, и Wicket-ключи `transactionReportScope.*` /
`recurrentFilterType.*` в React не попадают.

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
`onFiltersUpdate` не публикует невалидный черновик: хост сохраняет последние валидные
критерии, поэтому внешнюю кнопку Generate блокируйте по `onValidationChange`, а не по
наличию дат. Отчёт генерируется внешней кнопкой, и автоматическому режиму обновлять
нечего: `config.hideRefreshButton: true` прячет его кнопку Refresh. Кнопку Search
ручного режима флаг не прячет. При валидном изменении `onFiltersUpdate` сразу отдаёт
актуальные критерии.

Если отдельно включить `manualSearch: true`, пользователь должен сначала применить
изменения встроенной кнопкой Search и только затем запускать Generate: до Search в
`onFiltersUpdate` остаются последние применённые критерии. Исключение — готовые наборы:
выбор шаблона, `Default` и `discard-template-changes` применяются сразу, как и первая
загрузка страницы; `clear-all` при скрытом меню шаблонов делает так же.

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

#### Где хранится имя последнего шаблона

По умолчанию имя лежит в `localStorage` браузера под ключом `last_template_name<settingsContextName>`,
то есть общее для всех, кто пользуется этим браузером. Хост может забрать хранение себе, передав в
`SearchUIProvider` пару `getLastSearchTemplateName(contextName)` и
`saveLastSearchTemplateName({contextName, templateName})` (например, серверное хранение у пользователя;
`templateName: null` означает «забыть контекст» — фильтры очищены или шаблон удалён). Тогда:

- при монтировании фильтры ждут ответа хоста; имя от хоста применяется, а ключ в `localStorage`
  удаляется как устаревший;
- если хост ничего не хранит, а в `localStorage` имя осталось от прежнего механизма, оно один раз
  переезжает к хосту — только если по-прежнему называет существующий шаблон. Ключ удаляется в любом
  случае, так что имя другого пользователя того же браузера к хосту не попадёт;
- отклонённый вызов хоста означает, что хранить имя он сейчас не может (сервер старее этой возможности,
  запрос не прошёл): этот один вызов чтения или записи работает с `localStorage`, как раньше. Хост
  поэтому может передавать пару всегда и отвечать отказом на старом сервере.

#### Где хранится свёрнутость панели

Свёрнутость критериев (кнопка `Filters`) хранит только хост — пара `getSearchFiltersCollapsed(contextName)` и
`saveSearchFiltersCollapsed({contextName, collapsed})` в `SearchUIProvider` (в Paynet — настройка
профиля пользователя на сервере, как и имя последнего набора). В браузере ничего не хранится: без пары
панель открывается развёрнутой при каждом монтировании. При монтировании с парой фильтры ждут ответа
хоста, чтобы не открыться развёрнутыми и не сложиться мгновение спустя; `null` и `false` означают
«развёрнуто». Отклонённый вызов (старый сервер) оставляет состояние в памяти этого монтирования, без
ошибки на экране. Запоминается и разворот через `Add filter`. Страницы с `hideShowFiltersButton` хост
не спрашивают.

### Меню шаблонов и их порядок

Кнопка `Saved filters` в заголовке панели (с применённым набором на ней стоит его имя) открывает меню: пункт
`Default`, под ним сохранённые наборы (применённый отмечен галочкой), внизу «Save as new filter set», пока набор
применён — «Update “<name>”», а если фильтры после этого менялись — «Discard changes». Нижние действия
закреплены и остаются видны при длинном списке. Удаление подтверждается через `PneConfirmProvider`, если хост
его смонтировал.

От 10 шаблонов сверху появляется поле поиска: оно получает фокус при открытии и фильтрует список по
вхождению без учёта регистра, без запросов к хосту. ↓ переводит фокус в список: на `Default`, а при набранном
запросе — на первое совпадение; ↑ оттуда возвращает в поле; Enter при набранном запросе применяет первое
совпадение. Пока список отфильтрован, порядок не меняется.

Если хост передал `reorderSearchTemplates`, у строк справа появляется ручка перетаскивания (мышь и touch), а с
клавиатуры шаблон двигается Alt+↑/Alt+↓. Новый порядок применяется сразу и уходит в
`reorderSearchTemplates({contextName, templateNames})` — полный список имён контекста. Хост сохраняет его так,
чтобы `getSearchTemplates` дальше возвращал шаблоны в этом порядке. Ошибка сохранения возвращает прежний
порядок и показывает `overlayActions.showTransientError`. Значение провайдера можно менять после монтирования:
уже открытое меню следует за добавленным или убранным `reorderSearchTemplates`, например когда хост узнаёт
позже, умеет ли сервер хранить порядок.

### Ручной режим поиска (manual search)

По умолчанию любое изменение фильтра немедленно запускает новый запрос.
Для экранов с тяжёлыми запросами можно включить ручной режим — фильтры будут
только накапливать изменения, а запрос отправится по нажатию кнопки **Search**:
в развёрнутой панели она стоит в нижней полосе у правого края, в свёрнутой панели и
в панели без критериев — в заголовке.

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
запрос сразу использует его условия. Кнопка Search активна всегда, кроме времени
загрузки данных таблицы и невалидного диапазона дат; нажатие без изменений повторяет
поиск и пересчитывает относительные даты.

Исключения из этого правила тоже остаются автоматическими:

- применение пользователем сохранённого шаблона после инициализации;
- пункт `Default`, «Discard changes» и `Clear all` (при скрытом меню наборов);
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
`DATE_INDEPENDENT` дат и `beforeCount` в пропсах не принимает и не пересчитывается: в поиск
уходят фиксированные границы (см. «Кастомизация фильтра диапазона дат»).

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

## PneCoachmark

Немодальная карточка-подсказка (`role="dialog"`, `aria-modal="false"`) шириной 360 px, привязанная к элементу
`anchorEl`: по умолчанию `placement="bottom-start"`, в 8 px от якоря и не ближе 16 px к краям окна. Без якоря
карточка стоит по центру экрана. Подложки и закрытия по клику мимо нет: карточка закрывается крестиком или Escape —
`onClose(event, 'closeButtonClick' | 'escapeKeyDown')`.

Основные пропсы: `open`, `onClose`, `title` или `ariaLabel` (одно из двух обязательно), `subtitle`, `children`,
`actions` (кнопки внизу), `hideCloseButton`, `disableEscapeKeyDown`, `closeLabel` (по умолчанию «Close»),
`container`, `disablePortal`, `modifiers`, `containerSx`, `slotProps`. `data-*` попадают на контейнер карточки.

## AbstractEntitySelector и AbstractEntitySelectModal

`AbstractEntitySelector` — две колонки, «Available» и «Added», с поиском, «выбрать все» в каждой колонке и
перетаскиванием между колонками и внутри них. Элементы — строки, `{id, name}`, `AbstractEntity` или `Country`.

- `list` (доступные) и `selected` (добавленные) читаются при монтировании и заново — только при смене `reset`;
- `onChange(mappedList, unMappedList)` получает обе колонки после каждого изменения;
- `height`, `virtualized` (по умолчанию `true`), `dragHandle: 'row' | 'button'`,
  `disableMoving: 'ADDED' | 'AVAILABLE'`, `allowNewlyAddedRemoval`, `optionRenderer`,
  `textRepresentation: 'ID' | 'NAME'`, `actionBlock`;
- якоря автотестов задаются через `getItemAttributes` и `elementAttributes`;
- ключи i18n: `search`, `abstractSelector.available`, `abstractSelector.added`, `abstractSelector.select.all`,
  `abstractSelector.reorder`.

`AbstractEntitySelectModal` — тот же выбор в `PneModal` шириной 600 px с кнопками Cancel и Save (ключи `cancel`,
`save`): `open`, `onClose`, `title`, `subTitle`, `unMappedList`, `mappedList`, `handleSave({mapped, unmapped})` и
пропсы самого выбора.

## useTable и useModal

`useTable` — состояние таблицы с серверной пагинацией и сортировкой. Он возвращает `data`, `loading`, `paginator`
(передаётся в `PneTable` как есть), `page`, `pageSize`, `sortIndex`, `order`, `onSortChange` и сеттеры.

- `fetchData({page, pageSize, order, sortIndex, extraDeps})` должен вернуть до `pageSize + 1` строк: лишняя строка
  означает, что есть следующая страница. Пустая страница дальше первой запрашивается заново как первая;
- `fetchDataExtraDeps` — значения, смена которых перезапрашивает данные;
- `rowsPerPageOptions` — размеры страницы, по умолчанию `[10, 25, 50]`; начальный размер — последний из них;
- `settingsContextName` — имя, под которым страница, размер и сортировка хранятся в `sessionStorage` вкладки;
- `displayOptions` / `onDisplayOptionsChange`, `resetKey`, `resetDisplayOptions`,
  `resetStateOnKeyChange: 'reset' | 'restore'`, `duplicatePagination`.

`AbstractTable` — реализация `PneTable` с теми же пропсами; новому коду нужен `PneTable`.

`useModal` — состояние открытия для `PneModal`: `const {open, setOpen, handleOpen, handleClose} = useModal()`,
сначала закрыто.

## Расстояния между действиями

`pneActionSpacing.buttons` и `pneActionSpacing.groups` — значения для `gap` между кнопками одной группы и между
группами (по 8 px), `PneModalActions` использует их сам. `PneThemeProvider` объявляет их CSS-переменные; со своим
`ThemeProvider` один раз у корня подключите `<PneActionSpacingStyles/>`. Подробности —
[docs/action-spacing.md](docs/action-spacing.md).

## Локализация (i18n)

Собственного `I18nextProvider` в `pne-ui` нет: компоненты читают строки через `useTranslation()` из контекста
`react-i18next` приложения-хоста. У большинства ключей есть английский текст по умолчанию — он показывается, пока
ключ не зарегистрирован. Ключи без текста по умолчанию (`search`, `cancel`, `save`, `create`, `clear`,
`clear.all`, `react.searchUI.filters`, значения enum) без перевода выводятся как сам ключ. Подписи отдельных
экземпляров задаются пропсами (`closeLabel`, `confirmLabel`, `undoLabel`, `fabLabel`, `noRowsMessage`, `labels`).
Список ключей — в [docs/i18n.md](docs/i18n.md).

### Что нужно сделать в проекте

1. Инициализировать i18next один раз в корне приложения (например, в точке входа или конфигурации Storybook).
2. Добавить `initReactI18next` или обернуть дерево в `<I18nextProvider i18n={i18nInstance}>`, чтобы контекст был доступен.
3. Зарегистрировать все строки, которые ожидают компоненты `pne-ui` — в первую очередь ключи вида
   `react.searchUI.*`, `react.CriterionTypeEnum.*`, `search`, `cancel`, `save`, `clear.all` и т.д. Они должны
   жить в ресурсах самого хоста.

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
                'react.searchUI.template': 'Сохранённые фильтры',
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

`pne-ui` поставляет `createPneTheme`, `PneThemeProvider` и тип `Skin`. Из скина тема берёт один цвет —
`experimentalColor`: из него строится шкала бренда, а из шкалы — цвета всех компонентов по ролям
(`theme.palette.pne`). Остальные поля `Skin` (хедер, меню, футер) тема не использует и хранит в `theme.skin`.
По умолчанию тема светлая; для тёмной передайте `{colorMode: 'dark'}` — поверхности, текст и роли компонентов
подбираются под тёмную схему. Кнопку MUI тема рисует целиком, см. раздел «Кнопка». Палитры MUI `pnePrimary`,
`pneNeutral` и `pneAccentuated` оставлены для старого кода на `IconButton` и `ToggleButtonGroup` из MUI; в новом
коде используйте роли `palette.pne`.

### Быстрый старт

1. Описываете skin (берете, например, из `window.PAYNET_SKIN`).
2. Создаёте тему `const theme = createPneTheme(skin)`.
3. Оборачиваете приложение в `<ThemeProvider theme={theme}>`, чтобы все компоненты `pne-ui` и стандартные MUI
   получили одинаковые значения цветов и стили переопределений.
4. Со своим `ThemeProvider` один раз у корня подключаете `<PneActionSpacingStyles/>`; `PneThemeProvider` делает
   это сам.

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

Вторым аргументом `createPneTheme(skin, options)` принимает только `colorMode` (`'light'` по умолчанию или
`'dark'`). Палитру, типографику и переопределения компонентов приложение в тему не передаёт: у всех приложений
под одним скином тема одна. Если приложению не хватает цвета или вида, его добавляют в `pne-ui`. Свои цвета одной
страницы (например, цвета графика) живут константами рядом с её компонентом, а не в теме.

Что тема задаёт сама, кроме вида компонентов:

- `palette.warning` — янтарный из шкалы UI Kit, одинаковый под любым скином и тот же, что у кнопки и
  уведомления-предупреждения: `main` `#A65C03`, `light` `#FA9A40`, `dark` `#8E4E01` в светлой теме, `#FA9A40` /
  `#FFC393` / `#D97A05` в тёмной. `light` — более яркий оттенок, а не подложка: от него MUI считает фон и текст
  своего `Alert`;
- заголовки `Typography` (`h1`–`h6`, в том числе `subtitle1` / `subtitle2`) под скином Paynet: отступ, который
  `main.css` скина даёт заголовкам документа, снят; в тёмной теме заголовок без своего цвета берёт цвет текста
  вокруг, в светлой остаётся цвет скина. Отступ и цвет, заданные самому заголовку (`sx`, `color`), сохраняются.

### Светлая и тёмная схемы

Для управляемого режима используйте `PneThemeProvider`. Он создаёт один MUI `ThemeProvider` и публикует
`usePneColorMode()` для переключателя внутри выбранной области. Компонент намеренно ничего не читает и не пишет
в `localStorage`: загрузка, optimistic update, rollback и сохранение пользовательской настройки принадлежат
приложению. Вложенный provider позволяет сначала включить dark mode только для одной страницы; React portals
этой страницы сохраняют её theme context.

```tsx
import {PneThemeProvider, type PneColorMode} from 'pne-ui'

const [mode, setMode] = useState<PneColorMode>('light')

return (
    <PneThemeProvider skin={skin} mode={mode} onModeChange={setMode}>
        <OrderDetails />
    </PneThemeProvider>
)
```

Новые роли доступны в `theme.palette.pne`: `surface.sunken/subtle/raised`,
`border.subtle/default/control`, `text.default/muted`, `control.foreground/foregroundHover/foregroundDisabled/activeBackground`
и `brand`. Группа `control` — нейтральные серые для собственных второстепенных элементов приложения: одинаковые
при любом скине, в покое не ниже 3:1 к странице. Компоненты `pne-ui` 5 её не используют: значки панели фильтров,
пагинация и выбор вида берут цвета из `pne.button.text`, полосы таблицы и знак сортировки — из `pne.table`.
Группа `brand` (`seed`, `foreground`, `fill`, `onFill`, `fillBorder`…) оставлена для старого кода: для ссылки
берите `pne.link`, для кольца фокуса — `pne.focusRing`, для залитого элемента — `pne.button.primary.<состояние>`.

### Цвета темы

Цвета компонентов `pne-ui` 5 собраны из трёх шкал UI Kit. Приложению они нужны, когда собственный элемент
должен попасть в тон компонентам библиотеки:

- `theme.palette.pne.ramp` — шкала бренда скина, шаги `PNE_BRAND_RAMP_STEPS` (от `0` до `950`): `0` — белый,
  `600` — заливка, `950` — самый тёмный. Вне темы ту же шкалу строит `createPneBrandRamp(skinColor)`
  из одного цвета скина;
- `PNE_NEUTRAL_RAMP` — нейтральная шкала, шаги от `0` до `1050`, одинаковая для всех скинов;
- `PNE_STATUS_COLORS` — шкалы `error`, `warning` и `success` с шагами от `50` до `950`, одинаковые для
  всех скинов;
- `theme.palette.pne.button`, `.switch`, `.checkbox`, `.field`, `.dropdown`, `.modal`, `.toast` и `.table` —
  готовые цвета компонентов по ролям UI Kit и состояниям, уже подобранные под светлую и тёмную схему;
  `focusRing` и `link` — цвет кольца фокуса и текста ссылки.

Заливка (шаг `600`) — это цвет скина, если белая подпись читается на нём при 4,5:1. Светлый цвет скина,
на котором белая подпись не читается и при 3:1, тоже остаётся заливкой и берёт тёмную подпись. Цвет между
ними темнеет до светлоты заливки UI Kit, а если белая подпись всё ещё не читается при 4,5:1 — дальше, пока не
начнёт читаться. Остальные шаги — шкала
бренда UI Kit, перенесённая на эту заливку: для `#026FD7` выходит шкала UI Kit точно.

Шкалы от схемы не зависят, поэтому для своего элемента берите готовую роль, а не шаг шкалы: роль остаётся
читаемой и в тёмной схеме, и при любом скине. `resolvePneSemanticPalette(theme)` возвращает
`theme.palette.pne`, а для темы, созданной без `createPneTheme`, строит такую же палитру из `primary.main`.

```tsx
import {useTheme} from '@mui/material'
import {resolvePneSemanticPalette} from 'pne-ui'

const OwnChip = ({children}: {children: React.ReactNode}) => {
    const {fill, border, text} = resolvePneSemanticPalette(useTheme()).button.soft.default

    return <span style={{background: fill, color: text, boxShadow: `inset 0 0 0 1px ${border}`}}>{children}</span>
}
```

`data-pne-state` на компонентах (`hover`, `pressed`, `focus`, `loading`) закрепляет состояние для образцов
Storybook; в коде продукта атрибут не задаётся.

## Публикация пакета

RC публикуются в npm под `next`, стабильные версии — под `latest` и только из истории `master`. Как выпускается
пакет — в [docs/releasing.md](docs/releasing.md).

[npm-url]: https://www.npmjs.com/package/pne-ui

[npm-image]: https://img.shields.io/npm/v/pne-ui

[github-publish]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml/badge.svg

[github-publish-url]: https://github.com/alcovp/pne-ui/actions/workflows/publish.yml
