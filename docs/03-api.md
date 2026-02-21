# API Reference

## 1. Основной API

### 1.1 Конструктор

```ts
new WebHackerStatistics.Statistic(context, config)
```

Параметры:

- `context`: `HTMLCanvasElement | CanvasRenderingContext2D`
- `config`: конфигурация статистики

### 1.2 Методы экземпляра

#### `stat.update(nextConfig?)`

- с `nextConfig`: замена конфига + новая анимация
- без `nextConfig`: перерисовка текущего состояния

#### `stat.resize()`

- ручной пересчет размеров

#### `stat.destroy()`

- удаляет listeners и служебный DOM

#### `stat.getConfig()`

- возвращает копию текущего конфига

## 2. Конфиг

```ts
{
  type: "line" | "bar" | "doughnut" | "radar",
  data: {
    labels: string[],
    datasets: [{
      label?: string,
      data: number[],
      borderColor?: string,
      backgroundColor?: string | string[],
      borderWidth?: number,
      pointRadius?: number,
      tension?: number,
      fill?: boolean,
      hidden?: boolean
    }]
  },
  options?: {
    responsive?: boolean,
    animation?: { duration?: number },
    cutout?: string | number,
    scales?: {
      y?: { beginAtZero?: boolean }
    },
    plugins?: {
      legend?: { display?: boolean },
      tooltip?: {
        enabled?: boolean,
        valueFormatter?: (value: number) => string
      }
    }
  }
}
```

## 3. Публичные функции

- `renderLine(input)`
- `renderBar(input)`
- `renderDoughnut(input)`
- `renderRadar(input)`
- `refresh()`
- `destroy(canvas)`
- `destroyAll()`

Это wrapper-методы поверх `new Statistic(...)`.

## 4. Пример

```js
const stat = new WebHackerStatistics.Statistic(canvas, {
  type: "doughnut",
  data: {
    labels: ["Text", "Video", "Quiz"],
    datasets: [{
      data: [10, 6, 14],
      backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"]
    }]
  },
  options: {
    cutout: "58%",
    animation: { duration: 900 },
    plugins: {
      legend: { display: true },
      tooltip: {
        valueFormatter: value => `${value} шт.`
      }
    }
  }
});

stat.update();
```

## 5. Темная тема

Библиотека использует CSS-переменные:

- `--wh-stat-bg`
- `--wh-stat-grid`
- `--wh-stat-text-primary`
- `--wh-stat-text-muted`
- `--wh-stat-tooltip-bg`
- `--wh-stat-tooltip-border`

Тема обновляется автоматически при смене:

- `prefers-color-scheme`
- `class/style/data-theme/theme` на `html/body`
