export type LegendItem = {
    identifier: string;
    label: string;
    color: string;
    isActive: boolean;
};

type LegendState = {
    legendElement: HTMLDivElement;
    onToggle: (identifier: string) => void;
};

const LEGEND_BY_CANVAS = new WeakMap<HTMLCanvasElement, LegendState>();

function escapeHtml(rawValue: unknown): string {
    return String(rawValue)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function resolveLegendHostElement(canvasElement: HTMLCanvasElement): HTMLElement | null {
    const canvasWrapElement = canvasElement.parentElement;
    if (!canvasWrapElement) return null;
    const cardElement = canvasWrapElement.closest(".card");
    return (cardElement as HTMLElement | null) || (canvasWrapElement as HTMLElement);
}

function ensureLegendElement(canvasElement: HTMLCanvasElement): HTMLDivElement | null {
    const existingState = LEGEND_BY_CANVAS.get(canvasElement);
    if (existingState) return existingState.legendElement;

    const hostElement = resolveLegendHostElement(canvasElement);
    if (!hostElement) return null;

    const legendElement = document.createElement("div");
    legendElement.className = "statistics-legend";
    hostElement.appendChild(legendElement);

    const state: LegendState = {
        legendElement,
        onToggle: () => {}
    };

    legendElement.addEventListener("click", event => {
        const buttonElement = (event.target as HTMLElement | null)?.closest(
            ".statistics-legend__item"
        ) as HTMLButtonElement | null;
        if (!buttonElement) return;
        state.onToggle(buttonElement.dataset.identifier || "");
    });

    LEGEND_BY_CANVAS.set(canvasElement, state);
    return legendElement;
}

export function renderCanvasLegend(
    canvasElement: HTMLCanvasElement,
    legendItems: LegendItem[],
    onToggle: (identifier: string) => void
): void {
    const legendElement = ensureLegendElement(canvasElement);
    if (!legendElement) return;

    const legendState = LEGEND_BY_CANVAS.get(canvasElement);
    if (!legendState) return;

    legendState.onToggle = onToggle;
    legendElement.innerHTML = legendItems
        .map(
            legendItem => `
                <button
                    type="button"
                    class="statistics-legend__item${legendItem.isActive ? "" : " statistics-legend__item--inactive"}"
                    data-identifier="${escapeHtml(legendItem.identifier)}"
                    title="${escapeHtml(legendItem.label)}"
                >
                    <i class="statistics-legend__dot" style="--statistics-legend-dot-color: ${escapeHtml(legendItem.color)}"></i>
                    <span>${escapeHtml(legendItem.label)}</span>
                </button>
            `
        )
        .join("");
}

export function hideCanvasLegend(canvasElement: HTMLCanvasElement): void {
    const legendState = LEGEND_BY_CANVAS.get(canvasElement);
    if (!legendState) return;
    legendState.legendElement.innerHTML = "";
}
