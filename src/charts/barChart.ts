import type { ResolvedTheme } from "../core/themes";
import { toTransparent } from "../core/themes";
import { animateValue } from "../core/animation";
import { clearCanvas, resizeCanvas } from "../core/canvas";
import { buildTooltipHtml, hideCanvasTooltip, showCanvasTooltip } from "../core/tooltip";
import { hideCanvasLegend, renderCanvasLegend } from "../core/legend";

type BarMeta = {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type BarState = {
    labels: string[];
    values: number[];
    visibility: number[];
    theme: ResolvedTheme;
    progress: number;
    hoverIndex: number | null;
    initialized: boolean;
    bars: BarMeta[];
    valueLabel: string;
    legendEnabled: boolean;
};

const STATE_BY_CANVAS = new WeakMap<HTMLCanvasElement, BarState>();

function getVisibleBarValue(state: BarState, index: number): number {
    return Math.max(0, (state.values[index] ?? 0) * (state.visibility[index] ?? 1));
}

function drawBarChart(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return;

    const resized = resizeCanvas(canvasElement, 300);
    if (!resized) return;
    const { context, width, height } = resized;

    clearCanvas(context, width, height, state.theme.panelBackground);

    const left = 24;
    const right = 12;
    const top = 14;
    const bottom = 38;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const maximumValue =
        Math.max(...state.values.map((_, index) => getVisibleBarValue(state, index)), 1) || 1;
    const barWidth = Math.min(64, chartWidth / Math.max(state.values.length * 2, 1));
    const gap =
        state.values.length > 1
            ? (chartWidth - barWidth * state.values.length) / (state.values.length - 1)
            : 0;

    context.strokeStyle = state.theme.grid;
    context.lineWidth = 1;
    for (let gridIndex = 0; gridIndex <= 5; gridIndex += 1) {
        const y = top + (chartHeight / 5) * gridIndex;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(width - right, y);
        context.stroke();
    }

    const gradientColors = [
        ["#6a5acd", "rgba(106,90,205,0.25)"],
        ["#00bcd4", "rgba(0,188,212,0.25)"],
        ["#ff5722", "rgba(255,87,34,0.25)"]
    ];

    state.bars = [];

    state.values.forEach((_, index) => {
        const visibleValue = getVisibleBarValue(state, index);
        const x = left + index * (barWidth + gap);
        const normalizedHeight = (visibleValue / maximumValue) * chartHeight * state.progress;
        const y = top + (chartHeight - normalizedHeight);
        const isHovered = state.hoverIndex === index;

        const gradient = context.createLinearGradient(0, y, 0, top + chartHeight);
        gradient.addColorStop(0, gradientColors[index]?.[0] || "#2d9cdb");
        gradient.addColorStop(1, gradientColors[index]?.[1] || "rgba(45,156,219,0.22)");
        context.fillStyle = gradient;

        context.beginPath();
        context.moveTo(x + 8, y);
        context.lineTo(x + barWidth - 8, y);
        context.quadraticCurveTo(x + barWidth, y, x + barWidth, y + 8);
        context.lineTo(x + barWidth, y + normalizedHeight);
        context.lineTo(x, y + normalizedHeight);
        context.lineTo(x, y + 8);
        context.quadraticCurveTo(x, y, x + 8, y);
        context.closePath();
        context.fill();

        if (isHovered && visibleValue > 0) {
            context.strokeStyle = toTransparent(state.theme.textPrimary, 0.22);
            context.lineWidth = 2;
            context.stroke();
        }

        state.bars.push({ index, x, y, width: barWidth, height: normalizedHeight });
    });

    context.fillStyle = state.theme.textSecondary;
    context.font = '12px "Segoe UI", sans-serif';
    context.textAlign = "center";
    state.labels.forEach((label, index) => {
        const x = left + index * (barWidth + gap) + barWidth / 2;
        context.fillText(label, x, height - 12);
    });

    if (state.legendEnabled) {
        renderCanvasLegend(
            canvasElement,
            state.labels.map((label, index) => ({
                identifier: String(index),
                label,
                color: gradientColors[index]?.[0] || "#2d9cdb",
                isActive: (state.visibility[index] ?? 1) > 0.5
            })),
            toggledIdentifier => {
                const currentState = STATE_BY_CANVAS.get(canvasElement);
                if (!currentState) return;

                const targetIndex = Number(toggledIdentifier);
                if (!Number.isFinite(targetIndex)) return;
                const startVisibility = currentState.visibility[targetIndex] ?? 1;
                const endVisibility = startVisibility > 0.5 ? 0 : 1;

                animateValue({
                    animationKey: `bar-toggle:${canvasElement.id}:${targetIndex}`,
                    durationMs: 340,
                    onUpdate(progress) {
                        const liveState = STATE_BY_CANVAS.get(canvasElement);
                        if (!liveState) return;
                        liveState.visibility[targetIndex] =
                            startVisibility + (endVisibility - startVisibility) * progress;
                        drawBarChart(canvasElement);
                        hideCanvasTooltip(canvasElement);
                    }
                });
            }
        );
    } else {
        hideCanvasLegend(canvasElement);
    }
}

function getHoveredBarIndex(canvasElement: HTMLCanvasElement, x: number, y: number): number | null {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return null;

    for (let index = 0; index < state.bars.length; index += 1) {
        const bar = state.bars[index];
        if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
            if ((state.visibility[bar.index] ?? 1) > 0.05) return bar.index;
            return null;
        }
    }

    return null;
}

