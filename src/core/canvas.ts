export type CanvasSize = {
    width: number;
    height: number;
    context: CanvasRenderingContext2D;
};

export function resizeCanvas(canvasElement: HTMLCanvasElement, minimalHeight = 280): CanvasSize | null {
    const drawingContext = canvasElement.getContext("2d");
    if (!drawingContext) return null;

    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(280, Math.floor(canvasElement.clientWidth));
    const height = Math.max(minimalHeight, Math.floor(canvasElement.clientHeight));

    canvasElement.width = Math.floor(width * pixelRatio);
    canvasElement.height = Math.floor(height * pixelRatio);
    drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    return {
        width,
        height,
        context: drawingContext
    };
}

export function clearCanvas(
    drawingContext: CanvasRenderingContext2D,
    width: number,
    height: number,
    fillColor: string
): void {
    drawingContext.clearRect(0, 0, width, height);
    drawingContext.fillStyle = fillColor;
    drawingContext.fillRect(0, 0, width, height);
}
