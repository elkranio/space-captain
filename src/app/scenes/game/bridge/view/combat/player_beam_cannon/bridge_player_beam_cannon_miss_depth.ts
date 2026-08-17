// Presentation-only side/depth rule for player Beam misses caused by enemy Evade.
//
// The Beam keeps the canonical target point. Enemy Evade moves only the
// rendered ship. If the old target point is now left of the presented ship,
// the Beam passes behind it; if it is right (or exactly equal), it stays in
// front. The choice is made once when the short Beam VFX is created.
export function shouldRenderPlayerBeamMissBehindTarget(
    canonicalTargetX: number,
    presentedTargetCenterX: number,
): boolean {
    return (
        canonicalTargetX <
        presentedTargetCenterX
    );
}
