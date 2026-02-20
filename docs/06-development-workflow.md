# Development Workflow

## Локальная разработка

```bash
npm install
npm run dev
```

## Проверка типов

```bash
npm run typecheck
```

## Сборка CDN-бандла

```bash
npm run build
```

Файл для публикации:

- `dist/webhacker-statistic.bundle.js`

## Подключение в основном проекте

```html
<script src="https://cdn.jsdelivr.net/gh/webhacker1/statisticsWH@vX.Y.Z/dist/webhacker-statistic.bundle.js"></script>
<script>
    window.initStatistic();
    window.statisticTest(document.getElementById("statistics-widget"));
</script>
```
