import { DEFAULT_PALETTE } from "../defaults";
import { clamp } from "../geometry";
import type { ResolvedTheme } from "../utils";
import { datasetColor } from "../utils";
import type { DoughnutSlice, DrawCommonArgs, HoverTarget, TooltipPayload } from "./runtimeTypes";

export function resolveCutoutRatio(value: string | number | undefined, outerRadius: number): number {
    if (typeof value === "string" && value.endsWith("%")) {
        const percent = Number.parseFloat(value.slice(0, -1));
        if (Number.isFinite(percent)) {
            return clamp(percent / 100, 0, 0.92);
        }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        if (value <= 1) {
            return clamp(value, 0, 0.92);
        }
        return clamp(value / outerRadius, 0, 0.92);
    }

    return 0.58;
}

export function drawDoughnutStatistic(
    args: DrawCommonArgs & {
        theme: ResolvedTheme;
        hoverTarget: HoverTarget;
    }
): DoughnutSlice[] {
    const { context, config, canvasWidth, canvasHeight, hiddenSlices, progress, theme, hoverTarget, drawEmptyState } = args;
    const dataset = config.data.datasets[0];

    if (!dataset || dataset.data.length === 0) {
        drawEmptyState(theme.textMuted, "No data");
        return [];
    }

    const values = dataset.data;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const outerRadius = Math.min(canvasWidth, canvasHeight) * 0.36;
    const cutoutRatio = resolveCutoutRatio(config.options?.cutout, outerRadius);
    const innerRadius = outerRadius * cutoutRatio;

    const total = values.reduce((sum, value, index) => {
        if (hiddenSlices.has(index)) return sum;
        return sum + Math.max(0, value);
    }, 0);

    if (total <= 0) {
        drawEmptyState(theme.textMuted, "No data");
        return [];
    }

    let start = -Math.PI / 2;
    const slices: DoughnutSlice[] = [];

    values.forEach((value, index) => {
        const safeValue = Math.max(0, value);
        if (safeValue <= 0 || hiddenSlices.has(index)) return;

        const fullAngle = (safeValue / total) * Math.PI * 2;
        const animatedAngle = fullAngle * progress;
        const hovered = hoverTarget?.kind === "doughnut" && hoverTarget.index === index;
        const color = datasetColor(dataset.backgroundColor, DEFAULT_PALETTE[index % DEFAULT_PALETTE.length], index);
        const middle = start + fullAngle / 2;
        const offset = hovered ? 10 : 0;
        const offsetX = Math.cos(middle) * offset;
        const offsetY = Math.sin(middle) * offset;

        context.beginPath();
        context.arc(centerX + offsetX, centerY + offsetY, outerRadius, start, start + animatedAngle);
        context.arc(centerX + offsetX, centerY + offsetY, innerRadius, start + animatedAngle, start, true);
        context.closePath();
        context.fillStyle = color;
        context.fill();

        slices.push({
            index,
            start,
            end: start + fullAngle,
            value: safeValue,
            color
        });

        start += fullAngle;
    });

    context.beginPath();
    context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context.fillStyle = theme.background;
    context.fill();

    return slices;
}

export function hitTestDoughnutStatistic(args: {
    x: number;
    y: number;
    canvasWidth: number;
    canvasHeight: number;
    cutout: string | number | undefined;
    slices: DoughnutSlice[];
}): HoverTarget {
    const { x, y, canvasWidth, canvasHeight, cutout, slices } = args;
    if (slices.length === 0) return null;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const outerRadius = Math.min(canvasWidth, canvasHeight) * 0.36;
    const cutoutRatio = resolveCutoutRatio(cutout, outerRadius);
    const innerRadius = outerRadius * cutoutRatio;

    const dx = x - centerX;
    const dy = y - centerY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < innerRadius || length > outerRadius + 10) {
        return null;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) {
        angle += Math.PI * 2;
    }

    for (let index = 0; index < slices.length; index += 1) {
        const slice = slices[index];
        if (angle >= slice.start && angle <= slice.end) {
            return {
                kind: "doughnut",
                index: slice.index
            };
        }
    }

    return null;
}

export function buildDoughnutTooltip(args: {
    config: DrawCommonArgs["config"];
    hiddenSlices: ReadonlySet<number>;
    index: number;
    formatValue: (value: number) => string;
}): TooltipPayload {
    const { config, hiddenSlices, index, formatValue } = args;
    const dataset = config.data.datasets[0];
    const labels = config.data.labels;
    const value = dataset?.data[index] ?? 0;

    const visibleTotal = (dataset?.data ?? []).reduce((sum, item, itemIndex) => {
        if (hiddenSlices.has(itemIndex)) return sum;
        return sum + Math.max(0, item);
    }, 0);

    const share = visibleTotal > 0 ? (Math.max(0, value) / visibleTotal) * 100 : 0;
    const color = datasetColor(dataset?.backgroundColor, DEFAULT_PALETTE[index % DEFAULT_PALETTE.length], index);

    return {
        title: labels[index] ?? `Slice ${index + 1}`,
        rows: [
            { label: "Value", value: formatValue(value), color },
            { label: "Share", value: `${share.toFixed(1)}%` }
        ]
    };
}
