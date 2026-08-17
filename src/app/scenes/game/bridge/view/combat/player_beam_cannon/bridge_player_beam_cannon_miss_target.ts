export type PlayerBeamCannonMissTargetOptions = {
    sourceX: number;
    sourceY: number;

    // Engine/presentation object position before the Evade render offset.
    canonicalTargetX: number;

    presentedTargetLeft: number;
    presentedTargetRight: number;
    presentedTargetCenterX: number;
    presentedTargetCenterY: number;

    viewportWidth: number;
    viewportHeight: number;
};

export type PlayerBeamCannonMissTarget = {
    x: number;
    y: number;
};

const VIEWPORT_EXTENSION_FACTOR = 2;

export function isPlayerBeamCannonMissLeft(
    canonicalTargetX: number,
    presentedTargetCenterX: number,
): boolean {
    // Presented ship moved right -> canonical aim is now on its left.
    // Equality keeps the first barely-visible Evade frame deterministic.
    return (
        canonicalTargetX <=
        presentedTargetCenterX
    );
}

// Builds a presentation-only Beam fly-by for an Evade MISS.
//
// Keep the shot close enough to the target that it still reads as a real aim:
// the line passes through the presented ship's left/right bounds lane, then
// continues far beyond the viewport instead of terminating near the target.
export function getPlayerBeamCannonMissTarget({
    sourceX,
    sourceY,

    canonicalTargetX,

    presentedTargetLeft,
    presentedTargetRight,
    presentedTargetCenterX,
    presentedTargetCenterY,

    viewportWidth,
    viewportHeight,
}: PlayerBeamCannonMissTargetOptions):
    PlayerBeamCannonMissTarget {
    const missLeft =
        isPlayerBeamCannonMissLeft(
            canonicalTargetX,
            presentedTargetCenterX,
        );

    const passX =
        missLeft
            ? presentedTargetLeft
            : presentedTargetRight;

    const passY =
        presentedTargetCenterY;

    const directionX =
        passX - sourceX;

    const directionY =
        passY - sourceY;

    const directionLength =
        Math.hypot(
            directionX,
            directionY,
        );

    if (
        directionLength <=
        Number.EPSILON
    ) {
        throw new Error(
            'Player Beam Cannon miss direction must have non-zero length',
        );
    }

    const viewportDiagonal =
        Math.hypot(
            viewportWidth,
            viewportHeight,
        );

    const targetDistance =
        directionLength +
        viewportDiagonal *
            VIEWPORT_EXTENSION_FACTOR;

    const scale =
        targetDistance /
        directionLength;

    return {
        x:
            sourceX +
            directionX *
                scale,

        y:
            sourceY +
            directionY *
                scale,
    };
}
