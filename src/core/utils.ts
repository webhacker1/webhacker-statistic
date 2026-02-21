import { FALLBACK_THEME, THEME } from "./defaults";

export type ResolvedTheme = {
    background: string;
    grid: string;
    textPrimary: string;
    textMuted: string;
    tooltipBackground: string;
    tooltipBorder: string;
};

export function deepClone<T>(value: T): T {
    return structuredClone(value);
}

export function cssColor(source: Element, variable: string | string[], fallback: string): string {
    const variables = Array.isArray(variable) ? variable : [variable];
    const styles = getComputedStyle(source);

    for (let index = 0; index < variables.length; index += 1) {
        const value = styles.getPropertyValue(variables[index]).trim();
        if (value) return value;
    }

    return fallback;
}

export function resolveTheme(source: Element): ResolvedTheme {
    return {
        background: cssColor(source, THEME.background, FALLBACK_THEME.background),
        grid: cssColor(source, THEME.grid, FALLBACK_THEME.grid),
        textPrimary: cssColor(source, THEME.textPrimary, FALLBACK_THEME.textPrimary),
        textMuted: cssColor(source, THEME.textMuted, FALLBACK_THEME.textMuted),
        tooltipBackground: cssColor(source, THEME.tooltipBackground, FALLBACK_THEME.tooltipBackground),
        tooltipBorder: cssColor(source, THEME.tooltipBorder, FALLBACK_THEME.tooltipBorder)
    };
}

export function toRgba(color: string, alpha: number): string {
    if (color.startsWith("#") && color.length === 7) {
        const red = Number.parseInt(color.slice(1, 3), 16);
        const green = Number.parseInt(color.slice(3, 5), 16);
        const blue = Number.parseInt(color.slice(5, 7), 16);
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }

    return color;
}

export function datasetColor(
    datasetColorValue: string | string[] | undefined,
    fallback: string,
    index = 0
): string {
    if (Array.isArray(datasetColorValue)) {
        return datasetColorValue[index] ?? fallback;
    }

    if (typeof datasetColorValue === "string") {
        return datasetColorValue;
    }

    return fallback;
}

export function asPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}
