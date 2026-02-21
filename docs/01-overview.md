# Overview

## Что это

`WebHackerStatistics` — библиотека статистики на Canvas с единым API.

```js
const stat = new WebHackerStatistics.Statistic(canvas, config);
```

## Типы визуализаций

- `line`
- `bar`
- `doughnut`
- `radar`

## Структура

```text
src/
  core/
    Statistic.ts   # основной класс-оркестратор
    defaults.ts    # дефолтные опции и normalize
    dom.ts         # legend/tooltip
    geometry.ts    # математика/пути
    types.ts       # типы API
    utils.ts       # тема, цвета, clone
    statistic/
      runtimeTypes.ts # внутренние типы рендера/hover
      layout.ts       # общая разметка осей и сетки
      line.ts         # line: draw + hit-test + tooltip
      bar.ts          # bar: draw + hit-test + tooltip
      doughnut.ts     # doughnut: draw + hit-test + tooltip
      radar.ts        # radar: draw + hit-test + tooltip
  styles/
    widget.less    # стили и тема
  widget.ts        # публичный API
```

## Публичный API

- `window.WebHackerStatistics.Statistic`
- `window.WebHackerStatistics.renderLine(...)`
- `window.WebHackerStatistics.renderBar(...)`
- `window.WebHackerStatistics.renderDoughnut(...)`
- `window.WebHackerStatistics.renderRadar(...)`
- `window.WebHackerStatistics.refresh()`
- `window.WebHackerStatistics.destroy(canvas)`
- `window.WebHackerStatistics.destroyAll()`

## Дальше

- Архитектура: `docs/02-architecture.md`
- API: `docs/03-api.md`
- Workflow: `docs/06-development-workflow.md`
