import { DEFAULT_THEME_VALUES, THEME_VARIABLES } from "./themeVariables";

export type ResolvedTheme = {
    panelBackground: string;
    panelBorder: string;
    textPrimary: string;
    textSecondary: string;
    lineJoin: string;
    lineLeave: string;
    success: string;
    danger: string;
    grid: string;
    doughnutHoleBackground: string;
    palette: string[];
};

function readCssVariable(variableName: string, fallbackValue: string): string {
    const rawValue = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return rawValue || fallbackValue;
}

export function toTransparent(color: string, alpha = 0.2): string {
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

export function resolveTheme(): ResolvedTheme {
    return {
        panelBackground: readCssVariable(
            THEME_VARIABLES.panelBackground,
            DEFAULT_THEME_VALUES.panelBackground
        ),
        panelBorder: readCssVariable(THEME_VARIABLES.panelBorder, DEFAULT_THEME_VALUES.panelBorder),
        textPrimary: readCssVariable(THEME_VARIABLES.textPrimary, DEFAULT_THEME_VALUES.textPrimary),
        textSecondary: readCssVariable(THEME_VARIABLES.textSecondary, DEFAULT_THEME_VALUES.textSecondary),
        lineJoin: readCssVariable(THEME_VARIABLES.lineJoin, DEFAULT_THEME_VALUES.lineJoin),
        lineLeave: readCssVariable(THEME_VARIABLES.lineLeave, DEFAULT_THEME_VALUES.lineLeave),
        success: readCssVariable(THEME_VARIABLES.success, DEFAULT_THEME_VALUES.success),
        danger: readCssVariable(THEME_VARIABLES.danger, DEFAULT_THEME_VALUES.danger),
        grid: readCssVariable(THEME_VARIABLES.grid, DEFAULT_THEME_VALUES.grid),
        doughnutHoleBackground: readCssVariable(
            THEME_VARIABLES.doughnutHoleBackground,
            DEFAULT_THEME_VALUES.doughnutHoleBackground
        ),
        palette: [
            "#4caf50",
            "#2196f3",
            "#ff9800",
            "#9c27b0",
            "#ffc107",
            "#00bcd4",
            "#6a5acd",
            "#ff5722",
            "#2ecc71",
            "#e91e63"
        ]
    };
}
