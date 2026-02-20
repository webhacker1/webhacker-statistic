import type { ResolvedTheme } from "../core/themes";
import { toTransparent } from "../core/themes";
import { animateValue } from "../core/animation";
import { clearCanvas, resizeCanvas } from "../core/canvas";
import { buildTooltipHtml, hideCanvasTooltip, showCanvasTooltip } from "../core/tooltip";

type RadarPointMeta = {
    x: number;
    y: number;
    label: string;
    value: number;
    color: string;
};

type RadarState = {
    labels: string[];
    values: number[];
    colors: string[];
    theme: ResolvedTheme;
    progress: number;
    hoverIndex: number | null;
    initialized: boolean;
    points: RadarPointMeta[];
    valueLabel: string;
    noDataLabel: string;
};

const STATE_BY_CANVAS = new WeakMap<HTMLCanvasElement, RadarState>();

function drawRadarChart(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return;

    const resized = resizeCanvas(canvasElement, 280);
    if (!resized) return;
    const { context, width, height } = resized;
    clearCanvas(context, width, height, state.theme.panelBackground);

    const count = Math.max(state.labels.length, 3);
    const maximumRawValue = Math.max(...state.values, 0);
    const maximumValue = Math.max(maximumRawValue, 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.32;

    context.strokeStyle = state.theme.grid;
    context.lineWidth = 1;
    for (let ringIndex = 1; ringIndex <= 4; ringIndex += 1) {
        const ringRadius = (radius / 4) * ringIndex;
        context.beginPath();
        for (let pointIndex = 0; pointIndex < count; pointIndex += 1) {
            const angle = -Math.PI / 2 + (Math.PI * 2 * pointIndex) / count;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            if (pointIndex === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        context.stroke();
    }

    if (maximumRawValue <= 0) {
        context.fillStyle = toTransparent(state.theme.textSecondary, 0.8);
        context.font = '14px "Segoe UI", sans-serif';
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(state.noDataLabel, centerX, centerY);
        state.points = [];
        return;
    }

    context.beginPath();
    state.values.forEach((value, index) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / state.values.length;
        const distance = ((Math.max(0, value) / maximumValue) * radius) * state.progress;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = toTransparent(state.colors[0] || state.theme.lineJoin, 0.2);
    context.strokeStyle = state.colors[0] || state.theme.lineJoin;
    context.lineWidth = 2;
    context.fill();
    context.stroke();

    state.points = [];
    state.values.forEach((value, index) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / state.values.length;
        const distance = ((Math.max(0, value) / maximumValue) * radius) * state.progress;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const color = state.colors[index % state.colors.length] || state.theme.lineJoin;
        const isHovered = state.hoverIndex === index;

        context.beginPath();
        context.arc(x, y, isHovered ? 6.5 : 5, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();

        if (isHovered) {
            context.beginPath();
            context.arc(x, y, 10, 0, Math.PI * 2);
            context.strokeStyle = toTransparent(color, 0.4);
            context.lineWidth = 1.5;
            context.stroke();
        }

        state.points.push({
            x,
            y,
            label: state.labels[index] || `Item ${index + 1}`,
            value,
            color
        });
    });
}

function getHoveredPointIndex(canvasElement: HTMLCanvasElement, x: number, y: number): number | null {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state) return null;

    let bestIndex: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    state.points.forEach((point, index) => {
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 12 && distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
        }
    });

    return bestIndex;
}

function bindRadarHover(canvasElement: HTMLCanvasElement): void {
    const state = STATE_BY_CANVAS.get(canvasElement);
    if (!state || state.initialized) return;
    state.initialized = true;

    canvasElement.addEventListener("mousemove", event => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;

        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hoverIndex = getHoveredPointIndex(canvasElement, x, y);

        currentState.hoverIndex = hoverIndex;
        drawRadarChart(canvasElement);

        if (hoverIndex === null) {
            canvasElement.style.cursor = "default";
            hideCanvasTooltip(canvasElement);
            return;
        }

        const point = currentState.points[hoverIndex];
        canvasElement.style.cursor = "pointer";
        showCanvasTooltip(
            canvasElement,
            x + 12,
            y - 10,
            buildTooltipHtml(point.label, [
                {
                    label: currentState.valueLabel,
                    value: point.value,
                    accentColor: point.color
                }
            ])
        );
    });

    canvasElement.addEventListener("mouseleave", () => {
        const currentState = STATE_BY_CANVAS.get(canvasElement);
        if (!currentState) return;
        currentState.hoverIndex = null;
        drawRadarChart(canvasElement);
        canvasElement.style.cursor = "default";
        hideCanvasTooltip(canvasElement);
    });
}

export function renderRadarChart(
    canvasElement: HTMLCanvasElement,
    labels: string[],
    values: number[],
    colors: string[],
    theme: ResolvedTheme,
    options?: {
        valueLabel?: string;
        noDataLabel?: string;
    }
): void {
    const previousState = STATE_BY_CANVAS.get(canvasElement);

    const state: RadarState = {
        labels,
        values,
        colors,
        theme,
        progress: 0,
        hoverIndex: previousState?.hoverIndex ?? null,
        initialized: previousState?.initialized ?? false,
        points: [],
        valueLabel: options?.valueLabel || "Value",
        noDataLabel: options?.noDataLabel || "No data"
    };

    STATE_BY_CANVAS.set(canvasElement, state);
    bindRadarHover(canvasElement);

    animateValue({
        animationKey: `radar:${canvasElement.id}`,
        durationMs: 760,
        onUpdate(progress) {
            const currentState = STATE_BY_CANVAS.get(canvasElement);
            if (!currentState) return;
            currentState.progress = progress;
            drawRadarChart(canvasElement);
        }
    });
}
