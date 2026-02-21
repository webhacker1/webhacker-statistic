import { DEFAULT_PALETTE } from "../defaults";
import { distance } from "../geometry";
import type { ResolvedTheme } from "../utils";
import { datasetColor, toRgba } from "../utils";
import type { DrawCommonArgs, HoverTarget, RadarPoint, TooltipPayload } from "./runtimeTypes";

export function drawRadarStatistic(
    args: DrawCommonArgs & {
        theme: ResolvedTheme;
        hoverTarget: HoverTarget;
    }
): RadarPoint[] {
    const { context, config, canvasWidth, canvasHeight, hiddenDatasets, progress, theme, hoverTarget, drawEmptyState } = args;
    const labels = config.data.labels;
    const datasets = config.data.datasets
        .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
        .filter(({ datasetIndex }) => !hiddenDatasets.has(datasetIndex));

    if (labels.length < 3 || datasets.length === 0) {
        drawEmptyState(theme.textMuted, "No data");
        return [];
    }

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.34;
    const ringCount = 5;

    const allValues = datasets.flatMap(({ dataset }) => dataset.data);
    const max = Math.max(1, ...allValues.map(value => Math.max(0, value)));

    context.strokeStyle = theme.grid;
    context.lineWidth = 1;

    for (let ring = 1; ring <= ringCount; ring += 1) {
        const ringRadius = (radius / ringCount) * ring;
        context.beginPath();
        for (let index = 0; index < labels.length; index += 1) {
            const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        context.stroke();
    }

    for (let index = 0; index < labels.length; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = centerX + cos * (radius + 16);
        const y = centerY + sin * (radius + 16);
        const xOffset = cos > 0.3 ? 6 : cos < -0.3 ? -6 : 0;
        const yOffset = sin > 0.3 ? 3 : sin < -0.3 ? -3 : 0;

        context.fillStyle = theme.textMuted;
        context.font = '12px "Segoe UI", sans-serif';
        context.textAlign = cos > 0.3 ? "left" : cos < -0.3 ? "right" : "center";
        context.textBaseline = sin > 0.3 ? "top" : sin < -0.3 ? "bottom" : "middle";
        context.fillText(labels[index] ?? `Item ${index + 1}`, x + xOffset, y + yOffset);

        context.strokeStyle = theme.grid;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        context.stroke();
    }

    const radarPoints: RadarPoint[] = [];

    datasets.forEach(({ dataset, datasetIndex }, visibleDatasetIndex) => {
        const border = dataset.borderColor ?? DEFAULT_PALETTE[visibleDatasetIndex % DEFAULT_PALETTE.length];
        const fill = datasetColor(dataset.backgroundColor, toRgba(border, 0.16));
        const points: RadarPoint[] = [];

        for (let index = 0; index < labels.length; index += 1) {
            const value = Math.max(0, dataset.data[index] ?? 0);
            const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
            const dist = (value / max) * radius * progress;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;

            points.push({
                datasetIndex,
                pointIndex: index,
                x,
                y,
                value,
                color: border
            });
        }

        context.beginPath();
        points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.fillStyle = fill;
        context.fill();

        context.strokeStyle = border;
        context.lineWidth = dataset.borderWidth ?? 2;
        context.stroke();

        points.forEach(point => {
            const hovered =
                hoverTarget?.kind === "radar" &&
                hoverTarget.index === point.pointIndex &&
                hoverTarget.datasetIndex === point.datasetIndex;

            context.beginPath();
            context.arc(point.x, point.y, hovered ? 6 : 4.5, 0, Math.PI * 2);
            context.fillStyle = border;
            context.fill();

            if (hovered) {
                context.beginPath();
                context.arc(point.x, point.y, 9, 0, Math.PI * 2);
                context.strokeStyle = toRgba(border, 0.32);
                context.lineWidth = 1.5;
                context.stroke();
            }
        });

        radarPoints.push(...points);
    });

    return radarPoints;
}

export function hitTestRadarStatistic(args: { x: number; y: number; radarPoints: RadarPoint[] }): HoverTarget {
    const { x, y, radarPoints } = args;

    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPoint: RadarPoint | null = null;

    for (let index = 0; index < radarPoints.length; index += 1) {
        const point = radarPoints[index];
        const currentDistance = distance({ x, y }, { x: point.x, y: point.y });
        if (currentDistance < bestDistance && currentDistance <= 14) {
            bestDistance = currentDistance;
            bestPoint = point;
        }
    }

    if (!bestPoint) return null;
    return {
        kind: "radar",
        index: bestPoint.pointIndex,
        datasetIndex: bestPoint.datasetIndex
    };
}

export function buildRadarTooltip(args: {
    config: DrawCommonArgs["config"];
    index: number;
    datasetIndex: number;
    formatValue: (value: number) => string;
}): TooltipPayload {
    const { config, index, datasetIndex, formatValue } = args;
    const dataset = config.data.datasets[datasetIndex];
    const color = dataset?.borderColor ?? DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length];

    return {
        title: config.data.labels[index] ?? `Point ${index + 1}`,
        rows: [
            {
                label: dataset?.label ?? `Dataset ${datasetIndex + 1}`,
                value: formatValue(dataset?.data[index] ?? 0),
                color
            }
        ]
    };
}
