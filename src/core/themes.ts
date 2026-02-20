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

function readCssVariable(variableName: string, fallbackValue: string, themeSourceElement: Element): string {
    const rawValue = getComputedStyle(themeSourceElement).getPropertyValue(variableName).trim();
    return rawValue || fallbackValue;
}

function readCssVariables(variableNames: string[], fallbackValue: string, themeSourceElement: Element): string {
    for (let index = 0; index < variableNames.length; index += 1) {
        const variableName = variableNames[index];
        const rawValue = getComputedStyle(themeSourceElement).getPropertyValue(variableName).trim();
        if (rawValue) return rawValue;
    }
    return fallbackValue;
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

export function resolveTheme(themeSourceElement?: Element): ResolvedTheme {
    const sourceElement =
        themeSourceElement || document.body || document.documentElement;

    const panelBackground = readCssVariables(
        [THEME_VARIABLES.panelBackground, "--background-color", "--surface-color"],
        DEFAULT_THEME_VALUES.panelBackground,
        sourceElement
    );

    return {
        panelBackground,
        panelBorder: readCssVariables(
            [THEME_VARIABLES.panelBorder, "--border-color"],
            DEFAULT_THEME_VALUES.panelBorder,
            sourceElement
        ),
        textPrimary: readCssVariables(
            [THEME_VARIABLES.textPrimary, "--text-color", "--color-text"],
            DEFAULT_THEME_VALUES.textPrimary,
            sourceElement
        ),
        textSecondary: readCssVariables(
            [THEME_VARIABLES.textSecondary, "--muted-text-color", "--color-text-secondary"],
            DEFAULT_THEME_VALUES.textSecondary,
            sourceElement
        ),
        lineJoin: readCssVariable(
            THEME_VARIABLES.lineJoin,
            DEFAULT_THEME_VALUES.lineJoin,
            sourceElement
        ),
        lineLeave: readCssVariable(
            THEME_VARIABLES.lineLeave,
            DEFAULT_THEME_VALUES.lineLeave,
            sourceElement
        ),
        success: readCssVariable(THEME_VARIABLES.success, DEFAULT_THEME_VALUES.success, sourceElement),
        danger: readCssVariable(THEME_VARIABLES.danger, DEFAULT_THEME_VALUES.danger, sourceElement),
        grid: readCssVariable(THEME_VARIABLES.grid, DEFAULT_THEME_VALUES.grid, sourceElement),
        doughnutHoleBackground: readCssVariables(
            [THEME_VARIABLES.doughnutHoleBackground, "--background-color", "--surface-color"],
            panelBackground,
            sourceElement
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
