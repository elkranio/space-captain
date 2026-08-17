// Shared Evade runtime vocabulary for any ship.
//
// Cooldown recovery is independent from the active maneuver phase so the full
// cooldown can begin at commitment and continue through WARMUP / EVADING.
export const SHIP_EVADE_PHASE = {
    READY: 'ready',
    WARMUP: 'warmup',
    EVADING: 'evading',
    COOLDOWN: 'cooldown',
} as const;

export type ShipEvadePhase =
    (typeof SHIP_EVADE_PHASE)[keyof typeof SHIP_EVADE_PHASE];

export type ShipEvadeState = {
    phase: ShipEvadePhase;
    phaseElapsedMs: number;

    // Raw encounter/world-time recovery clock.
    cooldownRemainingMs: number;
};
