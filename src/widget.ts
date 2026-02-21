import "./styles/widget.less";
import { Statistic, destroyAllStatistics, getStatistic } from "./core/Statistic";
import { DEFAULT_PALETTE } from "./core/defaults";
import type {
    BarStatisticInput,
    DoughnutStatisticInput,
    LineStatisticInput,
    RadarStatisticInput,
    StatisticConfig,
    WebHackerStatisticsApi
} from "./core/types";
import { toRgba } from "./core/utils";

const managedCanvases = new Set<HTMLCanvasElement>();

function valueTooltip(valueLabel?: string): NonNullable<NonNullable<StatisticConfig["options"]>["plugins"]>["tooltip"] {
    return {
        valueFormatter: value => (valueLabel ? `${valueLabel}: ${Math.round(value)}` : String(Math.round(value)))
    };
}

function upsertStatistic(canvas: HTMLCanvasElement, config: StatisticConfig, managed = false): void {
    const existingStatistic = getStatistic(canvas);

    if (existingStatistic) {
        existingStatistic.update(config);
    } else {
        new Statistic(canvas, config);
    }

    if (managed) {
        managedCanvases.add(canvas);
    }
}

function lineInputToConfig(input: LineStatisticInput): StatisticConfig {
    return {
        type: "line",
        data: {
            labels: input.labels,
            datasets: input.series.map((seriesItem, index) => {
                const color = seriesItem.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
                return {
                    label: seriesItem.label,
                    data: seriesItem.values,
                    borderColor: color,
                    backgroundColor: toRgba(color, 0.18),
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3
                };
            })
        },
        options: {
            plugins: {
                legend: {
                    display: input.options?.enableLegend !== false
                }
            }
        }
    };
}

function barInputToConfig(input: BarStatisticInput): StatisticConfig {
    return {
        type: "bar",
        data: {
            labels: input.labels,
            datasets: [
                {
                    label: input.options?.valueLabel ?? "Value",
                    data: input.values,
                    backgroundColor:
                        input.colors && input.colors.length > 0
                            ? input.colors
                            : input.values.map((_, index) => DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]),
                    borderColor: "#1f6fff",
                    borderWidth: 0,
                    fill: false
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: input.options?.enableLegend !== false
                },
                tooltip: valueTooltip(input.options?.valueLabel)
            }
        }
    };
}

function doughnutInputToConfig(input: DoughnutStatisticInput): StatisticConfig {
    return {
        type: "doughnut",
        data: {
            labels:
                input.labels && input.labels.length > 0
                    ? input.labels
                    : input.values.map((_, index) => `Item ${index + 1}`),
            datasets: [
                {
                    label: input.options?.valueLabel ?? "Value",
                    data: input.values,
                    backgroundColor:
                        input.colors && input.colors.length > 0
                            ? input.colors
                            : input.values.map((_, index) => DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]),
                    borderWidth: 0,
                    fill: false
                }
            ]
        },
        options: {
            cutout: `${Math.round((input.cutoutRatio ?? 0.58) * 100)}%`,
            plugins: {
                legend: {
                    display: input.options?.enableLegend !== false
                },
                tooltip: valueTooltip(input.options?.valueLabel)
            }
        }
    };
}

function radarInputToConfig(input: RadarStatisticInput): StatisticConfig {
    const color = input.colors?.[0] ?? DEFAULT_PALETTE[0];

    return {
        type: "radar",
        data: {
            labels: input.labels,
            datasets: [
                {
                    label: input.options?.valueLabel ?? "Value",
                    data: input.values,
                    borderColor: color,
                    backgroundColor: toRgba(color, 0.2),
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: true
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: valueTooltip(input.options?.valueLabel)
            }
        }
    };
}

function renderLine(input: LineStatisticInput): void {
    upsertStatistic(input.canvasElement, lineInputToConfig(input), true);
}

function renderBar(input: BarStatisticInput): void {
    upsertStatistic(input.canvasElement, barInputToConfig(input), true);
}

function renderDoughnut(input: DoughnutStatisticInput): void {
    upsertStatistic(input.canvasElement, doughnutInputToConfig(input), true);
}

function renderRadar(input: RadarStatisticInput): void {
    upsertStatistic(input.canvasElement, radarInputToConfig(input), true);
}

function refresh(): void {
    managedCanvases.forEach(canvas => {
        getStatistic(canvas)?.update();
    });
}

function destroy(canvasElement: HTMLCanvasElement): void {
    getStatistic(canvasElement)?.destroy();
    managedCanvases.delete(canvasElement);
}

function destroyAll(): void {
    destroyAllStatistics();
    managedCanvases.clear();
}

const widgetApi: WebHackerStatisticsApi = {
    Statistic,
    renderLine,
    renderBar,
    renderDoughnut,
    renderRadar,
    refresh,
    destroy,
    destroyAll
};

declare global {
    interface Window {
        WebHackerStatistics: WebHackerStatisticsApi;
    }
}

if (typeof window !== "undefined") {
    window.WebHackerStatistics = widgetApi;
}

export { Statistic, renderLine, renderBar, renderDoughnut, renderRadar, refresh, destroy, destroyAll, widgetApi };
