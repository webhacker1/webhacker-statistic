const ACTIVE_ANIMATIONS = new Map<string, number>();

export function animateValue({
    animationKey,
    durationMs = 700,
    onUpdate
}: {
    animationKey: string;
    durationMs?: number;
    onUpdate: (progress: number) => void;
}): void {
    const existingAnimationFrame = ACTIVE_ANIMATIONS.get(animationKey);
    if (typeof existingAnimationFrame === "number") {
        cancelAnimationFrame(existingAnimationFrame);
        ACTIVE_ANIMATIONS.delete(animationKey);
    }

    const startedAt = performance.now();

    const step = (now: number) => {
        const elapsedMs = now - startedAt;
        const progress = Math.min(elapsedMs / durationMs, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        onUpdate(easedProgress);

        if (progress < 1) {
            const frameId = requestAnimationFrame(step);
            ACTIVE_ANIMATIONS.set(animationKey, frameId);
            return;
        }

        ACTIVE_ANIMATIONS.delete(animationKey);
    };

    const frameId = requestAnimationFrame(step);
    ACTIVE_ANIMATIONS.set(animationKey, frameId);
}
