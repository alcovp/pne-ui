# Справочник Selenium-якорей `pne-ui`

Документ предназначен для тестировщиков, которые пишут Selenium-автотесты. Здесь перечислены готовые
стабильные якоря `PneTable`, `SearchUI`, `SearchUIFilters`, всех 31 типов критериев и вынесенных в portal
панелей. Искать нужный элемент по JSX, структуре MUI или случайным классам не требуется.

Примеры ниже используют CSS selectors, поддерживаемые обычным Selenium WebDriver. Это справочник публичного
DOM-контракта, а не руководство по реализации компонентов библиотеки.

## Быстрый старт

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

### Пример scoped lookup

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

## Как читать состояние

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

## `PneTable`

### Scope экземпляра

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

### Внутренние элементы

| Элемент | Selector относительно table scope | Состояние |
|---|---|---|
| Верхняя пагинация | `[data-autotest="pagination"][data-autotest-value="top"]` | Native button `disabled`; `current-page` внутри |
| Нижняя пагинация | `[data-autotest="pagination"][data-autotest-value="bottom"]` | Native button `disabled`; `current-page` внутри |
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

## SearchUI/SearchUIFilters

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

### Общие actions

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

### Общие portals

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

### Actions без отдельного `data-autotest`

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

## Матрица всех 31 критериев

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

## `EXACT`

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

## `ORDERS_SEARCH`

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

## Enum buttons: `STATUS`, `THREE_D`, `MARKER_STATUS`

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

## Collections

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

## `CUSTOMER_LEVEL`

- control: `criterion-customer-level/<raw selected level id>`;
- listbox: `criterion-customer-level-options/<scope>` + `data-autotest-criterion="CUSTOMER_LEVEL"`;
- option: `criterion-customer-level-option/<raw level id>`;
- loading: `aria-busy`;
- недоступность до выбора зависимостей/при loading: `aria-disabled="true"` на combobox;
- выбранный option: `aria-selected`.

Control может быть disabled или список может быть пустым, если не выбран ровно один Merchant либо provider не
вернул подходящие уровни. Это product state.

## `PROJECT_CURRENCY`

- control: `criterion-project-currency/<raw currency id>`;
- listbox: `criterion-project-currency-options/<scope>` + owning criterion;
- option: `criterion-project-currency-option/<raw currency id>`;
- conversion checkbox: native
  `input[data-autotest="criterion-project-currency-convert"]`; состояние через `isSelected()`/`checked`;
- loading: `aria-busy`; disabled selector: `aria-disabled="true"` на combobox.

Conversion checkbox остаётся отдельным native control и не становится disabled автоматически только из-за
недоступности currency combobox.

## Date criteria

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

## `PROCESSOR_LOG_ENTRY_TYPE`

- control: `criterion-processor-log-entry-type/<raw numeric provider id>`;
- listbox: `criterion-processor-log-entry-type-options/<scope>` + owning criterion;
- option: `criterion-processor-log-entry-type-option/<raw numeric provider id>`;
- selection: `aria-selected`.

## `ERROR_CODE`

- actual autocomplete input: `criterion-error-code/<raw committed choice id>`;
- текст запроса читается из `.value`, а не из test attribute;
- clear action: `criterion-error-code-clear`;
- paper: `criterion-error-code-panel/<scope>` + owning criterion;
- listbox: `criterion-error-code-options/<scope>` + owning criterion;
- option: `criterion-error-code-option/<raw choice id>`;
- loading: `aria-busy`; selection: `aria-selected`.

Одинаковые display labels не создают коллизию, потому что identity option — raw ID.

## `GROUPING`

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

## `TRANSACTION_SESSION_STATUS`

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

## Multiget: девять типов критериев

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

### Inline trigger и summary

- actual native button: `criterion-multiget-trigger/<NONE|ALL|SEARCH>`;
- selected/excluded summary Chip: `criterion-multiget-value/<raw numeric entity.id>`;
- open state: `aria-expanded`; portal link: `aria-controls`; popup type: `aria-haspopup="dialog"`.

Сохранённый фильтр может восстановить режим `SEARCH`, однако внутри dialog переключатели режима существуют
только для `NONE` и `ALL`. В таком восстановленном состоянии не ожидайте обязательный `aria-pressed="true"`
у одного из этих двух переключателей.

### Owner-scoped dialog

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

## Ожидания и асинхронный UI

Для async lists/pickers/modal используйте explicit waits на смысловое состояние:

- owner-scoped portal появился;
- trigger получил `aria-expanded="true"`;
- `aria-busy` стал `false`;
- ожидаемый raw option появился;
- после action изменился native/ARIA state или portal исчез.

Не используйте fixed sleeps. Не считайте empty result ошибкой locator, если provider действительно вернул
пустой список.

## На чём не строить Selenium-локаторы

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

## Где находится источник истины

Этот файл — основной реестр поддерживаемых Selenium-якорей библиотеки. Storybook используется только для
интерактивных примеров.
