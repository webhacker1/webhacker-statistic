export type LegendItem = {
    id: string;
    label: string;
    color: string;
    active: boolean;
};

type LegendState = {
    root: HTMLDivElement;
    onToggle: (id: string) => void;
};

const LEGEND_BY_CANVAS = new WeakMap<HTMLCanvasElement, LegendState>();
const TOOLTIP_BY_CANVAS = new WeakMap<HTMLCanvasElement, HTMLDivElement>();

function escapeHtml(value: unknown): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function ensureLegend(canvas: HTMLCanvasElement): HTMLDivElement {
    const existing = LEGEND_BY_CANVAS.get(canvas);
    const host =
        (canvas.closest(".wh-card") as HTMLElement | null) ||
        (canvas.closest(".card") as HTMLElement | null) ||
        canvas.parentElement ||
        canvas;

    if (existing) {
        if (existing.root.parentElement !== host) {
            host.appendChild(existing.root);
        }
        return existing.root;
    }

    const root = document.createElement("div");
    root.className = "wh-stat-legend";
    host.appendChild(root);

    const state: LegendState = {
        root,
        onToggle: () => {}
    };

    root.addEventListener("click", event => {
        const button = (event.target as HTMLElement | null)?.closest(".wh-stat-legend__item") as
            | HTMLButtonElement
            | null;
        if (!button) return;
        state.onToggle(button.dataset.legendId ?? "");
    });

    LEGEND_BY_CANVAS.set(canvas, state);
    return root;
}

export function renderLegend(
    canvas: HTMLCanvasElement,
    items: LegendItem[],
    onToggle: (id: string) => void,
    visible: boolean
): void {
    const root = ensureLegend(canvas);
    const state = LEGEND_BY_CANVAS.get(canvas);
    if (!state) return;

    state.onToggle = onToggle;
    root.style.display = visible ? "flex" : "none";

    if (!visible) {
        root.innerHTML = "";
        return;
    }

    root.innerHTML = items
        .map(
            item => `
                <button
                    type="button"
                    class="wh-stat-legend__item${item.active ? "" : " wh-stat-legend__item--inactive"}"
                    data-legend-id="${escapeHtml(item.id)}"
                    title="${escapeHtml(item.label)}"
                >
                    <span class="wh-stat-legend__dot" style="--wh-stat-legend-dot: ${escapeHtml(item.color)}"></span>
                    <span>${escapeHtml(item.label)}</span>
                </button>
            `
        )
        .join("");
}

export function ensureTooltip(canvas: HTMLCanvasElement): HTMLDivElement {
    const existing = TOOLTIP_BY_CANVAS.get(canvas);
    if (existing) return existing;

    const parent = canvas.parentElement ?? canvas;
    if (parent instanceof HTMLElement && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
    }

    const tooltip = document.createElement("div");
    tooltip.className = "wh-stat-tooltip";
    tooltip.style.opacity = "0";
    parent.appendChild(tooltip);
    TOOLTIP_BY_CANVAS.set(canvas, tooltip);
    return tooltip;
}

export function showTooltip(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    title: string,
    rows: Array<{ label: string; value: string; color?: string }>
): void {
    const tooltip = ensureTooltip(canvas);

    const rowsHtml = rows
        .map(row => {
            const dot = row.color
                ? `<span class="wh-stat-tooltip__dot" style="--wh-stat-tooltip-dot:${escapeHtml(row.color)}"></span>`
                : "";

            return `
                <div class="wh-stat-tooltip__row">
                    <span>${dot}${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.value)}</strong>
                </div>
            `;
        })
        .join("");

    tooltip.innerHTML = `
        <div class="wh-stat-tooltip__title">${escapeHtml(title)}</div>
        ${rowsHtml}
    `;

    const parentWidth = canvas.parentElement?.clientWidth ?? canvas.clientWidth;
    const safeX = Math.max(12, Math.min(x, parentWidth - 12));

    tooltip.style.left = `${safeX}px`;
    tooltip.style.top = `${Math.max(12, y)}px`;
    tooltip.style.opacity = "1";
}

export function hideTooltip(canvas: HTMLCanvasElement): void {
    const tooltip = TOOLTIP_BY_CANVAS.get(canvas);
    if (!tooltip) return;
    tooltip.style.opacity = "0";
}

export function destroyDom(canvas: HTMLCanvasElement): void {
    const legend = LEGEND_BY_CANVAS.get(canvas);
    if (legend) {
        legend.root.remove();
        LEGEND_BY_CANVAS.delete(canvas);
    }

    const tooltip = TOOLTIP_BY_CANVAS.get(canvas);
    if (tooltip) {
        tooltip.remove();
        TOOLTIP_BY_CANVAS.delete(canvas);
    }
}
