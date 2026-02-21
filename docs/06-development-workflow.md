# Development Workflow

## 1. Команды

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## 2. Порядок изменений

1. Обновить контракт в `docs/03-api.md`
2. Изменить типы в `src/core/types.ts`
3. Реализовать логику в `src/core/Statistic.ts`
4. При необходимости добавить/обновить утилиты в `src/core/*`
5. Обновить демо `index.html`
6. Прогнать `typecheck` и `build`

## 3. Добавление нового типа

1. Добавить новый `type` в `types.ts`
2. Добавить `draw<Type>()` в `Statistic.ts`
3. Добавить ветки hit-test и tooltip
4. Обновить документацию

## 4. Тема

Ключевые CSS-переменные:

- `--wh-stat-bg`
- `--wh-stat-grid`
- `--wh-stat-text-primary`
- `--wh-stat-text-muted`
- `--wh-stat-tooltip-bg`
- `--wh-stat-tooltip-border`

Для ручного управления темой в приложении можно использовать:

- `data-theme="dark"`
- `theme="dark"`
- `.theme-dark`

Библиотека отслеживает смену темы и перерисовывает активные экземпляры автоматически.

## 5. Checklist перед merge

- Нет TS ошибок
- `destroy()` освобождает listeners и DOM
- tooltip/legend корректны на всех типах
- resize и тема работают
- docs актуальны
