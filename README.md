# WebHackerStatistics v2

Canvas-библиотека статистики с простым API.

Поддерживаемые типы:
- `line`
- `bar`
- `doughnut`
- `radar`

## Сборка

```bash
npm install
npm run build
```

Результат:
- `dist/webhacker-statistic.bundle.js`

## Быстрый старт

```html
<script src="./dist/webhacker-statistic.bundle.js"></script>

<div class="statistics-widget-root">
  <div style="height: 320px"><canvas id="stat"></canvas></div>
</div>

<script>
  const stat = new window.WebHackerStatistics.Statistic(document.getElementById("stat"), {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        {
          label: "Users",
          data: [12, 19, 14, 21, 25],
          borderColor: "#2f89ff",
          backgroundColor: "rgba(47,137,255,0.20)",
          fill: true
        }
      ]
    }
  });

  // обновление
  stat.update();
  // удаление
  // stat.destroy();
</script>
```

## API

Публичный объект:
- `window.WebHackerStatistics.Statistic`
- `window.WebHackerStatistics.renderLine(input)`
- `window.WebHackerStatistics.renderBar(input)`
- `window.WebHackerStatistics.renderDoughnut(input)`
- `window.WebHackerStatistics.renderRadar(input)`
- `window.WebHackerStatistics.refresh()`
- `window.WebHackerStatistics.destroy(canvas)`
- `window.WebHackerStatistics.destroyAll()`

## Документация

- `docs/01-overview.md`
- `docs/02-architecture.md`
- `docs/03-api.md`
- `docs/06-development-workflow.md`
