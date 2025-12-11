**Короткое формулирование задачи для протокола:**

Мы реализуем одинаковую функциональность (виджет-доску на Cloudscape + FAB/overlay-элементы) в двух разных проектах и хотим вынести её в общую библиотеку PNE UI. Нас интересует, насколько это хорошая практика и реально ли сделать компонент достаточно абстрактным, чтобы оба проекта могли по-разному наполнять его контентом. Второй вопрос — имеет ли смысл вынести глобальный overlay-слой (snackbars, ошибки, FAB, панельки и т.п.) тоже в PNE UI и дать ему Zustand-store с публичными actions, чтобы можно было управлять overlay из любой точки кода. Какие шаги нужны для начальной реализации этих двух частей?



Коротко:

1. Да, выносить **виджет‑доску** и **оверлей** в PNE UI – звучит вполне разумно.
2. Да, делать оверлей как сервис поверх Zustand, дергаемый из любой точки кода – тоже нормальный паттерн, если аккуратно спроектировать API.
3. Ниже – как бы я это разложил по слоям и какие шаги сделать для скелета.

---

## План задач для Codex (выносим максимум общих частей paynet-react → pne-ui)

1) Cloudscape база: добавить peerDeps (`@cloudscape-design/board-components`, `components`, `global-styles`), завести `cloudscape/theme` (токены + `CloudscapeThemeProvider`), css-оверрайды (flatten chrome, скрыть arrows/paddings), экспорт в индекс.
2) I18n/типизация: вынести `boardItemI18nStrings` и фабрику `createBoardI18nStrings`; определить общие типы брейкпоинтов, layout-конфига и helper `resolveBreakpoint`.
3) Widget board ядро: сделать `WidgetBoard` (обертка над Cloudscape Board) с пропсами `items`, `renderItem`, `i18nStrings`, `onItemsChange`, `empty`, `disableNavigationArrows`; экспортировать `WidgetBoardItem`/header/actions примитивы (стиль шапки, кнопки collapse/hide/reset), применить css-оверрайды.
4) Layout утилиты: вынести из paynet-react helpers `toBoardItem`, `applyCollapsedState`, `buildDefaultState`, `persist`/rehydrate-конструктор (без привязки к OrdersService), чтобы проекты могли подмешивать свою персистенцию.
5) FAB компонент: добавить `FabOverlay`/`FloatingActionButtons` с поддержкой брейкпоинтов (mobile vs desktop), стилизованный MUI.
6) Overlay слой: реализовать абстрактный Zustand-store (`useOverlayStore`, `overlayActions`) + `<OverlayHost />` (snackbars/alerts, точка расширения для панелей/FAB), экспорт из `overlay/`.
7) Документация: добавить краткие примеры использования (WidgetBoard + layout utils + FAB, OverlayHost + overlayActions) в README/отдельный md.

## 1. Общая архитектурная рамка

У вас по сути 3 сущности:

1. **Дизайн‑система / layout‑breakpoints** (общие для проектов).
2. **Widget board** (Cloudscape, две кодовые базы → хочется один компонент).
3. **Overlay‑слой** (FAB‑кнопки, меню, snackbar’ы, ошибки и т.п., реализовано на MUI + своём).

Идея: PNE UI становится **инфраструктурным UI‑слоем**, а проекты – только конфигурируют и наполняют его контентом.

---

## 2. Widget board: как абстрагировать

### 2.1. Что зашить в PNE UI, а что оставить проектам

В библиотеке:

* Логику раскладки / грид / drag&drop / responsive‑поведение.
* Работа с **breakpoints** (ваши 6 штук → единая схема).
* Контейнеры и общую структуру: панель с виджетами, их хром (заголовок, кнопки, иконки).
* Примитивы типа `<WidgetContainer>`, `<WidgetBoard>`, `useBreakpoint()`.

В проектах:

