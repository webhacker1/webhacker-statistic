export type ChartPrimitive = string | number;

export type DataPoint = {
    label: string;
    value: number;
};

export type DoughnutSlice = DataPoint & {
    color?: string;
};

export type LineSeries = {
    identifier: string;
    label: string;
    values: number[];
    color?: string;
};

export type ChartUiOptions = {
    enableLegend?: boolean;
    valueLabel?: string;
    shareLabel?: string;
    noDataLabel?: string;
};

export type LineChartInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    series: LineSeries[];
    options?: ChartUiOptions;
};

export type BarChartInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    values: number[];
    colors?: string[];
    options?: ChartUiOptions;
};

export type DoughnutChartInput = {
    canvasElement: HTMLCanvasElement;
    values: number[];
    labels?: string[];
    colors?: string[];
    cutoutRatio?: number;
    options?: ChartUiOptions;
};

export type RadarChartInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    values: number[];
    colors?: string[];
    options?: ChartUiOptions;
};

export type GenericChartsApi = {
    renderLineChart: (input: LineChartInput) => void;
    renderBarChart: (input: BarChartInput) => void;
    renderDoughnutChart: (input: DoughnutChartInput) => void;
    renderRadarChart: (input: RadarChartInput) => void;
    refresh: () => void;
    destroy: (canvasElement: HTMLCanvasElement) => void;
    destroyAll: () => void;
};