function bindBarChartHover(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state || state.initialized) return;
    state.initialized = true;

    canvasElement.addEventListener("mousemove", event => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;

        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hoverIndex = getHoveredBarIndex(canvasElement, x, y);

        currentState.hoverIndex = hoverIndex;
        drawBarChart(canvasElement);

        if (hoverIndex === null) {
            canvasElement.style.cursor = "default";
            hideCanvasTooltip(canvasElement);
            return;
        }

        canvasElement.style.cursor = "pointer";
        showCanvasTooltip(
            canvasElement,
            x + 14,
            y - 8,
            buildTooltipHtml(currentState.labels[hoverIndex] || "Item", [
                {
                    label: currentState.valueLabel,
                    value: Math.round((currentState.values[hoverIndex] ?? 0) * (currentState.visibility[hoverIndex] ?? 1)),
                    accentColor: "#2d9cdb"
                }
            ])
        );
    });

    canvasElement.addEventListener("mouseleave", () => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;
        currentState.hoverIndex = null;
        drawBarChart(canvasElement);
        canvasElement.style.cursor = "default";
        hideCanvasTooltip(canvasElement);
    });
}

export function renderBarChart(
    canvasElement: HTMLCanvasElement,
    labels: string[],
    values: number[],
    theme: ResolvedTheme,
    options?: {
        valueLabel?: string;
        enableLegend?: boolean;
    }
): void {
    const previousState = STATE_BY_CANVAS.get(canvasElement);

    const state: BarState = {
        labels,
        values,
        visibility: values.map((_, index) => previousState?.visibility[index] ?? 1),
        theme,
        progress: 0,
        hoverIndex: previousState?.hoverIndex ?? null,
        initialized: previousState?.initialized ?? false,
        bars: [],
        valueLabel: options?.valueLabel || "Value",
        legendEnabled: options?.enableLegend !== false
    };

    STATE_BY_CANVAS.set(canvasElement, state);
    bindBarChartHover(canvasElement);

    animateValue({
        animationKey: `bar:${canvasElement.id}`,
        durationMs: 820,
        onUpdate(progress) {
            const currentState = STATE_BY_CANVAS.get(canvasElement);
            if (!currentState) return;
            currentState.progress = progress;
            drawBarChart(canvasElement);
        }
    });
}
