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

const MIN_SIDE_CLEARANCE_PX = 48;
const WIDTH_CLEARANCE_FACTOR = 0.25;
const VIEWPORT_EXTENSION_FACTOR = 2;

// Builds a presentation-only Beam fly-by for an Evade MISS.
//
// Enemy Evade shifts only the rendered ship, while the canonical object
// position stays where the shot was aimed. We use that relative X shift only
// to choose the miss side, then force the Beam through a point clearly outside
// the presented ship bounds. The line continues far beyond that pass point so
// the Beam visibly exits the viewport instead of terminating near the target.
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
    const targetWidth =
        Math.max(
            0,
            presentedTargetRight -
                presentedTargetLeft,
        );

    const sideClearance =
        Math.max(
            MIN_SIDE_CLEARANCE_PX,
            targetWidth *
                WIDTH_CLEARANCE_FACTOR,
        );

    // Presented ship moved right -> canonical aim is on its left -> miss left.
    // Equality is deterministic for the first Evade frame before visible drift.
    const missLeft =
        canonicalTargetX <=
        presentedTargetCenterX;

    const passX =
        missLeft
            ? presentedTargetLeft -
                sideClearance
            : presentedTargetRight +
                sideClearance;

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
