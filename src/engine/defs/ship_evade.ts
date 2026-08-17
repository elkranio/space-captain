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

export type ShipEvadeTiming = {
    evadeWarmupMs: number;
    evadeDurationMs: number;
    evadeCooldownMs: number;
};

export function createReadyShipEvadeState():
    ShipEvadeState {
    return {
        phase:
            SHIP_EVADE_PHASE.READY,
        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
    };
}

export function startShipEvade(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
): void {
    validateShipEvadeTiming(
        timing,
    );

    if (
        state.phase !==
        SHIP_EVADE_PHASE.READY
    ) {
        throw new Error(
            'Ship Evade is not ready: ' +
                state.phase,
        );
    }

    state.cooldownRemainingMs =
        timing.evadeCooldownMs;

    state.phaseElapsedMs = 0;
    state.phase =
        timing.evadeWarmupMs > 0
            ? SHIP_EVADE_PHASE.WARMUP
            : SHIP_EVADE_PHASE.EVADING;
}

// Advances both clocks from raw encounter/world time.
//
// The recovery clock consumes the full delta exactly once, even when that same
// delta crosses WARMUP -> EVADING -> COOLDOWN/READY.
export function advanceShipEvade(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
    deltaMs: number,
): void {
    validateShipEvadeTiming(
        timing,
    );
    validateDeltaMs(
        deltaMs,
    );

    if (
        state.phase ===
        SHIP_EVADE_PHASE.READY
    ) {
        return;
    }

    state.cooldownRemainingMs =
        Math.max(
            0,
            state.cooldownRemainingMs -
                deltaMs,
        );

    switch (state.phase) {
        case SHIP_EVADE_PHASE.WARMUP:
            advanceWarmup(
                state,
                timing,
                deltaMs,
            );
            return;

        case SHIP_EVADE_PHASE.EVADING:
            advanceActiveEvade(
                state,
                timing,
                deltaMs,
            );
            return;

        case SHIP_EVADE_PHASE.COOLDOWN:
            syncCooldownPhase(
                state,
                timing,
            );
            return;

        default: {
            const exhaustivePhase: never =
                state.phase;

            return exhaustivePhase;
        }
    }
}

// Ends an in-progress maneuver because of player cancellation or interruption.
// Committed cooldown is preserved; if recovery already completed while the
// maneuver was active, the ship becomes READY immediately.
export function stopShipEvade(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
): boolean {
    validateShipEvadeTiming(
        timing,
    );

    if (
        state.phase !==
            SHIP_EVADE_PHASE.WARMUP &&
        state.phase !==
            SHIP_EVADE_PHASE.EVADING
    ) {
        return false;
    }

    settleAfterActiveAction(
        state,
        timing,
    );

    return true;
}

export function isShipEvading(
    state: ShipEvadeState,
): boolean {
    return (
        state.phase ===
        SHIP_EVADE_PHASE.EVADING
    );
}

function advanceWarmup(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
    deltaMs: number,
): void {
    const totalElapsedMs =
        state.phaseElapsedMs +
        deltaMs;

    if (
        totalElapsedMs <
        timing.evadeWarmupMs
    ) {
        state.phaseElapsedMs =
            totalElapsedMs;
        return;
    }

    const activeDeltaMs =
        totalElapsedMs -
        timing.evadeWarmupMs;

    state.phase =
        SHIP_EVADE_PHASE.EVADING;
    state.phaseElapsedMs = 0;

    advanceActiveEvade(
        state,
        timing,
        activeDeltaMs,
    );
}

function advanceActiveEvade(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
    deltaMs: number,
): void {
    const totalElapsedMs =
        state.phaseElapsedMs +
        deltaMs;

    if (
        totalElapsedMs <
        timing.evadeDurationMs
    ) {
        state.phaseElapsedMs =
            totalElapsedMs;
        return;
    }

    settleAfterActiveAction(
        state,
        timing,
    );
}

function settleAfterActiveAction(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
): void {
    if (
        state.cooldownRemainingMs <= 0
    ) {
        setShipEvadeReady(
            state,
        );
        return;
    }

    state.phase =
        SHIP_EVADE_PHASE.COOLDOWN;

    state.phaseElapsedMs =
        getCooldownElapsedMs(
            state,
            timing,
        );
}

function syncCooldownPhase(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
): void {
    if (
        state.cooldownRemainingMs <= 0
    ) {
        setShipEvadeReady(
            state,
        );
        return;
    }

    state.phaseElapsedMs =
        getCooldownElapsedMs(
            state,
            timing,
        );
}

function getCooldownElapsedMs(
    state: ShipEvadeState,
    timing: ShipEvadeTiming,
): number {
    return Math.max(
        0,
        Math.min(
            timing.evadeCooldownMs,
            timing.evadeCooldownMs -
                state.cooldownRemainingMs,
        ),
    );
}

function setShipEvadeReady(
    state: ShipEvadeState,
): void {
    state.phase =
        SHIP_EVADE_PHASE.READY;
    state.phaseElapsedMs = 0;
    state.cooldownRemainingMs = 0;
}

function validateShipEvadeTiming(
    timing: ShipEvadeTiming,
): void {
    validateNonNegativeDuration(
        'warmup',
        timing.evadeWarmupMs,
    );

    validatePositiveDuration(
        'active duration',
        timing.evadeDurationMs,
    );

    validateNonNegativeDuration(
        'cooldown',
        timing.evadeCooldownMs,
    );
}

function validateDeltaMs(
    deltaMs: number,
): void {
    validateNonNegativeDuration(
        'delta',
        deltaMs,
    );
}

function validateNonNegativeDuration(
    label: string,
    value: number,
): void {
    if (
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(
            'Ship Evade ' +
                label +
                ' must be non-negative: ' +
                String(value),
        );
    }
}

function validatePositiveDuration(
    label: string,
    value: number,
): void {
    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new Error(
            'Ship Evade ' +
                label +
                ' must be positive: ' +
                String(value),
        );
    }
}
