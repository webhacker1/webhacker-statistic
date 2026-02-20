# WebHacker Statistic

Canvas-based статистическая библиотека без сторонних сервисов и внешних chart-библиотек.

## Сборка

```bash
npm install
npm run build
```

Результат:

- `dist/webhacker-statistic.bundle.js`

## Подключение

```html
<script src="https://cdn.jsdelivr.net/gh/webhacker1/statisticsWH@v1.0.0/dist/webhacker-statistic.bundle.js"></script>
```

## Формат входных данных

```js
window.courseStats = {
    activityData: [{ date: "2026-02-01", join: 10, leave: 2 }],
    stepTypeData: { text: 8, video: 6, test: 17, blank: 2, matching: 5 },
    structure: { modules: 6, lessons: 7, steps: 34 }
};

window.translations = {
    course: {
        text: "Текст",
        video: "Видео",
        test: "Тест",
        blank: "Пропуски",
        matching: "Сопоставление",
        stat_modules: "Модули",
        stat_lessons: "Уроки",
        stat_steps: "Шаги"
    }
};

window.statData = {
    countPasses: 152,
    countCorrectPasses: 119,
    answers: [
        { answer: "Текст", vote_count: 8 },
        { answer: "Видео", vote_count: 6 }
    ]
};
```

## API

```js
window.WebHackerStatistics.initStatistic();
window.WebHackerStatistics.statisticTest(document.getElementById("statistics-widget"));
```

Совместимые алиасы:

```js
window.initStatistic();
window.statisticTest(document.getElementById("statistics-widget"));
```
