// Общая presentation-математика player/enemy shield.
//
// View-specific lifecycle, position, scale и количество shield visuals
// намеренно остаются в конкретных view-классах.
export const BRIDGE_SHIELD_PRESENTATION = {
    baseAlpha: 0.55,
    blinkDimAlpha: 0.12,

    blinkWindowMs: 1000,
    blinkIntervalMs: 125,

    absorbFadeMs: 160,
} as const;

export function getBridgeShieldAlpha(remainingMs: number): number {
    const clampedRemainingMs = Math.max(0, remainingMs);

    if (clampedRemainingMs > BRIDGE_SHIELD_PRESENTATION.blinkWindowMs) {
        return BRIDGE_SHIELD_PRESENTATION.baseAlpha;
    }

    const elapsedBlinkMs = BRIDGE_SHIELD_PRESENTATION.blinkWindowMs - clampedRemainingMs;

    const phase = Math.floor(elapsedBlinkMs / BRIDGE_SHIELD_PRESENTATION.blinkIntervalMs);

    return phase % 2 === 0 ? BRIDGE_SHIELD_PRESENTATION.baseAlpha : BRIDGE_SHIELD_PRESENTATION.blinkDimAlpha;
}

export function getBridgeShieldAbsorbFadeAlpha(elapsedMs: number): number {
    const progress = Math.max(0, Math.min(1, elapsedMs / BRIDGE_SHIELD_PRESENTATION.absorbFadeMs));

    return 1 - progress;
}
