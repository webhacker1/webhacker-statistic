import { DEFAULT_PALETTE } from "../defaults";
import { roundedRect, lerp } from "../geometry";
import type { ResolvedTheme } from "../utils";
import { datasetColor, toRgba } from "../utils";
import { drawAxesLabels, drawGrid, scaleValues, valueToY } from "./layout";
import type { BarPoint, DrawCommonArgs, HoverTarget, PlotArea, TooltipPayload } from "./runtimeTypes";

export function drawBarStatistic(
    args: DrawCommonArgs & {
        theme: ResolvedTheme;
        hoverTarget: HoverTarget;
        area: PlotArea;
    }
): BarPoint[] {
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

    const baseY = valueToY(0, min, max, area);
    const groupWidth = area.width / labels.length;
    const categoryPadding = groupWidth * 0.16;
    const innerWidth = Math.max(8, groupWidth - categoryPadding * 2);
    const barsCount = Math.max(1, visibleDatasets.length);
    const barWidth = innerWidth / barsCount;
    const barPoints: BarPoint[] = [];

    labels.forEach((_, pointIndex) => {
        visibleDatasets.forEach(({ dataset, datasetIndex }, visibleDatasetIndex) => {
            const value = dataset.data[pointIndex] ?? 0;
            const targetY = valueToY(value, min, max, area);
            const yTop = Math.min(baseY, targetY);
            const yBottom = Math.max(baseY, targetY);
            const animatedTop = lerp(baseY, yTop, progress);
            const animatedBottom = lerp(baseY, yBottom, progress);
            const height = Math.max(1, animatedBottom - animatedTop);

            const x =
                area.left +
                groupWidth * pointIndex +
                categoryPadding +
                barWidth * visibleDatasetIndex +
                barWidth * 0.12;
            const width = Math.max(2, barWidth * 0.76);
            const color = datasetColor(
                dataset.backgroundColor,
                DEFAULT_PALETTE[visibleDatasetIndex % DEFAULT_PALETTE.length],
                pointIndex
            );

            const hovered =
                hoverTarget?.kind === "bar" &&
                hoverTarget.index === pointIndex &&
                hoverTarget.datasetIndex === datasetIndex;

            roundedRect(context, x, animatedTop, width, height, 7);
            context.fillStyle = color;
            context.fill();

            if (hovered) {
                context.strokeStyle = toRgba(color, 0.45);
                context.lineWidth = 2;
                context.stroke();
            }

            barPoints.push({
                datasetIndex,
                pointIndex,
                x,
                y: animatedTop,
                width,
                height,
                value,
                color
            });
        });
    });

    return barPoints;
}

export function hitTestBarStatistic(args: { x: number; y: number; barPoints: BarPoint[] }): HoverTarget {
    const { x, y, barPoints } = args;

    for (let index = barPoints.length - 1; index >= 0; index -= 1) {
        const bar = barPoints[index];
        const insideX = x >= bar.x && x <= bar.x + bar.width;
        const insideY = y >= bar.y && y <= bar.y + bar.height;

        if (insideX && insideY) {
            return {
                kind: "bar",
                index: bar.pointIndex,
                datasetIndex: bar.datasetIndex
            };
        }
    }

    return null;
}

export function buildBarTooltip(args: {
    config: DrawCommonArgs["config"];
    hiddenDatasets: ReadonlySet<number>;
    pointIndex: number;
    formatValue: (value: number) => string;
}): TooltipPayload {
    const { config, hiddenDatasets, pointIndex, formatValue } = args;
    const title = config.data.labels[pointIndex] ?? `Item ${pointIndex + 1}`;

    const rows = config.data.datasets
        .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
        .filter(({ datasetIndex }) => !hiddenDatasets.has(datasetIndex))
        .map(({ dataset, datasetIndex }, visibleIndex) => ({
            label: dataset.label ?? `Dataset ${datasetIndex + 1}`,
            value: formatValue(dataset.data[pointIndex] ?? 0),
            color: datasetColor(dataset.backgroundColor, DEFAULT_PALETTE[visibleIndex % DEFAULT_PALETTE.length], pointIndex)
        }));

    return { title, rows };
}
