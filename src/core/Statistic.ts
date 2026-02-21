
import { DEFAULT_PALETTE, normalizeConfig } from "./defaults";
import { destroyDom, hideTooltip, renderLegend, showTooltip } from "./dom";
import { clamp, easeOutCubic } from "./geometry";
import {
    buildBarTooltip,
    drawBarStatistic,
    hitTestBarStatistic
} from "./statistic/bar";
import {
    buildDoughnutTooltip,
    drawDoughnutStatistic,
    hitTestDoughnutStatistic
} from "./statistic/doughnut";
import { createPlotArea } from "./statistic/layout";
import {
    buildLineTooltip,
    drawLineStatistic,
    hitTestLineStatistic
} from "./statistic/line";
import {
    buildRadarTooltip,
    drawRadarStatistic,
    hitTestRadarStatistic
} from "./statistic/radar";
import type {
    BarPoint,
    DoughnutSlice,
    HoverTarget,
    LinePoint,
    RadarPoint
} from "./statistic/runtimeTypes";
import type { StatisticConfig, StatisticContext } from "./types";
import { datasetColor, deepClone, resolveTheme } from "./utils";

const INSTANCES = new WeakMap<HTMLCanvasElement, Statistic>();
const ALL_STATISTICS = new Set<Statistic>();
const OBSERVED_THEME_ATTRIBUTES = ["class", "style", "data-theme", "theme"];
let themeObserver: MutationObserver | null = null;
let scheduledThemeRefreshFrame: number | null = null;
let themeMediaQuery: MediaQueryList | null = null;
let themeMediaListener: (() => void) | null = null;

export class Statistic {
    private readonly canvas: HTMLCanvasElement;

    private readonly context: CanvasRenderingContext2D;

    private config: StatisticConfig;

    private animationProgress = 1;

    private animationFrameId: number | null = null;

    private animationStart = 0;

    private animationDuration = 900;

    private destroyed = false;

    private dpr = 1;

    private canvasWidth = 0;

    private canvasHeight = 0;

    private linePoints: LinePoint[][] = [];

    private barPoints: BarPoint[] = [];

    private doughnutSlices: DoughnutSlice[] = [];

    private radarPoints: RadarPoint[] = [];

    private hoverTarget: HoverTarget = null;

    private pointerX = 0;

    private pointerY = 0;

    private readonly hiddenDatasets = new Set<number>();

    private readonly hiddenSlices = new Set<number>();

    private readonly onMouseMoveBound = (event: MouseEvent) => {
        this.onMouseMove(event);
    };

    private readonly onMouseLeaveBound = () => {
        this.onMouseLeave();
    };

    private readonly onResizeBound = () => {
        this.resize();
    };

    private resizeObserver: ResizeObserver | null = null;

    constructor(context: StatisticContext, config: StatisticConfig) {
        if (context instanceof HTMLCanvasElement) {
            this.canvas = context;
            const drawingContext = context.getContext("2d");
            if (!drawingContext) {
                throw new Error("Cannot initialize statistic: 2D context is not available.");
            }
            this.context = drawingContext;
        } else {
            this.context = context;
            this.canvas = context.canvas;
        }

        this.config = normalizeConfig(config);
        this.syncHiddenState();
        this.bindEvents();
        this.installResizeHandling();
        this.resizeCanvas();
        this.startAnimation(this.config.options?.animation?.duration);

        INSTANCES.set(this.canvas, this);
        ALL_STATISTICS.add(this);
        Statistic.ensureThemeTracking();
    }

    update(nextConfig?: StatisticConfig): void {
        if (this.destroyed) return;

        if (nextConfig) {
            const previousType = this.config.type;
            this.config = normalizeConfig(nextConfig);
            this.syncHiddenState(previousType !== this.config.type);
        }

        this.startAnimation(this.config.options?.animation?.duration);
    }

    resize(): void {
        if (this.destroyed) return;
        this.resizeCanvas();
        this.draw(this.animationProgress);
    }

    destroy(): void {
        if (this.destroyed) return;

        this.destroyed = true;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.canvas.removeEventListener("mousemove", this.onMouseMoveBound);
        this.canvas.removeEventListener("mouseleave", this.onMouseLeaveBound);
        window.removeEventListener("resize", this.onResizeBound);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        destroyDom(this.canvas);
        INSTANCES.delete(this.canvas);
        ALL_STATISTICS.delete(this);
    }