* Конфиг **какие именно виджеты** и как их рендерить.
* Тексты, конкретные иконки, специфичный бизнес‑UI внутри виджетов.
* Возможно – правила доступности по ролям и пр.

### 2.2. Типичный API для board

Пример «ядерного» интерфейса в PNE UI:

```ts
// @pne/ui/widgets/types.ts
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'; // ваши 6

export interface WidgetDescriptor<TExtraProps = unknown> {
  id: string;
  title: string;
  icon?: React.ReactNode;
  // что рендерить внутри виджета
  render: (props: TExtraProps) => React.ReactNode;
  // какие брейкпоинты поддерживает
  allowedBreakpoints?: Breakpoint[];
  // любые дополнительные метаданные
  meta?: Record<string, unknown>;
}

export interface WidgetBoardProps<TExtraProps = unknown> {
  widgets: WidgetDescriptor<TExtraProps>[];
  layoutConfig?: {
    // например, размеры/кол-во колонок на брейкпоинты
    columnsByBreakpoint?: Partial<Record<Breakpoint, number>>;
  };
  extraProps?: TExtraProps;
}
```

Реализация:

```tsx
// @pne/ui/widgets/WidgetBoard.tsx
export function WidgetBoard<TExtraProps>({
  widgets,
  layoutConfig,
  extraProps,
}: WidgetBoardProps<TExtraProps>) {
  const bp = useBreakpoint(); // единый хук для вашей дизайн-системы

  // дальше оборачиваете Cloudscape-компонентами
  // например, делаете грид, где каждый widget → <WidgetContainer>
  return (
    <CloudscapeGrid /* какой-то ваш layout */>
      {widgets
        .filter(w => !w.allowedBreakpoints || w.allowedBreakpoints.includes(bp))
        .map(widget => (
          <WidgetContainer key={widget.id} title={widget.title} icon={widget.icon}>
            {widget.render(extraProps as TExtraProps)}
          </WidgetContainer>
        ))}
    </CloudscapeGrid>
  );
}
```

В проекте:

```tsx
// project A
import { WidgetBoard } from '@pne/ui/widgets';

const widgets = [
  {
    id: 'orders',
    title: 'Orders',
    render: () => <OrdersWidget />,
  },
  {
    id: 'stats',
    title: 'Stats',
    allowedBreakpoints: ['md', 'lg', 'xl'],
    render: () => <StatsWidget />,
  },
];

export function OrdersScreen() {
  return <WidgetBoard widgets={widgets} />;
}
```

Так вы получаете **один и тот же скелет** в двух репах, а наполнение – свое.

### 2.3. FAB / плавающие кнопки и маленькие экраны

FAB / плюсик‑кнопка на маленьких экранах – это тоже часть «инфраструктуры», поэтому логично:

* В PNE UI сделать компонент, который:

    * знает о брейкпоинтах;
    * при `bp === 'xs' | 'sm'` показывает **одну FAB‑кнопку**;
    * при `bp >= 'md'` может рендерить постоянную панель.

Например:

```tsx
// @pne/ui/widgets/WidgetBoardWithFab.tsx
interface WidgetBoardWithFabProps<T> extends WidgetBoardProps<T> {
  fabMenu?: React.ReactNode; // чем заполнять выезжающее меню
}

export function WidgetBoardWithFab<T>(props: WidgetBoardWithFabProps<T>) {
  const bp = useBreakpoint();
  const isSmall = bp === 'xs' || bp === 'sm';

  return (
    <>
      <WidgetBoard {...props} />
      {isSmall && (
        <FabOverlay>
          {/* внутри используете MUI Fab + своё меню */}
          {props.fabMenu}
        </FabOverlay>
      )}
    </>
  );
}
```

А уже каждый проект подсовывает в `fabMenu` свой список действий / виджетов.

---

## 3. Overlay + Zustand как инфраструктурный слой

### 3.1. Идея: один глобальный overlay‑сервис

