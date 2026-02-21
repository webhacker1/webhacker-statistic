import type { StatisticConfig, StatisticDataset, StatisticOptions, StatisticType } from "./types";

export const DEFAULT_PALETTE = [
    "#36A2EB",
    "#FF6384",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#8BC34A",
    "#607D8B"
] as const;

export const THEME = {
    background: "--wh-stat-bg",
    grid: "--wh-stat-grid",
    textPrimary: "--wh-stat-text-primary",
    textMuted: "--wh-stat-text-muted",
    tooltipBackground: "--wh-stat-tooltip-bg",
    tooltipBorder: "--wh-stat-tooltip-border"
} as const;

export const FALLBACK_THEME = {
    background: "#ffffff",
    grid: "#e6edf7",
    textPrimary: "#1f2d3d",
    textMuted: "#5f7389",
    tooltipBackground: "rgba(18, 27, 43, 0.94)",
    tooltipBorder: "rgba(255, 255, 255, 0.2)"
} as const;

export const DEFAULT_OPTIONS: Required<StatisticOptions> = {
    responsive: true,
    animation: {
        duration: 900
    },
    cutout: "58%",
    scales: {
        y: {
            beginAtZero: true
        }
    },
    plugins: {
        legend: {
            display: true
        },
        tooltip: {
            enabled: true,
            valueFormatter: (value: number) => {
                if (Number.isFinite(value)) {
                    return Intl.NumberFormat("ru-RU").format(value);
                }
                return String(value);
            }
        }
    }
};

export function defaultDataset(type: StatisticType, datasetIndex: number): StatisticDataset {
    const color = DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length];
    const isFilledLine = type === "line";

    return {
        label: `Dataset ${datasetIndex + 1}`,
        data: [],
        borderColor: color,
        backgroundColor: isFilledLine ? toRgba(color, 0.2) : color,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
        fill: isFilledLine,
        hidden: false
    };
}

export function mergeOptions(options?: StatisticOptions): Required<StatisticOptions> {
    const defaultBeginAtZero = DEFAULT_OPTIONS.scales.y?.beginAtZero ?? true;
    const defaultLegendDisplay = DEFAULT_OPTIONS.plugins.legend?.display ?? true;
    const defaultTooltipEnabled = DEFAULT_OPTIONS.plugins.tooltip?.enabled ?? true;
    const defaultValueFormatter =
        DEFAULT_OPTIONS.plugins.tooltip?.valueFormatter ??
        ((value: number) => {
            if (Number.isFinite(value)) return String(value);
            return String(value);
        });

    return {
        responsive: options?.responsive ?? DEFAULT_OPTIONS.responsive,
        animation: {
            duration: options?.animation?.duration ?? DEFAULT_OPTIONS.animation.duration
        },
        cutout: options?.cutout ?? DEFAULT_OPTIONS.cutout,
        scales: {
            y: {
                beginAtZero: options?.scales?.y?.beginAtZero ?? defaultBeginAtZero
            }
        },
        plugins: {
            legend: {
                display: options?.plugins?.legend?.display ?? defaultLegendDisplay
            },
            tooltip: {
                enabled: options?.plugins?.tooltip?.enabled ?? defaultTooltipEnabled,
                valueFormatter: options?.plugins?.tooltip?.valueFormatter ?? defaultValueFormatter
            }
        }
    };
}

export function normalizeConfig(input: StatisticConfig): StatisticConfig {
    const labels = Array.isArray(input.data.labels) ? input.data.labels.map(value => String(value)) : [];
    const datasets = Array.isArray(input.data.datasets)
        ? input.data.datasets.map((dataset, datasetIndex) => {
              const fallback = defaultDataset(input.type, datasetIndex);
              const normalizedData = Array.isArray(dataset.data)
                  ? dataset.data.map(value => (Number.isFinite(value) ? Number(value) : 0))
                  : [];

              return {
                  ...fallback,
                  ...dataset,
                  label: dataset.label ?? fallback.label,
                  data: normalizedData,
                  borderColor: dataset.borderColor ?? fallback.borderColor,
                  backgroundColor: dataset.backgroundColor ?? fallback.backgroundColor,
                  borderWidth: dataset.borderWidth ?? fallback.borderWidth,
                  pointRadius: dataset.pointRadius ?? fallback.pointRadius,
                  tension: dataset.tension ?? fallback.tension,
                  fill: dataset.fill ?? fallback.fill,
                  hidden: dataset.hidden ?? fallback.hidden
              };
          })
        : [];

    return {
        type: input.type,
        data: {
            labels,
            datasets
        },
        options: mergeOptions(input.options)
    };
}

function toRgba(hexColor: string, alpha: number): string {
    if (!hexColor.startsWith("#") || hexColor.length !== 7) {
        return hexColor;
    }

    const red = Number.parseInt(hexColor.slice(1, 3), 16);
    const green = Number.parseInt(hexColor.slice(3, 5), 16);
    const blue = Number.parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
