import type { PlotArea } from "./runtimeTypes";

export function createPlotArea(canvasWidth: number, canvasHeight: number): PlotArea {
    const left = 56;
    const right = 18;
    const top = 20;
    const bottom = canvasHeight - 42;

    return {
        left,
        right: canvasWidth - right,
        top,
        bottom,
        width: canvasWidth - left - right,
        height: bottom - top
    };
}

export function drawGrid(context: CanvasRenderingContext2D, area: PlotArea, gridColor: string): void {
    context.strokeStyle = gridColor;
    context.lineWidth = 1;

    for (let line = 0; line <= 5; line += 1) {
        const y = area.top + (area.height / 5) * line;
        context.beginPath();
        context.moveTo(area.left, y);
        context.lineTo(area.right, y);
        context.stroke();
    }
}

export function drawAxesLabels(args: {
    context: CanvasRenderingContext2D;
    area: PlotArea;
    valuesMin: number;
    valuesMax: number;
    labels: string[];
    color: string;
    formatValue: (value: number) => string;
}): void {
    const { context, area, valuesMin, valuesMax, labels, color, formatValue } = args;

    context.fillStyle = color;
    context.font = '12px "Segoe UI", sans-serif';
    context.textAlign = "right";
    context.textBaseline = "middle";

    const stepValue = (valuesMax - valuesMin) / 5;
    for (let line = 0; line <= 5; line += 1) {
        const y = area.bottom - (area.height / 5) * line;
        const value = valuesMin + stepValue * line;
        context.fillText(formatValue(value), area.left - 8, y);
    }

    if (labels.length === 0) return;

    context.textAlign = "center";
    context.textBaseline = "top";

    const maxVisibleLabels = Math.max(2, Math.floor(area.width / 70));
    const step = Math.max(1, Math.ceil(labels.length / maxVisibleLabels));

    labels.forEach((label, index) => {
        const isLast = index === labels.length - 1;
        if (index % step !== 0 && !isLast) return;

        const x = labels.length === 1 ? area.left + area.width / 2 : area.left + (area.width / (labels.length - 1)) * index;
        context.fillText(label, x, area.bottom + 8);
    });
}

export function scaleValues(values: number[], beginAtZero: boolean): { min: number; max: number } {
    if (values.length === 0) {
        return { min: 0, max: 1 };
    }

    let min = Math.min(...values);
    let max = Math.max(...values);

    if (beginAtZero) {
        min = Math.min(0, min);
        max = Math.max(0, max);
    }

    if (min === max) {
        max = min + 1;
    }

    return { min, max };
}

export function valueToY(value: number, min: number, max: number, area: PlotArea): number {
    const ratio = (value - min) / (max - min);
    return area.bottom - ratio * area.height;
}
