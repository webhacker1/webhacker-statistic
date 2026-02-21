import type { StatisticConfig } from "../types";

export type PlotArea = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

export type LinePoint = {
    datasetIndex: number;
    pointIndex: number;
    x: number;
    y: number;
    value: number;
    color: string;
};

export type BarPoint = {
    datasetIndex: number;
    pointIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    value: number;
    color: string;
};

export type DoughnutSlice = {
    index: number;
    start: number;
    end: number;
    value: number;
    color: string;
};

export type RadarPoint = {
    datasetIndex: number;
    pointIndex: number;
    x: number;
    y: number;
    value: number;
    color: string;
};

export type HoverTarget =
    | { kind: "line"; index: number }
    | { kind: "bar"; index: number; datasetIndex: number }
    | { kind: "doughnut"; index: number }
    | { kind: "radar"; index: number; datasetIndex: number }
    | null;

export type TooltipPayload = {
    title: string;
    rows: Array<{ label: string; value: string; color?: string }>;
};

export type DrawCommonArgs = {
    context: CanvasRenderingContext2D;
    config: StatisticConfig;
    canvasWidth: number;
    canvasHeight: number;
    hiddenDatasets: ReadonlySet<number>;
    hiddenSlices: ReadonlySet<number>;
    progress: number;
    formatValue: (value: number) => string;
    drawEmptyState: (color: string, message: string) => void;
};