Да, иметь **один overlay‑слой на приложение**, которым можно управлять:

```ts
import { overlayActions } from '@pne/ui/overlay';

overlayActions.showSnackbar({ message: 'Error!', variant: 'error' });
overlayActions.openPanel({ content: <MyPanel /> });
```

– это нормальная практика. Типичный паттерн:

1. В PNE UI лежит **Zustand‑store** с состоянием оверлея.
2. Там же – компонент `<OverlayHost />`, который подписывается на store и отображает:

    * snackbars,
    * error‑toasts,
    * возможно, модалки,
    * тот же FAB‑слой, если нужно.
3. Внешнему миру вы отдаёте **actions**, чтобы можно было дернуть всё из любого места.

### 3.2. Минимальный skeleton store’а

```ts
// @pne/ui/overlay/overlayStore.ts
import { create } from 'zustand';

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error';

export interface Snackbar {
  id: string;
  message: string;
  variant?: SnackbarVariant;
  autoHideMs?: number;
}

interface OverlayState {
  snackbars: Snackbar[];
  showSnackbar: (s: Omit<Snackbar, 'id'>) => void;
  removeSnackbar: (id: string) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  snackbars: [],
  showSnackbar: (snackbar) =>
    set((state) => ({
      snackbars: [
        ...state.snackbars,
        {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          autoHideMs: 5000,
          ...snackbar,
        },
      ],
    })),
  removeSnackbar: (id) =>
    set((state) => ({
      snackbars: state.snackbars.filter((s) => s.id !== id),
    })),
}));

// Внешние actions, которые можно дергать без хуков
export const overlayActions = {
  showSnackbar: (snackbar: Omit<Snackbar, 'id'>) =>
    useOverlayStore.getState().showSnackbar(snackbar),
  removeSnackbar: (id: string) =>
    useOverlayStore.getState().removeSnackbar(id),
};
```

### 3.3. Host‑компонент оверлея

```tsx
// @pne/ui/overlay/OverlayHost.tsx
import { Snackbar as MuiSnackbar, Alert } from '@mui/material';
import { useOverlayStore } from './overlayStore';

export function OverlayHost() {
  const snackbars = useOverlayStore((s) => s.snackbars);
  const removeSnackbar = useOverlayStore((s) => s.removeSnackbar);

  return (
    <>
      {snackbars.map((snack) => (
        <MuiSnackbar
          key={snack.id}
          open
          autoHideDuration={snack.autoHideMs}
          onClose={() => removeSnackbar(snack.id)}
        >
          <Alert
            onClose={() => removeSnackbar(snack.id)}
            severity={snack.variant ?? 'info'}
          >
            {snack.message}
          </Alert>
        </MuiSnackbar>
      ))}
      {/* здесь же можно рендерить overlay‑панели, FAB, др. вещи */}
    </>
  );
}
```

В проекте:

```tsx
// App.tsx
import { OverlayHost } from '@pne/ui/overlay';

export function App() {
  return (
    <>
      <YourLayout />
      <OverlayHost />
    </>
  );
}
```

И затем из «любой точки»:

```ts
import { overlayActions } from '@pne/ui/overlay';

overlayActions.showSnackbar({
  message: 'Saved!',
  variant: 'success',
});
```

### 3.4. Потенциальные грабли и как их обойти

* **Несколько экземпляров store-а**
  Важно, чтобы store создавался **один раз на модуль**, а не внутри компонента. Ваш подход (store на уровне модуля + отдельный `OverlayHost`) это обеспечивает.

* **SSR** (если у вас Next/SSR):
  Тогда надо продумать, как чистить состояние между запросами. На начальном этапе можно не заморачиваться, если у вас CSR.

* **Засорение API**
  Не стоит в `overlayActions` тащить всё подряд. Хорошо иметь:

    * `showSnackbar`,
    * `showErrorSnackbar` / `showSuccessSnackbar` (с готовыми дефолтами),
    * возможно `openOverlay(content)`, `closeOverlay(id)` – для кастомных панелей.

