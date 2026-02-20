import "./styles/widget.less";
import { resolveTheme } from "./core/themes";
import { renderLineChart } from "./charts/lineChart";
import { renderBarChart } from "./charts/barChart";
import { renderDoughnutChart } from "./charts/doughnutChart";
import { renderRadarChart } from "./charts/radarChart";
import type {
    BarChartInput,
    DoughnutChartInput,
    GenericChartsApi,
    LineChartInput,
    RadarChartInput
} from "./core/types";

type RenderBucket = {
    line: Map<HTMLCanvasElement, LineChartInput>;
    bar: Map<HTMLCanvasElement, BarChartInput>;
    doughnut: Map<HTMLCanvasElement, DoughnutChartInput>;
    radar: Map<HTMLCanvasElement, RadarChartInput>;
};

const renderBucket: RenderBucket = {
    line: new Map(),
    bar: new Map(),
    doughnut: new Map(),
    radar: new Map()
};

let themeObserver: MutationObserver | null = null;
let scheduledRefreshFrame: number | null = null;

function getThemeSourceElement(canvasElement: HTMLCanvasElement): Element {
    return canvasElement.closest(".statistics-widget-root") || document.body || document.documentElement;
}

function scheduleRefresh(): void {
    if (scheduledRefreshFrame !== null) {
        cancelAnimationFrame(scheduledRefreshFrame);
        scheduledRefreshFrame = null;
    }

    scheduledRefreshFrame = requestAnimationFrame(() => {
        scheduledRefreshFrame = null;
        refreshAll();
    });
}

function ensureThemeObserver(): void {
    if (themeObserver) return;

    const observer = new MutationObserver(() => {
        scheduleRefresh();
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class", "data-theme", "theme"]
    });

    if (document.body) {
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style", "class", "data-theme", "theme"]
        });
    }

    window.addEventListener("resize", () => scheduleRefresh());
    themeObserver = observer;
}

function sanitizeLineInput(input: LineChartInput): LineChartInput {
    return {
        canvasElement: input.canvasElement,
        labels: [...input.labels],
        series: input.series.map(seriesItem => ({
            identifier: String(seriesItem.identifier),
            label: String(seriesItem.label),
            values: [...seriesItem.values],
            color: seriesItem.color
        })),
        options: {
            ...input.options
        }
    };
}

function sanitizeBarInput(input: BarChartInput): BarChartInput {
    return {
        canvasElement: input.canvasElement,
        labels: [...input.labels],
        values: [...input.values],
        colors: input.colors ? [...input.colors] : undefined,
        options: {
            ...input.options
        }
    };
}

function sanitizeDoughnutInput(input: DoughnutChartInput): DoughnutChartInput {
    return {
        canvasElement: input.canvasElement,
        values: [...input.values],
        labels: input.labels ? [...input.labels] : undefined,
        colors: input.colors ? [...input.colors] : undefined,
        cutoutRatio: input.cutoutRatio,
        options: {
            ...input.options
        }
    };
}

function sanitizeRadarInput(input: RadarChartInput): RadarChartInput {
    return {
        canvasElement: input.canvasElement,
        labels: [...input.labels],
        values: [...input.values],
        colors: input.colors ? [...input.colors] : undefined,
        options: {
            ...input.options
        }
    };
}

function applyLineInput(input: LineChartInput): void {
    const theme = resolveTheme(getThemeSourceElement(input.canvasElement));
    renderLineChart(
        input.canvasElement,
        input.labels,
        input.series.map((seriesItem, seriesIndex) => ({
            ...seriesItem,
            color: seriesItem.color || theme.palette[seriesIndex % theme.palette.length]
        })),
        theme,
        {
            enableLegend: input.options?.enableLegend
        }
    );
}

