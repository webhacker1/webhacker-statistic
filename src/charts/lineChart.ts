import type { ResolvedTheme } from "../core/themes";
import { toTransparent } from "../core/themes";
import { animateValue } from "../core/animation";
import { clearCanvas, resizeCanvas } from "../core/canvas";
import { buildTooltipHtml, hideCanvasTooltip, showCanvasTooltip } from "../core/tooltip";
import { hideCanvasLegend, renderCanvasLegend } from "../core/legend";

export type LineSeriesInput = {
    identifier: string;
    label: string;
    values: number[];
    color: string;
};

type LineSeriesState = LineSeriesInput & {
    visibility: number;
};

type LineChartState = {
    labels: string[];
    series: LineSeriesState[];
    theme: ResolvedTheme;
    progress: number;
    hoverIndex: number | null;
    initialized: boolean;
    legendEnabled: boolean;
};

const STATE_BY_CANVAS = new WeakMap<HTMLCanvasElement, LineChartState>();

function drawLineChart(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return;

    const resized = resizeCanvas(canvasElement, 300);
    if (!resized) return;
    const { context, width, height } = resized;

    clearCanvas(context, width, height, state.theme.panelBackground);

    const left = 40;
    const right = 16;
    const top = 16;
    const bottom = 38;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const visibleSeries = state.series.filter(currentSeries => currentSeries.visibility > 0.02);
    const visibleValues = visibleSeries.flatMap(currentSeries => currentSeries.values);
    const maximumValue = Math.max(...visibleValues, 1);
    const stepX = chartWidth / Math.max(state.labels.length - 1, 1);

    context.strokeStyle = state.theme.grid;
    context.lineWidth = 1;
    for (let gridLineIndex = 0; gridLineIndex <= 4; gridLineIndex += 1) {
        const y = top + (chartHeight / 4) * gridLineIndex;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(width - right, y);
        context.stroke();
    }

    const seriesPointMap = new Map<string, Array<{ x: number; y: number }>>();

    visibleSeries.forEach(currentSeries => {
        const points = currentSeries.values.map((value, index) => {
            const x = left + stepX * index;
            const normalized = Math.max(0, value * currentSeries.visibility) / maximumValue;
            const y = top + chartHeight - normalized * chartHeight * state.progress;
            return { x, y };
        });

        context.beginPath();
        points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.lineTo(left + stepX * (points.length - 1), top + chartHeight);
        context.lineTo(left, top + chartHeight);
        context.closePath();
        context.fillStyle = toTransparent(currentSeries.color, 0.15 * currentSeries.visibility);
        context.fill();

        context.beginPath();
        points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.strokeStyle = currentSeries.color;
        context.lineWidth = 2.6;
        context.globalAlpha = Math.max(0.1, currentSeries.visibility);
        context.stroke();
        context.globalAlpha = 1;

        points.forEach((point, pointIndex) => {
            const isHovered = pointIndex === state.hoverIndex && currentSeries.visibility > 0.5;
            context.beginPath();
            context.arc(point.x, point.y, isHovered ? 5.5 : 4, 0, Math.PI * 2);
            context.fillStyle = currentSeries.color;
            context.fill();
        });

        seriesPointMap.set(currentSeries.identifier, points);
    });

    if (state.hoverIndex !== null && state.hoverIndex >= 0 && state.hoverIndex < state.labels.length) {
        const x = left + stepX * state.hoverIndex;
        context.strokeStyle = toTransparent(state.theme.textSecondary, 0.28);
        context.setLineDash([4, 4]);
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(x, top + chartHeight);
        context.stroke();
        context.setLineDash([]);

        visibleSeries.forEach(currentSeries => {
            const points = seriesPointMap.get(currentSeries.identifier);
            const hoveredPoint = points?.[state.hoverIndex ?? 0];
            if (!hoveredPoint) return;

            context.beginPath();
            context.arc(hoveredPoint.x, hoveredPoint.y, 8, 0, Math.PI * 2);
            context.strokeStyle = toTransparent(currentSeries.color, 0.45);
            context.lineWidth = 1.5;
            context.stroke();
        });
    }

    context.fillStyle = state.theme.textSecondary;
    context.font = '12px "Segoe UI", sans-serif';
    context.textAlign = "center";
    const maxVisibleLabels = Math.max(2, Math.floor(chartWidth / 62));
    const labelStep = Math.max(1, Math.ceil(state.labels.length / maxVisibleLabels));
    state.labels.forEach((label, index) => {
        const isLast = index === state.labels.length - 1;
        const shouldRender = index % labelStep === 0 || isLast;
        if (!shouldRender) return;
        context.fillText(label, left + stepX * index, height - 12);
    });

    if (state.legendEnabled) {
        renderCanvasLegend(
            canvasElement,
            state.series.map(currentSeries => ({
                identifier: currentSeries.identifier,
                label: currentSeries.label,
                color: currentSeries.color,
                isActive: currentSeries.visibility > 0.5
            })),
            toggledIdentifier => {
                const currentState = STATE_BY_CANVAS.get(canvasElement);
                if (!currentState) return;
                const targetSeries = currentState.series.find(
                    currentSeries => currentSeries.identifier === toggledIdentifier
                );
                if (!targetSeries) return;
                const startVisibility = targetSeries.visibility;
                const endVisibility = startVisibility > 0.5 ? 0 : 1;

                animateValue({
                    animationKey: `line-toggle:${canvasElement.id}:${targetSeries.identifier}`,
                    durationMs: 360,
                    onUpdate(progress) {
                        const liveState = STATE_BY_CANVAS.get(canvasElement);
                        if (!liveState) return;
                        const liveSeries = liveState.series.find(
                            currentSeries => currentSeries.identifier === toggledIdentifier
                        );
                        if (!liveSeries) return;
                        liveSeries.visibility = startVisibility + (endVisibility - startVisibility) * progress;
                        drawLineChart(canvasElement);
                        hideCanvasTooltip(canvasElement);
                    }
                });
            }
        );
    } else {
        hideCanvasLegend(canvasElement);
    }
}

