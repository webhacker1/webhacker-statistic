export type StatisticType = "line" | "bar" | "doughnut" | "radar";

export type StatisticContext = HTMLCanvasElement | CanvasRenderingContext2D;

export type StatisticDataset = {
    label?: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    borderWidth?: number;
    pointRadius?: number;
    tension?: number;
    fill?: boolean;
    hidden?: boolean;
};

export type StatisticData = {
    labels: string[];
    datasets: StatisticDataset[];
};

export type AnimationOptions = {
    duration?: number;
};

export type LegendOptions = {
    display?: boolean;
};

export type TooltipOptions = {
    enabled?: boolean;
    valueFormatter?: (value: number) => string;
};

export type StatisticOptions = {
    responsive?: boolean;
    animation?: AnimationOptions;
    cutout?: string | number;
    scales?: {
        y?: {
            beginAtZero?: boolean;
        };
    };
    plugins?: {
        legend?: LegendOptions;
        tooltip?: TooltipOptions;
    };
};

export type StatisticConfig = {
    type: StatisticType;
    data: StatisticData;
    options?: StatisticOptions;
};

export type StatisticInstanceLike = {
    update: (nextConfig?: StatisticConfig) => void;
    resize: () => void;
    destroy: () => void;
    getConfig: () => StatisticConfig;
};

export type StatisticConstructor = new (context: StatisticContext, config: StatisticConfig) => StatisticInstanceLike;

export type LineSeries = {
    identifier: string;
    label: string;
    values: number[];
    color?: string;
};

export type StatisticUiOptions = {
    enableLegend?: boolean;
    valueLabel?: string;
    shareLabel?: string;
    noDataLabel?: string;
};

export type LineStatisticInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    series: LineSeries[];
    options?: StatisticUiOptions;
};

export type BarStatisticInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    values: number[];
    colors?: string[];
    options?: StatisticUiOptions;
};

export type DoughnutStatisticInput = {
    canvasElement: HTMLCanvasElement;
    values: number[];
    labels?: string[];
    colors?: string[];
    cutoutRatio?: number;
    options?: StatisticUiOptions;
};

export type RadarStatisticInput = {
    canvasElement: HTMLCanvasElement;
    labels: string[];
    values: number[];
    colors?: string[];
    options?: StatisticUiOptions;
};

export type WebHackerStatisticsApi = {
    Statistic: StatisticConstructor;
    renderLine: (input: LineStatisticInput) => void;
    renderBar: (input: BarStatisticInput) => void;
    renderDoughnut: (input: DoughnutStatisticInput) => void;
    renderRadar: (input: RadarStatisticInput) => void;
    refresh: () => void;
    destroy: (canvasElement: HTMLCanvasElement) => void;
    destroyAll: () => void;
};