function applyBarInput(input: BarChartInput): void {
    const theme = resolveTheme(getThemeSourceElement(input.canvasElement));
    renderBarChart(input.canvasElement, input.labels, input.values, theme, {
        enableLegend: input.options?.enableLegend,
        valueLabel: input.options?.valueLabel
    });
}

function applyDoughnutInput(input: DoughnutChartInput): void {
    const theme = resolveTheme(getThemeSourceElement(input.canvasElement));
    renderDoughnutChart(
        input.canvasElement,
        input.values,
        input.colors || theme.palette.slice(0, input.values.length || 1),
        theme,
        input.cutoutRatio,
        input.labels,
        {
            enableLegend: input.options?.enableLegend,
            valueLabel: input.options?.valueLabel,
            shareLabel: input.options?.shareLabel
        }
    );
}

function applyRadarInput(input: RadarChartInput): void {
    const theme = resolveTheme(getThemeSourceElement(input.canvasElement));
    renderRadarChart(
        input.canvasElement,
        input.labels,
        input.values,
        input.colors || theme.palette.slice(0, input.values.length || 1),
        theme,
        {
            valueLabel: input.options?.valueLabel,
            noDataLabel: input.options?.noDataLabel
        }
    );
}

function renderLineChartApi(input: LineChartInput): void {
    const normalizedInput = sanitizeLineInput(input);
    renderBucket.line.set(normalizedInput.canvasElement, normalizedInput);
    applyLineInput(normalizedInput);
    ensureThemeObserver();
}

function renderBarChartApi(input: BarChartInput): void {
    const normalizedInput = sanitizeBarInput(input);
    renderBucket.bar.set(normalizedInput.canvasElement, normalizedInput);
    applyBarInput(normalizedInput);
    ensureThemeObserver();
}

function renderDoughnutChartApi(input: DoughnutChartInput): void {
    const normalizedInput = sanitizeDoughnutInput(input);
    renderBucket.doughnut.set(normalizedInput.canvasElement, normalizedInput);
    applyDoughnutInput(normalizedInput);
    ensureThemeObserver();
}

function renderRadarChartApi(input: RadarChartInput): void {
    const normalizedInput = sanitizeRadarInput(input);
    renderBucket.radar.set(normalizedInput.canvasElement, normalizedInput);
    applyRadarInput(normalizedInput);
    ensureThemeObserver();
}

function refreshAll(): void {
    renderBucket.line.forEach(input => applyLineInput(input));
    renderBucket.bar.forEach(input => applyBarInput(input));
    renderBucket.doughnut.forEach(input => applyDoughnutInput(input));
    renderBucket.radar.forEach(input => applyRadarInput(input));
}

function destroyChart(canvasElement: HTMLCanvasElement): void {
    renderBucket.line.delete(canvasElement);
    renderBucket.bar.delete(canvasElement);
    renderBucket.doughnut.delete(canvasElement);
    renderBucket.radar.delete(canvasElement);
}

function destroyAllCharts(): void {
    renderBucket.line.clear();
    renderBucket.bar.clear();
    renderBucket.doughnut.clear();
    renderBucket.radar.clear();
}

const widgetApi: GenericChartsApi = {
    renderLineChart: renderLineChartApi,
    renderBarChart: renderBarChartApi,
    renderDoughnutChart: renderDoughnutChartApi,
    renderRadarChart: renderRadarChartApi,
    refresh: refreshAll,
    destroy: destroyChart,
    destroyAll: destroyAllCharts
};

declare global {
    interface Window {
        WebHackerStatistics: GenericChartsApi;
    }
}

if (typeof window !== "undefined") {
    window.WebHackerStatistics = widgetApi;
}

export {
    renderLineChartApi as renderLineChart,
    renderBarChartApi as renderBarChart,
    renderDoughnutChartApi as renderDoughnutChart,
    renderRadarChartApi as renderRadarChart,
    refreshAll as refresh,
    destroyChart as destroy,
    destroyAllCharts as destroyAll,
    widgetApi
};
