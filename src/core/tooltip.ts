const TOOLTIP_ELEMENT_BY_CANVAS = new WeakMap<HTMLCanvasElement, HTMLDivElement>();

export type TooltipRow = {
    label: string;
    value: string | number;
    accentColor?: string;
};

function ensureTooltipElement(canvasElement: HTMLCanvasElement): HTMLDivElement | null {
    const existingTooltipElement = TOOLTIP_ELEMENT_BY_CANVAS.get(canvasElement);
    if (existingTooltipElement) return existingTooltipElement;

    const parentElement = canvasElement.parentElement;
    if (!parentElement) return null;
    if (getComputedStyle(parentElement).position === "static") {
        parentElement.style.position = "relative";
    }

    const tooltipElement = document.createElement("div");
    tooltipElement.className = "statistics-tooltip";
    tooltipElement.style.opacity = "0";
    parentElement.appendChild(tooltipElement);
    TOOLTIP_ELEMENT_BY_CANVAS.set(canvasElement, tooltipElement);
    return tooltipElement;
}

function escapeHtml(rawValue: unknown): string {
    return String(rawValue)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function buildTooltipHtml(tooltipTitle: string, tooltipRows: TooltipRow[]): string {
    const rowsHtml = tooltipRows
        .map(tooltipRow => {
            const accentDotHtml = tooltipRow.accentColor
                ? `<i class="statistics-tooltip__dot" style="--statistics-tooltip-dot-color: ${escapeHtml(tooltipRow.accentColor)}"></i>`
                : "";

            return `
                <div class="statistics-tooltip__row">
                    <span>${accentDotHtml}${escapeHtml(tooltipRow.label)}</span>
                    <strong>${escapeHtml(tooltipRow.value)}</strong>
                </div>
            `;
        })
        .join("");

    return `
        <div class="statistics-tooltip__title">${escapeHtml(tooltipTitle)}</div>
        ${rowsHtml}
    `;
}

export function showCanvasTooltip(
    canvasElement: HTMLCanvasElement,
    x: number,
    y: number,
    htmlContent: string
): void {
    const tooltipElement = ensureTooltipElement(canvasElement);
    if (!tooltipElement) return;

    tooltipElement.innerHTML = htmlContent;
    const parentElement = canvasElement.parentElement;
    const maxWidth = parentElement ? parentElement.clientWidth : 0;
    const clampedX = maxWidth ? Math.max(10, Math.min(x, maxWidth - 10)) : x;
    tooltipElement.style.left = `${clampedX}px`;
    tooltipElement.style.top = `${Math.max(10, y)}px`;
    tooltipElement.style.opacity = "1";
}

export function hideCanvasTooltip(canvasElement: HTMLCanvasElement): void {
    const tooltipElement = TOOLTIP_ELEMENT_BY_CANVAS.get(canvasElement);
    if (!tooltipElement) return;
    tooltipElement.style.opacity = "0";
}