function bindLineChartHover(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state || state.initialized) return;
    state.initialized = true;

    canvasElement.addEventListener("mousemove", event => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState || currentState.labels.length === 0) return;

        const rect = canvasElement.getBoundingClientRect();
        const left = 40;
        const right = 16;
        const chartWidth = rect.width - left - right;
        const stepX = chartWidth / Math.max(currentState.labels.length - 1, 1);
        const relativeX = event.clientX - rect.left - left;
        const hoverIndex = Math.round(relativeX / Math.max(stepX, 1));
        const clampedIndex = Math.max(0, Math.min(currentState.labels.length - 1, hoverIndex));

        currentState.hoverIndex = clampedIndex;
        drawLineChart(canvasElement);

        const visibleSeries = currentState.series.filter(currentSeries => currentSeries.visibility > 0.02);
        if (visibleSeries.length === 0) {
            canvasElement.style.cursor = "default";
            hideCanvasTooltip(canvasElement);
            return;
        }

        canvasElement.style.cursor = "crosshair";
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        showCanvasTooltip(
            canvasElement,
            offsetX + 14,
            offsetY - 10,
            buildTooltipHtml(
                currentState.labels[clampedIndex],
                visibleSeries.map(currentSeries => ({
                    label: currentSeries.label,
                    value: Math.round((currentSeries.values[clampedIndex] ?? 0) * currentSeries.visibility),
                    accentColor: currentSeries.color
                }))
            )
        );
    });

    canvasElement.addEventListener("mouseleave", () => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;
        currentState.hoverIndex = null;
        drawLineChart(canvasElement);
        canvasElement.style.cursor = "default";
        hideCanvasTooltip(canvasElement);
    });
}

export function renderLineChart(
    canvasElement: HTMLCanvasElement,
    labels: string[],
    series: LineSeriesInput[],
    theme: ResolvedTheme,
    options?: {
        enableLegend?: boolean;
    }
): void {
    const previousState = STATE_BY_CANVAS.get(canvasElement);

    const state: LineChartState = {
        labels,
        series: series.map(currentSeries => {
            const previousSeries = previousState?.series.find(
                existingSeries => existingSeries.identifier === currentSeries.identifier
            );
            return {
                ...currentSeries,
                visibility: previousSeries?.visibility ?? 1
            };
        }),
        theme,
        progress: 0,
        hoverIndex: previousState?.hoverIndex ?? null,
        initialized: previousState?.initialized ?? false,
        legendEnabled: options?.enableLegend !== false
    };

    STATE_BY_CANVAS.set(canvasElement, state);
    bindLineChartHover(canvasElement);

    animateValue({
        animationKey: `line:${canvasElement.id}`,
        durationMs: 850,
        onUpdate(progress) {
            const currentState = STATE_BY_CANVAS.get(canvasElement);
            if (!currentState) return;
            currentState.progress = progress;
            drawLineChart(canvasElement);
        }
    });
}
