export type Point = {
    x: number;
    y: number;
};

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, amount: number): number {
    return start + (end - start) * amount;
}

export function easeOutCubic(progress: number): number {
    return 1 - Math.pow(1 - progress, 3);
}

export function distance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius = 8
): void {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height);
    context.lineTo(x, y + height);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
}

export function buildSmoothPath(context: CanvasRenderingContext2D, points: Point[], tension: number): void {
    if (points.length === 0) return;

    context.moveTo(points[0].x, points[0].y);
    if (points.length === 1) return;

    const smoothness = clamp(tension, 0, 1);

    for (let index = 0; index < points.length - 1; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        const previous = points[index - 1] ?? current;
        const afterNext = points[index + 2] ?? next;

        const cp1x = current.x + ((next.x - previous.x) / 6) * smoothness;
        const cp1y = current.y + ((next.y - previous.y) / 6) * smoothness;
        const cp2x = next.x - ((afterNext.x - current.x) / 6) * smoothness;
        const cp2y = next.y - ((afterNext.y - current.y) / 6) * smoothness;

        context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
}
