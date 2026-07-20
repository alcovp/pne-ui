# pne-ui

[![NPM version][npm-image]][npm-url]
[![Build][github-build]][github-build-url]

Мега обертка над MUI

## Установка

Установите `pne-ui` вместе с peer-зависимостями:

```bash
yarn add pne-ui @emotion/react@^11 @emotion/styled@^11 @mui/material@^9 @mui/system@^9 @mui/x-date-pickers-pro@^9 @mui/icons-material@^9 i18next@^23 react@^19 react-dom@^19 react-i18next@^11
```

`pne-ui` требует React 19 и MUI 9. React 18 и предыдущие major-версии MUI не входят в поддерживаемый peer contract.

Необходимые peer-зависимости и минимальные версии:

- `@emotion/react@^11`
- `@emotion/styled@^11`
- `@mui/material@^9`
- `@mui/system@^9`
- `@mui/x-date-pickers-pro@^9`
- `@mui/icons-material@^9`
- `i18next@^23`
- `react@^19`
- `react-dom@^19`
- `react-i18next@^11`

## PneButton

`pneStyle` — единственный публичный способ выбрать PNE-вариант кнопки. Низкоуровневые MUI props `variant` и
`color` намеренно исключены из TypeScript API, чтобы они не конфликтовали с design-system preset.

| `pneStyle` | Эквивалент прежнего MUI API |
|---|---|
| `contained` или prop не задан | `variant="contained" color="primary"` |
| `outlined` | `variant="outlined" color="primary"` |
| `error` | `variant="outlined" color="error"` |
| `text` | `variant="text" color="primary"` |
| `neutral` | `variant="contained" color="pneNeutral"` |
| `neutralText` | `variant="text" color="pneNeutral"` |
| `primaryLight` | `variant="contained" color="pnePrimaryLight"` |
| `warning` | `variant="contained" color="pneWarningLight"` |
| `white` | `variant="contained" color="pneWhite"` |

Компонент сохраняет polymorphic MUI-контракт для `component` и `href`; типы DOM props, событий и `ref`
выводятся из фактического root element. Это поведение рассчитано на React 19 ref-as-prop.

## PneTextField

`PneTextField` сохраняет API MUI `TextField` и по умолчанию использует `size="small"`. Его `ref` указывает на
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

`null` обозначает только пустое состояние и не может входить в `options`; `undefined` также не является option.
Ключи сериализуются в строки, поэтому после сериализации они должны быть уникальны; например, `1` и `"1"`
конфликтуют. Пустая строка зарезервирована для `null`. Если key текущего `value` отсутствует в `options`, select
показывает empty/placeholder state без MUI `out-of-range` warning и снова отображает значение после появления
совпадающей option.

