# Architecture

## 1. Главная идея

Вокруг одного класса `Statistic` (`src/core/Statistic.ts`):

1. Вход: `canvas | 2d context` + `config`
2. Нормализация: `normalizeConfig` (`src/core/defaults.ts`)
3. Анимационный рендер-цикл
4. Интерактив: hover, hit-test, tooltip
5. Внешний UI: legend/tooltip через `src/core/dom.ts`

## 2. Слои

### Core

- `Statistic.ts`: жизненный цикл экземпляра
- `defaults.ts`: дефолты и нормализация
- `geometry.ts`: `clamp/lerp/ease/path`
- `utils.ts`: чтение CSS-переменных темы, color utils
- `dom.ts`: legend и tooltip
- `types.ts`: типы API

### Public

- `src/widget.ts`: сборка публичного объекта `window.WebHackerStatistics`

### Styles

- `src/styles/widget.less`: оформление и токены темы (`--wh-stat-*`)

## 3. Жизненный цикл

1. `new Statistic(context, config)`
2. `bindEvents()` + resize observer
3. `resizeCanvas()` с учетом `devicePixelRatio`
4. `startAnimation()`
5. `draw()`:
- фон
- отрисовка нужного типа
- legend
- tooltip

6. Обновление: `stat.update(nextConfig?)`
7. Очистка: `stat.destroy()`

## 4. Тема (light/dark)

Поддерживаются два сценария:

1. Смена системной темы (`prefers-color-scheme`)
2. Смена темы приложения через `class/style/data-theme/theme`

При смене темы библиотека автоматически перерисовывает все активные экземпляры.

## 5. Расширение

Чтобы добавить новый тип:

1. добавить тип в `src/core/types.ts`
2. добавить `draw<Type>()` в `src/core/Statistic.ts`
3. добавить ветку в `hitTest()`
4. добавить tooltip-ветку в `renderTooltip()`
5. обновить `docs/03-api.md`
