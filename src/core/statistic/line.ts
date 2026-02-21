import { DEFAULT_PALETTE } from "../defaults";
import { buildSmoothPath, clamp, lerp } from "../geometry";
import type { ResolvedTheme } from "../utils";
import { datasetColor, toRgba } from "../utils";
import { drawAxesLabels, drawGrid, scaleValues, valueToY } from "./layout";
import type { DrawCommonArgs, HoverTarget, LinePoint, PlotArea, TooltipPayload } from "./runtimeTypes";

export function drawLineStatistic(
    args: DrawCommonArgs & {
        theme: ResolvedTheme;
        hoverTarget: HoverTarget;
        area: PlotArea;
    }
): LinePoint[][] {
    const { context, config, hiddenDatasets, progress, theme, hoverTarget, area, formatValue, drawEmptyState } = args;
    const labels = config.data.labels;
    const datasets = config.data.datasets;
    const visibleDatasets = datasets
        .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
        .filter(({ datasetIndex }) => !hiddenDatasets.has(datasetIndex));

    drawGrid(context, area, theme.grid);

    const allValues = visibleDatasets.flatMap(({ dataset }) => dataset.data);
    if (allValues.length === 0 || labels.length === 0) {
        drawAxesLabels({
            context,
            area,
            valuesMin: 0,
            valuesMax: 1,
            labels,
            color: theme.textMuted,
            formatValue
        });
        drawEmptyState(theme.textMuted, "No data");
        return [];
    }

    const beginAtZero = config.options?.scales?.y?.beginAtZero ?? true;
    const { min, max } = scaleValues(allValues, beginAtZero);

    drawAxesLabels({
        context,
        area,
        valuesMin: min,
        valuesMax: max,
        labels,
        color: theme.textMuted,
        formatValue
    });

    const hoverIndex = hoverTarget?.kind === "line" ? hoverTarget.index : null;
    const stepX = labels.length === 1 ? 0 : area.width / (labels.length - 1);
    const linePoints: LinePoint[][] = [];

    visibleDatasets.forEach(({ dataset, datasetIndex }, visibleIndex) => {
        const stroke = dataset.borderColor ?? DEFAULT_PALETTE[visibleIndex % DEFAULT_PALETTE.length];
        const fill = datasetColor(dataset.backgroundColor, toRgba(stroke, 0.18));
        const points: LinePoint[] = [];

        for (let pointIndex = 0; pointIndex < labels.length; pointIndex += 1) {
            const value = dataset.data[pointIndex] ?? 0;
            const x = labels.length === 1 ? area.left + area.width / 2 : area.left + stepX * pointIndex;
            const targetY = valueToY(value, min, max, area);
            const y = lerp(area.bottom, targetY, progress);

            points.push({
                datasetIndex,
                pointIndex,
                x,
                y,
                value,
                color: stroke
            });
        }

        context.beginPath();
        buildSmoothPath(context, points, dataset.tension ?? 0.35);

        if (dataset.fill) {
            context.lineTo(points[points.length - 1].x, area.bottom);
            context.lineTo(points[0].x, area.bottom);
            context.closePath();
            context.fillStyle = fill;
            context.fill();

            context.beginPath();
            buildSmoothPath(context, points, dataset.tension ?? 0.35);
        }

        context.strokeStyle = stroke;
        context.lineWidth = dataset.borderWidth ?? 2;
        context.stroke();

        const pointRadius = dataset.pointRadius ?? 3;
        points.forEach(point => {
            const hovered = hoverIndex === point.pointIndex;
            context.beginPath();
            context.arc(point.x, point.y, hovered ? pointRadius + 2 : pointRadius, 0, Math.PI * 2);
            context.fillStyle = stroke;
            context.fill();

            if (hovered) {
                context.beginPath();
                context.arc(point.x, point.y, pointRadius + 5, 0, Math.PI * 2);
                context.strokeStyle = toRgba(stroke, 0.35);
                context.lineWidth = 1.5;
                context.stroke();
            }
        });

        linePoints.push(points);
    });

    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < labels.length) {
        const x = labels.length === 1 ? area.left + area.width / 2 : area.left + stepX * hoverIndex;
        context.setLineDash([4, 4]);
        context.strokeStyle = toRgba(theme.textMuted, 0.45);
        context.beginPath();
        context.moveTo(x, area.top);
        context.lineTo(x, area.bottom);
        context.stroke();
        context.setLineDash([]);
    }

    return linePoints;
}

export function hitTestLineStatistic(args: {
    x: number;
    y: number;
    area: PlotArea;
    labels: string[];
}): HoverTarget {
    const { x, y, area, labels } = args;

    if (x < area.left - 8 || x > area.right + 8 || y < area.top - 8 || y > area.bottom + 8) {
        return null;
    }

    if (labels.length === 0) return null;
    const stepX = labels.length === 1 ? 0 : area.width / (labels.length - 1);
    const index = labels.length === 1 ? 0 : Math.round((x - area.left) / Math.max(1, stepX));

    return {
        kind: "line",
        index: clamp(index, 0, labels.length - 1)
    };
}

export function buildLineTooltip(args: {
    config: DrawCommonArgs["config"];
    hiddenDatasets: ReadonlySet<number>;
    hoverIndex: number;
    formatValue: (value: number) => string;
}): TooltipPayload {
    const { config, hiddenDatasets, hoverIndex, formatValue } = args;
    const title = config.data.labels[hoverIndex] ?? `Point ${hoverIndex + 1}`;

    const rows = config.data.datasets
        .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
        .filter(({ datasetIndex }) => !hiddenDatasets.has(datasetIndex))
        .map(({ dataset, datasetIndex }, visibleIndex) => ({
            label: dataset.label ?? `Dataset ${datasetIndex + 1}`,
            value: formatValue(dataset.data[hoverIndex] ?? 0),
            color: dataset.borderColor ?? DEFAULT_PALETTE[visibleIndex % DEFAULT_PALETTE.length]
        }));

    return { title, rows };
}