При миграции object options передавайте в `value` сам выбранный объект или `null`, а не замаскированный через cast
numeric/string ID. `getOptionLabel`, `getOptionProps`, `getOptionDisabled`, `renderOption` и `renderValue` теперь
работают с исходным `T`, а не с нормализованным `{value, label}`.

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
    toolbar={<PneTableToolbar
        aria-label="Table controls"
        contextual={<PneTableSelectionControls
            summary={`${selection.selectedCount} selected`}
            actions={consumerOwnedBulkActions}
            status={consumerOwnedLimitWarning}
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
полосе таблицы. Он измеряет фактическое содержимое и сохраняет DOM/keyboard-порядок Selection → View →
Pagination при переходе на несколько строк, включая поддерживаемую ширину viewport 360px.

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
                status={controller.selectingAllMatching ? 'Selecting…' : selectionStatus}
            />
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

## Справочник Selenium-якорей `pne-ui`

Документ предназначен для тестировщиков, которые пишут Selenium-автотесты. Здесь перечислены готовые
стабильные якоря `PneTable`, `SearchUI`, `SearchUIFilters`, всех 31 типов критериев и вынесенных в portal
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
| Общая полоса контролов | `[data-autotest="table-control-bar"]` | `data-autotest-value="inline|stacked"` |
| Выбор текущей страницы | `input[data-autotest="page-selection"]` | Native `checked`, `disabled`, `aria-checked="mixed"` |
| Выбор строки | `input[data-autotest="row-selection"]` | Native `checked`, `disabled`; consumer может задать `autoTestId`/`autoTestValue` |
| Selection summary/actions/status | `[data-autotest="selection-summary"]`, `[data-autotest="selection-actions"]`, `[data-autotest="selection-status"]` | Summary является polite live status |
| Пустой результат | `[data-autotest="empty-state"]` | Наличие существующей empty row |
| Загрузка | Semantic `table` | `aria-busy="true|false"` |
| Активная сортировка | `th[aria-sort="ascending"], th[aria-sort="descending"]` | Значение `aria-sort` |

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
| Показать/скрыть фильтры | `[data-autotest="toggle-filters"]` | Native button, `aria-expanded`, `aria-controls` |
| Очистить всё | `[data-autotest="clear-all"]` | Условно присутствует |
| Запустить поиск/refresh | `[data-autotest="run-search"]` | Native `disabled`/`isEnabled()` |
| Шаблоны | `[data-autotest="templates"]` | Native button, `aria-expanded`, `aria-controls` |
| Добавить фильтр | `[role="combobox"][data-autotest="add-filter"]` | Кликать actual combobox; `aria-expanded` |
| Очистить критерий | `[data-autotest="clear-criterion"]` | Native button внутри criterion root |
| Удалить критерий | `[data-autotest="remove-criterion"]` | Отсутствует у non-removable predefined criterion |

`clear-all`, templates, add-filter и отдельные criterion actions могут отсутствовать из-за config или текущего
состояния. Это условный UI, а не нарушение locator contract.

Внутри `add-filter-options/<scope>` конкретный доступный критерий сейчас выбирается как `[role="option"]` по
computed accessible name в фиксированной locale. Отдельного raw `data-autotest-value=<CriterionTypeEnum>` у
этих options пока нет; это явно известное исключение из raw-ID контракта.

#### Общие portals

MUI popover/modal/listbox может находиться вне DOM-поддерева `search-filters`. Такие roots ищутся от document по
тому же owner scope:

```css
[data-autotest="templates-panel"][data-autotest-value="orders"]
[data-autotest="add-filter-options"][data-autotest-value="orders"]
[data-autotest="template-editor"][data-autotest-value="orders"]
```

Внутри templates panel:

- строка: `[data-autotest="template-item"]`;
- применить конкретный шаблон: `button[data-autotest="select-template"][title="<template name>"]`;
- удалить: сначала найти строку выбранного шаблона, затем внутри неё
  `button[data-autotest="remove-template"]`.

`template-editor/<scope>` является отдельным dialog portal, а не потомком `templates-panel`. Его close button:
`button[data-autotest="close-template-editor"]`.

Имя шаблона остаётся пользовательским значением/accessible name и не копируется в technical ID. Create,
Cancel и обычные поля формы ищутся внутри scoped dialog по native role/name.

#### Actions без отдельного `data-autotest`

Для нескольких стандартных dialog actions контрактом служат native button + computed accessible name внутри
уже найденного scoped dialog:

- Add filter: option нужного критерия внутри `add-filter-options/<scope>`;
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
WebElement status = byAccessibleName(addFilterListbox, "[role='option']", "Status");
```

`expectedName` берётся из фиксированной locale тестового сценария. Это явно перечисленные locale-aware actions;
raw IDs критериев, options и entities по переведённому тексту не ищутся.

Для portal конкретного критерия используются все три owner attributes:

```css
[data-autotest="criterion-project-currency-options"][data-autotest-value="orders"][data-autotest-criterion="PROJECT_CURRENCY"]
```

Generated ID из `aria-controls` не хардкодируется; при необходимости он считывается у trigger после открытия
popup.

### Матрица всех 31 критериев

В таблице указан meaningful control, который должен быть ровно один внутри соответствующего
`criterion/<CriterionTypeEnum>` root.

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
- 45 native radio inputs: `criterion-label-option/<raw ORDER_SEARCH_LABEL>`;
- expanded state группы: `aria-expanded` на `summary` и native `details.open`;
- выбранное поле: native radio `checked`/Selenium `isSelected()`.

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

### Enum buttons: `STATUS`, `THREE_D`, `MARKER_STATUS`

Каждый вариант является actual button:

```css
[role="button"][data-autotest="criterion-option"][data-autotest-value="<raw enum>"]
```

Состояние читается из `aria-pressed`.

| Criterion | Raw values |
|---|---|
| `STATUS` | `ANY`, `DISABLED`, `ENABLED` |
| `THREE_D` | `ANY`, `NO`, `YES` |
| `MARKER_STATUS` | `any`, `unprocessed`, `processed` |

Регистр raw value значим.

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

Control может быть disabled или список может быть пустым, если не выбран ровно один Merchant либо provider не
вернул подходящие уровни. Это product state.

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
| Only enabled | Native checkbox `criterion-multiget-only-enabled`; только для семи типов из таблицы |
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
- после action изменился native/ARIA state или portal исчез.

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
- stacks и permanent overlays по умолчанию уходят одним React portal в `document.body`, не добавляя overlay-wrapper в DOM приложения; для изолированного harness можно передать `container` (или `null` для inline render);
- `maxSnack` является жёсткой границей: при переполнении самые старые snackbar удаляются, а не остаются скрытой очередью;
- повторный enqueue с тем же явным `id` игнорируется, пока первый snackbar присутствует. Для замены сначала вызовите `removeSnackbar(id)`.

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

Поддерживаемые Selenium-якоря размещены на существующих интерактивных/смысловых DOM nodes без
дополнительных wrapper-элементов:

| Якорь | Назначение |
|-------|------------|
| `alert.container` | контейнер confirm modal |
| `alert.message` | содержимое сообщения |
| `alert.button.close` | кнопка закрытия |
| `alert.button.cancel` | cancel action; отсутствует при `showCancel: false` |
| `alert.button.submit` | confirm action |

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
- По умолчанию UI рендерится portal-ом в `document.body`; `container` позволяет задать другой `Element` или callback (в том числе через `ref.current`). Layer берётся из `theme.zIndex.snackbar`/`theme.zIndex.modal`.
- `maxSnack` удаляет самые старые overflow entries. Явный `id` дедуплицирует pending snackbar по правилу first-wins.
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
