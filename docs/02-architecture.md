# Architecture

Структура:

- `src/widget.ts`  
  Публичный фасад API и регистрация глобальных методов.

- `src/core/types.ts`  
  Типы входных данных (`courseStats`, `statData`, `translations`).

- `src/core/themeVariables.ts`  
  Имена CSS-переменных и дефолтные значения темы.

- `src/core/themes.ts`  
  Чтение темы из CSS и color-утилиты.

- `src/core/canvas.ts`  
  Общие функции ресайза и очистки canvas.

- `src/core/animation.ts`  
  Унифицированная плавная анимация графиков.

- `src/charts/*.ts`  
  Низкоуровневый рендер каждого графика (`line`, `doughnut`, `bar`, `radar`).

- `src/features/courseStatistic.ts`  
  Сценарий отрисовки статистики курса.

- `src/features/testStatistic.ts`  
  Сценарий отрисовки статистики теста.
