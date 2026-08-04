// src/engine/defs/point_defense.ts

// Legacy player-ship charge state.
// The player point-defense lifecycle still lives in encounter combat state.
// Enemy ships use ShipPointDefenseState below.
export type PointDefenseState = {
    charges: number;
    maxCharges: number;
};

export const POINT_DEFENSE_BEAM_BAND = {
    RED: 'red',
    BLUE: 'blue',
} as const;

export type PointDefenseBeamBand =
    (typeof POINT_DEFENSE_BEAM_BAND)[keyof typeof POINT_DEFENSE_BEAM_BAND];

export const POINT_DEFENSE_SHOT_OUTCOME = {
    HIT: 'hit',
    MISS: 'miss',
} as const;

export type PointDefenseShotOutcome =
    (typeof POINT_DEFENSE_SHOT_OUTCOME)[keyof typeof POINT_DEFENSE_SHOT_OUTCOME];

export const POINT_DEFENSE_ID = {
    BASIC_00: 'point_defense_basic_00',
} as const;

export type PointDefenseId =
    (typeof POINT_DEFENSE_ID)[keyof typeof POINT_DEFENSE_ID];

export type PointDefenseDefinition = {
    id: PointDefenseId;
    name: string;

    maxCharges: number;

    loadDurationMs: number;
    cooldownDurationMs: number;
};

export const POINT_DEFENSE_PHASE = {
    READY: 'ready',
    LOADING: 'loading',
    COOLDOWN: 'cooldown',
} as const;

export type PointDefensePhase =
    (typeof POINT_DEFENSE_PHASE)[keyof typeof POINT_DEFENSE_PHASE];

// One shared operator-occupation query for installed point defense.
// Loading requires Weapons; ready and cooldown do not.
export function doesPointDefensePhaseRequireOperator(
    phase: PointDefensePhase,
): boolean {
    switch (phase) {
        case POINT_DEFENSE_PHASE.LOADING:
            return true;

        case POINT_DEFENSE_PHASE.READY:
        case POINT_DEFENSE_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never =
                phase;

            return exhaustivePhase;
        }
    }
}

// Central timing policy for installed point defense.
//
// Kept separate from occupation so future physical phases can remain
// world-time without silently changing crew ownership.
export function doesPointDefensePhaseAdvanceWithCrew(
    phase: PointDefensePhase,
): boolean {
    switch (phase) {
        case POINT_DEFENSE_PHASE.LOADING:
            return true;

        case POINT_DEFENSE_PHASE.READY:
        case POINT_DEFENSE_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never =
                phase;

            return exhaustivePhase;
        }
    }
}

// Mutable state of one installed ship point-defense system.
//
// loadedBand and targetProjectileId remain null outside an active load.
// A later runner atom will own those phase invariants.
export type ShipPointDefenseState = {
    // Runtime id of this installation on a concrete ship.
    id: string;

    // Stable immutable content definition.
    pointDefenseId: PointDefenseId;

    charges: number;
    maxCharges: number;

    phase: PointDefensePhase;
    phaseElapsedMs: number;

    loadedBand: PointDefenseBeamBand | null;
    targetProjectileId: string | null;
};