---

## 4. Вынос overlay‑компонента в PNE UI – это хорошая идея?

Да, при условиях:

1. **Overlay не знает про бизнес‑логику.**
   Он чисто технический: как, где, сколько, какие анимации, какие варианты цветов и т.п.

2. **API максимально декларитивное и стабильное.**
   Пример: `showSnackbar({ code, message, variant })`, а не `showSnackbar(error)` (где внутри всё хардкодно разбираете).

3. Вы закладываетесь, что **в будущем туда будут добавляться новые типы оверлеев**:

    * модальные окна,
    * bottom‑sheets для мобилок,
    * “глобальный” spinners и т.п.

Лучше сразу спроектировать state так, чтобы был **слот под разные сущности**:

```ts
interface OverlayState {
  snackbars: Snackbar[];
  modals: ModalState[];
  panels: PanelState[];
  // ...
}
```

Но начать можно лишь со snackbar’ов, а остальное добавлять по мере необходимости.

---

## 5. Конкретные шаги для начальной реализации

### Шаги для **Widget board** скелета

1. **Создайте/обновите пакет PNE UI**

    * Убедитесь, что это отдельный npm‑пакет/пакет в монорепе.
    * В `peerDependencies`: `react`, `react-dom`, `@cloudscape-design/components`, `@mui/material` (если надо).

2. **Заведите модуль `layout`**:

    * Определите тип `Breakpoint` и объект с их значениями.
    * Реализуйте `useBreakpoint()` – один хук на всю дизайн‑систему.
    * (Опционально) компонент `ResponsiveOnly` для удобства.

3. **Добавьте `WidgetBoard`**:

    * Как минимум: пропсы `widgets`, `layoutConfig`.
    * Внутри – Cloudscape layout + `<WidgetContainer>`.

4. **Добавьте первую реализацию `WidgetBoardWithFab`**:

    * На маленьких брейкпоинтах – MUI FAB‑кнопка.
    * FAB открывает простое меню со списком виджетов (или действий).
    * Меню и поведение (пропсы) держите максимально абстрактными.

5. **Подключите в обоих проектах**:

    * В каждом проекте сделайте список `widgets`, передайте в `WidgetBoard`.
    * Убедитесь, что API подходит обоим, отрефакторьте до «минимального общего знаменателя».

---

### Шаги для **Overlay** скелета

1. **Создайте модуль `overlay` в PNE UI**:

    * Определите типы `Snackbar`, `SnackbarVariant`.
    * Реализуйте Zustand‑store (`useOverlayStore`).
    * Экспортируйте `overlayActions`.

2. **Сделайте `<OverlayHost />`**:

    * Используйте Material UI `Snackbar`/`Alert` для первой реализации.
    * Подпишитесь на store, отрисовывайте snackbars.

3. **Подключите OverlayHost в корень обоих приложений**:

    * В layout/`App.tsx` добавьте `<OverlayHost />` рядом с root layout.
    * Убедитесь, что в дереве React он «самый верхний» поверх всего (можно через Portal).

4. **Замените legacy Redux‑оверлей на новый**:

    * Ищите места, где вы диспатчите старые actions `showErrorToast` и т.п.
    * Проставляйте вместо них `overlayActions.showSnackbar(…)`.

5. **По желанию – добавьте поддержку других типов оверлея**:

    * Например, `overlayActions.openPanel({ id, content })` + слот в `<OverlayHost />`.
    * Или “глобальный” loading‑indicator.

---

Если хочешь, следующим шагом можем прямо набросать более конкретный API для `WidgetBoardWithFab` с учётом ваших 6 брейкпоинтов и Cloudscape, и подумать: где лучше провести границу между PNE UI и бизнес‑компонентами в этих двух проектах.
