// src/app/scenes/game/bridge/view/combat/outgoing_spam/bridge_outgoing_spam_geometry.ts

export type BeamPoint = {
    x: number;
    y: number;
};

export type TaperedBeamPolygon = readonly [BeamPoint, BeamPoint, BeamPoint, BeamPoint];

// Creates a four-point beam whose width is measured perpendicular
// to the source-target direction.
//
// Point order is clockwise:
// source upper -> target upper -> target lower -> source lower.
export function createTaperedBeamPolygon(
    source: BeamPoint,
    target: BeamPoint,
    sourceHalfWidth: number,
    targetHalfWidth: number,
): TaperedBeamPolygon {
    const dx = target.x - source.x;

    const dy = target.y - source.y;

    const length = Math.hypot(dx, dy);

    if (length <= 0) {
        throw new Error("Cannot create a tapered beam " + "between identical points");
    }

    const normalX = -dy / length;

    const normalY = dx / length;

    return [
        {
            x: source.x - normalX * sourceHalfWidth,

            y: source.y - normalY * sourceHalfWidth,
        },
        {
            x: target.x - normalX * targetHalfWidth,

            y: target.y - normalY * targetHalfWidth,
        },
        {
            x: target.x + normalX * targetHalfWidth,

            y: target.y + normalY * targetHalfWidth,
        },
        {
            x: source.x + normalX * sourceHalfWidth,

            y: source.y + normalY * sourceHalfWidth,
        },
    ];
}