    getConfig(): StatisticConfig {
        return deepClone(this.config);
    }

    static getStatistic(canvas: HTMLCanvasElement): Statistic | undefined {
        return INSTANCES.get(canvas);
    }

    static destroyAll(): void {
        Array.from(ALL_STATISTICS).forEach(statistic => statistic.destroy());
    }

    static refreshAllTheme(): void {
        Array.from(ALL_STATISTICS).forEach(statistic => statistic.redrawForTheme());
    }

    private static ensureThemeTracking(): void {
        if (themeObserver || typeof window === "undefined") return;

        const scheduleThemeRefresh = () => {
            if (scheduledThemeRefreshFrame !== null) return;
            scheduledThemeRefreshFrame = requestAnimationFrame(() => {
                scheduledThemeRefreshFrame = null;
                Statistic.refreshAllTheme();
            });
        };

        themeObserver = new MutationObserver(() => {
            scheduleThemeRefresh();
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: OBSERVED_THEME_ATTRIBUTES
        });

        if (document.body) {
            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: OBSERVED_THEME_ATTRIBUTES
            });
        }

        if (typeof window.matchMedia === "function") {
            themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            themeMediaListener = () => {
                scheduleThemeRefresh();
            };

            if (typeof themeMediaQuery.addEventListener === "function") {
                themeMediaQuery.addEventListener("change", themeMediaListener);
            } else {
                themeMediaQuery.addListener(themeMediaListener);
            }
        }
    }

    private redrawForTheme(): void {
        if (this.destroyed) return;
        this.draw(this.animationProgress || 1);
    }

    private bindEvents(): void {
        this.canvas.addEventListener("mousemove", this.onMouseMoveBound);
        this.canvas.addEventListener("mouseleave", this.onMouseLeaveBound);
    }

    private installResizeHandling(): void {
        const container = this.canvas.parentElement;

        if (typeof ResizeObserver !== "undefined" && container) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resize();
            });
            this.resizeObserver.observe(container);
            return;
        }

        window.addEventListener("resize", this.onResizeBound);
    }

    private syncHiddenState(clearAll = false): void {
        if (clearAll) {
            this.hiddenDatasets.clear();
            this.hiddenSlices.clear();
        }

        const nextDatasetHidden = new Set<number>();
        this.config.data.datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden || this.hiddenDatasets.has(datasetIndex)) {
                nextDatasetHidden.add(datasetIndex);
            }
        });

        this.hiddenDatasets.clear();
        nextDatasetHidden.forEach(index => this.hiddenDatasets.add(index));

        if (this.config.type !== "doughnut") {
            this.hiddenSlices.clear();
            return;
        }

        const slices = this.config.data.datasets[0]?.data ?? [];
        const nextSliceHidden = new Set<number>();

        slices.forEach((_, index) => {
            if (this.hiddenSlices.has(index)) {
                nextSliceHidden.add(index);
            }
        });

        this.hiddenSlices.clear();
        nextSliceHidden.forEach(index => this.hiddenSlices.add(index));
    }

    private startAnimation(duration?: number): void {
        this.animationDuration = Math.max(0, duration ?? 900);

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.animationDuration === 0) {
            this.animationProgress = 1;
            this.draw(1);
            return;
        }

        this.animationStart = performance.now();
        this.animationProgress = 0;

        const tick = (timestamp: number) => {
            if (this.destroyed) return;

            const elapsed = timestamp - this.animationStart;
            const progress = clamp(elapsed / this.animationDuration, 0, 1);
            this.animationProgress = easeOutCubic(progress);
            this.draw(this.animationProgress);

            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(tick);
                return;
            }

            this.animationFrameId = null;
        };

        this.animationFrameId = requestAnimationFrame(tick);
    }

    private resizeCanvas(): void {
        this.dpr = window.devicePixelRatio || 1;

        const bounds = this.canvas.getBoundingClientRect();
        const fallbackWidth = this.canvas.parentElement?.clientWidth ?? 640;
        const fallbackHeight = this.canvas.parentElement?.clientHeight ?? 320;

        const logicalWidth = Math.max(280, Math.round(bounds.width || fallbackWidth));
        const logicalHeight = Math.max(220, Math.round(bounds.height || fallbackHeight));

        this.canvasWidth = logicalWidth;
        this.canvasHeight = logicalHeight;

        this.canvas.width = Math.round(logicalWidth * this.dpr);
        this.canvas.height = Math.round(logicalHeight * this.dpr);
        this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    private draw(progress: number): void {
        const themeSource = this.canvas.closest(".statistics-widget-root") ?? document.documentElement;
        const theme = resolveTheme(themeSource);

        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.context.fillStyle = theme.background;
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.linePoints = [];
        this.barPoints = [];
        this.doughnutSlices = [];
        this.radarPoints = [];

        switch (this.config.type) {
            case "line": {
                this.linePoints = drawLineStatistic({
                    context: this.context,
                    config: this.config,
                    canvasWidth: this.canvasWidth,
                    canvasHeight: this.canvasHeight,
                    hiddenDatasets: this.hiddenDatasets,
                    hiddenSlices: this.hiddenSlices,
                    progress,
                    formatValue: value => this.formatValue(value),
                    drawEmptyState: (color, message) => this.drawEmptyState(color, message),
                    theme,
                    hoverTarget: this.hoverTarget,
                    area: createPlotArea(this.canvasWidth, this.canvasHeight)
                });
                break;
            }
            case "bar": {
                this.barPoints = drawBarStatistic({
                    context: this.context,
                    config: this.config,
                    canvasWidth: this.canvasWidth,
                    canvasHeight: this.canvasHeight,
                    hiddenDatasets: this.hiddenDatasets,
                    hiddenSlices: this.hiddenSlices,
                    progress,
                    formatValue: value => this.formatValue(value),
                    drawEmptyState: (color, message) => this.drawEmptyState(color, message),
                    theme,
                    hoverTarget: this.hoverTarget,
                    area: createPlotArea(this.canvasWidth, this.canvasHeight)
                });
                break;
            }
            case "doughnut": {
                this.doughnutSlices = drawDoughnutStatistic({
                    context: this.context,
                    config: this.config,
                    canvasWidth: this.canvasWidth,
                    canvasHeight: this.canvasHeight,
                    hiddenDatasets: this.hiddenDatasets,
                    hiddenSlices: this.hiddenSlices,
                    progress,
                    formatValue: value => this.formatValue(value),
                    drawEmptyState: (color, message) => this.drawEmptyState(color, message),
                    theme,
                    hoverTarget: this.hoverTarget
                });
                break;
            }
            case "radar": {
                this.radarPoints = drawRadarStatistic({
                    context: this.context,
                    config: this.config,
                    canvasWidth: this.canvasWidth,
                    canvasHeight: this.canvasHeight,
                    hiddenDatasets: this.hiddenDatasets,
                    hiddenSlices: this.hiddenSlices,
                    progress,
                    formatValue: value => this.formatValue(value),
                    drawEmptyState: (color, message) => this.drawEmptyState(color, message),
                    theme,
                    hoverTarget: this.hoverTarget
                });
                break;
            }
            default:
                this.drawEmptyState(theme.textMuted, "Unsupported statistic type");
        }

        this.renderLegend();
        this.renderTooltip();
    }

    private drawEmptyState(color: string, message: string): void {
        this.context.fillStyle = color;
        this.context.font = '14px "Segoe UI", sans-serif';
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillText(message, this.canvasWidth / 2, this.canvasHeight / 2);
    }

    private renderLegend(): void {
        const display = this.config.options?.plugins?.legend?.display ?? true;

        if (this.config.type === "doughnut") {
            const dataset = this.config.data.datasets[0];
            const labels = this.config.data.labels;

            const items = (dataset?.data ?? []).map((_, index) => ({
                id: String(index),
                label: labels[index] ?? `Item ${index + 1}`,
                color: datasetColor(dataset?.backgroundColor, DEFAULT_PALETTE[index % DEFAULT_PALETTE.length], index),
                active: !this.hiddenSlices.has(index)
            }));

            renderLegend(
                this.canvas,
                items,
                id => {
                    const index = Number(id);
                    if (!Number.isFinite(index)) return;

                    if (this.hiddenSlices.has(index)) this.hiddenSlices.delete(index);
                    else this.hiddenSlices.add(index);

                    this.startAnimation(380);
                },
                display
            );
            return;
        }

        const items = this.config.data.datasets.map((dataset, datasetIndex) => ({
            id: String(datasetIndex),
            label: dataset.label ?? `Dataset ${datasetIndex + 1}`,
            color: dataset.borderColor ?? DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length],
            active: !this.hiddenDatasets.has(datasetIndex)
        }));

        renderLegend(
            this.canvas,
            items,
            id => {
                const datasetIndex = Number(id);
                if (!Number.isFinite(datasetIndex)) return;

                if (this.hiddenDatasets.has(datasetIndex)) this.hiddenDatasets.delete(datasetIndex);
                else this.hiddenDatasets.add(datasetIndex);

                this.startAnimation(380);
            },
            display
        );
    }

    private onMouseMove(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = event.clientX - rect.left;
        this.pointerY = event.clientY - rect.top;

        this.hoverTarget = this.hitTest(this.pointerX, this.pointerY);
        this.canvas.style.cursor = this.hoverTarget ? "pointer" : "default";
        this.draw(this.animationProgress);
    }

    private onMouseLeave(): void {
        this.hoverTarget = null;
        this.canvas.style.cursor = "default";
        hideTooltip(this.canvas);
        this.draw(this.animationProgress);
    }

    private hitTest(x: number, y: number): HoverTarget {
        switch (this.config.type) {
            case "line":
                return hitTestLineStatistic({
                    x,
                    y,
                    area: createPlotArea(this.canvasWidth, this.canvasHeight),
                    labels: this.config.data.labels
                });
            case "bar":
                return hitTestBarStatistic({ x, y, barPoints: this.barPoints });
            case "doughnut":
                return hitTestDoughnutStatistic({
                    x,
                    y,
                    canvasWidth: this.canvasWidth,
                    canvasHeight: this.canvasHeight,
                    cutout: this.config.options?.cutout,
                    slices: this.doughnutSlices
                });
            case "radar":
                return hitTestRadarStatistic({ x, y, radarPoints: this.radarPoints });
            default:
                return null;
        }
    }

    private renderTooltip(): void {
        const enabled = this.config.options?.plugins?.tooltip?.enabled ?? true;
        if (!enabled || !this.hoverTarget) {
            hideTooltip(this.canvas);
            return;
        }

        if (this.hoverTarget.kind === "line") {
            const payload = buildLineTooltip({
                config: this.config,
                hiddenDatasets: this.hiddenDatasets,
                hoverIndex: this.hoverTarget.index,
                formatValue: value => this.formatValue(value)
            });
            showTooltip(this.canvas, this.pointerX + 14, this.pointerY - 8, payload.title, payload.rows);
            return;
        }

        if (this.hoverTarget.kind === "bar") {
            const payload = buildBarTooltip({
                config: this.config,
                hiddenDatasets: this.hiddenDatasets,
                pointIndex: this.hoverTarget.index,
                formatValue: value => this.formatValue(value)
            });
            showTooltip(this.canvas, this.pointerX + 14, this.pointerY - 8, payload.title, payload.rows);
            return;
        }

        if (this.hoverTarget.kind === "doughnut") {
            const payload = buildDoughnutTooltip({
                config: this.config,
                hiddenSlices: this.hiddenSlices,
                index: this.hoverTarget.index,
                formatValue: value => this.formatValue(value)
            });
            showTooltip(this.canvas, this.pointerX + 14, this.pointerY - 8, payload.title, payload.rows);
            return;
        }

        if (this.hoverTarget.kind === "radar") {
            const payload = buildRadarTooltip({
                config: this.config,
                index: this.hoverTarget.index,
                datasetIndex: this.hoverTarget.datasetIndex,
                formatValue: value => this.formatValue(value)
            });
            showTooltip(this.canvas, this.pointerX + 14, this.pointerY - 8, payload.title, payload.rows);
            return;
        }

        hideTooltip(this.canvas);
    }

    private formatValue(value: number): string {
        const formatter = this.config.options?.plugins?.tooltip?.valueFormatter;
        if (formatter) return formatter(value);
        return String(value);
    }
}

export function createStatistic(context: StatisticContext, config: StatisticConfig): Statistic {
    return new Statistic(context, config);
}

export function getStatistic(canvas: HTMLCanvasElement): Statistic | undefined {
    return Statistic.getStatistic(canvas);
}

export function destroyAllStatistics(): void {
    Statistic.destroyAll();
}
