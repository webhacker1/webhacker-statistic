import type { ResolvedTheme } from "../core/themes";
import { animateValue } from "../core/animation";
import { clearCanvas, resizeCanvas } from "../core/canvas";
import { buildTooltipHtml, hideCanvasTooltip, showCanvasTooltip } from "../core/tooltip";
import { hideCanvasLegend, renderCanvasLegend } from "../core/legend";

type DoughnutState = {
    values: number[];
    colors: string[];
    labels: string[];
    visibility: number[];
    theme: ResolvedTheme;
    cutoutRatio: number;
    progress: number;
    hoverIndex: number | null;
    initialized: boolean;
    valueLabel: string;
    shareLabel: string;
    legendEnabled: boolean;
};

const STATE_BY_CANVAS = new WeakMap<HTMLCanvasElement, DoughnutState>();

function getVisibleValue(state: DoughnutState, index: number): number {
    return Math.max(0, (state.values[index] ?? 0) * (state.visibility[index] ?? 1));
}

function drawDoughnut(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return;

    const resized = resizeCanvas(canvasElement, 280);
    if (!resized) return;
    const { context, width, height } = resized;
    clearCanvas(context, width, height, state.theme.panelBackground);

    const total = state.values.reduce((sum, _, index) => sum + getVisibleValue(state, index), 0) || 1;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) * 0.36;
    const innerRadius = outerRadius * state.cutoutRatio;
    let startAngle = -Math.PI / 2;

    state.values.forEach((_, index) => {
        const safeValue = getVisibleValue(state, index);
        const fullSweep = (safeValue / total) * Math.PI * 2;
        const sweepAngle = fullSweep * state.progress;
        const endAngle = startAngle + sweepAngle;
        const isHovered = state.hoverIndex === index;
        const midAngle = startAngle + sweepAngle / 2;
        const offset = isHovered ? 8 : 0;
        const offsetX = Math.cos(midAngle) * offset;
        const offsetY = Math.sin(midAngle) * offset;

        if (safeValue > 0) {
            context.beginPath();
            context.arc(centerX + offsetX, centerY + offsetY, outerRadius, startAngle, endAngle);
            context.arc(
                centerX + offsetX,
                centerY + offsetY,
                innerRadius,
                endAngle,
                startAngle,
                true
            );
            context.closePath();
            context.fillStyle = state.colors[index] || "#cfd8e8";
            context.fill();
        }

        startAngle += fullSweep;
    });

    context.beginPath();
    context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context.fillStyle = state.theme.doughnutHoleBackground;
    context.fill();

    if (state.legendEnabled) {
        renderCanvasLegend(
            canvasElement,
            state.values.map((_, index) => ({
                identifier: String(index),
                label: state.labels[index] || `Item ${index + 1}`,
                color: state.colors[index] || "#cfd8e8",
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
                    animationKey: `doughnut-toggle:${canvasElement.id}:${targetIndex}`,
                    durationMs: 360,
                    onUpdate(progress) {
                        const liveState = STATE_BY_CANVAS.get(canvasElement);
                        if (!liveState) return;
                        liveState.visibility[targetIndex] =
                            startVisibility + (endVisibility - startVisibility) * progress;
                        drawDoughnut(canvasElement);
                        hideCanvasTooltip(canvasElement);
                    }
                });
            }
        );
    } else {
        hideCanvasLegend(canvasElement);
    }
}

function getHoveredDoughnutIndex(
    canvasElement: HTMLCanvasElement,
    pointerX: number,
    pointerY: number
): number | null {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return null;

    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) * 0.36;
    const innerRadius = outerRadius * state.cutoutRatio;
    const deltaX = pointerX - centerX;
    const deltaY = pointerY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < innerRadius || distance > outerRadius + 12) return null;

    let angle = Math.atan2(deltaY, deltaX) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    const total = state.values.reduce((sum, _, index) => sum + getVisibleValue(state, index), 0) || 1;
    let accumulator = 0;

    for (let index = 0; index < state.values.length; index += 1) {
        const sliceValue = getVisibleValue(state, index);
        accumulator += (sliceValue / total) * Math.PI * 2;
        if (angle <= accumulator && sliceValue > 0) return index;
    }

    return null;
}

function bindDoughnutHover(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state || state.initialized) return;
    state.initialized = true;

    canvasElement.addEventListener("mousemove", event => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;

        const rect = canvasElement.getBoundingClientRect();
        const relativeX = event.clientX - rect.left;
        const relativeY = event.clientY - rect.top;

        const hoverIndex = getHoveredDoughnutIndex(canvasElement, relativeX, relativeY);
        currentState.hoverIndex = hoverIndex;
        drawDoughnut(canvasElement);

        if (hoverIndex === null) {
            canvasElement.style.cursor = "default";
            hideCanvasTooltip(canvasElement);
            return;
        }

        canvasElement.style.cursor = "pointer";
        const value = getVisibleValue(currentState, hoverIndex);
        const total =
            currentState.values.reduce((sum, _, index) => sum + getVisibleValue(currentState, index), 0) ||
            1;
        const percent = ((value / total) * 100).toFixed(1);
        const label = currentState.labels[hoverIndex] || `Item ${hoverIndex + 1}`;

        showCanvasTooltip(
            canvasElement,
            relativeX + 12,
            relativeY - 8,
            buildTooltipHtml(label, [
                {
                    label: currentState.valueLabel,
                    value,
                    accentColor: currentState.colors[hoverIndex]
                },
                {
                    label: currentState.shareLabel,
                    value: `${percent}%`
                }
            ])
        );
    });

    canvasElement.addEventListener("mouseleave", () => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;
        currentState.hoverIndex = null;
        drawDoughnut(canvasElement);
        canvasElement.style.cursor = "default";
        hideCanvasTooltip(canvasElement);
    });
}

export function renderDoughnutChart(
    canvasElement: HTMLCanvasElement,
    values: number[],
    colors: string[],
    theme: ResolvedTheme,
    cutoutRatio = 0.56,
    labels: string[] = [],
    options?: {
        valueLabel?: string;
        shareLabel?: string;
        enableLegend?: boolean;
    }
): void {
    const previousState = STATE_BY_CANVAS.get(canvasElement);

    const state: DoughnutState = {
        values,
        colors,
        labels,
        visibility: values.map((_, index) => previousState?.visibility[index] ?? 1),
        theme,
        cutoutRatio,
        progress: 0,
        hoverIndex: previousState?.hoverIndex ?? null,
        initialized: previousState?.initialized ?? false,
        valueLabel: options?.valueLabel || "Value",
        shareLabel: options?.shareLabel || "Share",
        legendEnabled: options?.enableLegend !== false
    };

    STATE_BY_CANVAS.set(canvasElement, state);
    bindDoughnutHover(canvasElement);

    animateValue({
        animationKey: `doughnut:${canvasElement.id}`,
        durationMs: 900,
        onUpdate(progress) {
            const currentState = STATE_BY_CANVAS.get(canvasElement);
            if (!currentState) return;
            currentState.progress = progress;
            drawDoughnut(canvasElement);
        }
    });
}
