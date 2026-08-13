// src/engine/defs/defense_turret.ts

import {
    MISSILE_SIGNATURE,
    type MissileSignature,
} from './missile';

// Transitional targeting domain.
// Atom 02 removes signature selection from the turret completely.
export const DEFENSE_TURRET_SIGNATURE =
    MISSILE_SIGNATURE;

export type DefenseTurretSignature =
    MissileSignature;

export const DEFENSE_TURRET_SHOT_OUTCOME = {
    HIT: 'hit',
    MISS: 'miss',
} as const;

export type DefenseTurretShotOutcome =
    (typeof DEFENSE_TURRET_SHOT_OUTCOME)[keyof typeof DEFENSE_TURRET_SHOT_OUTCOME];

// Удобный стабильный id встроенной Defense Turret.
// Каталог открыт для новых module ids из content editor.
export const DEFENSE_TURRET_ID = {
    BASIC_00:
        'defense_turret_basic_00',
} as const;

export type DefenseTurretId =
    string;

export type DefenseTurretDefinition = {
    id: DefenseTurretId;
    name: string;

    loadDurationMs: number;
    cooldownDurationMs: number;
};

export const DEFENSE_TURRET_PHASE = {
    READY: 'ready',
    LOADING: 'loading',
    COOLDOWN: 'cooldown',
} as const;

export type DefenseTurretPhase =
    (typeof DEFENSE_TURRET_PHASE)[keyof typeof DEFENSE_TURRET_PHASE];

// One shared operator-occupation query for installed defense turret.
// Loading requires Weapons; ready and cooldown do not.
export function doesDefenseTurretPhaseRequireOperator(
    phase: DefenseTurretPhase,
): boolean {
    switch (phase) {
        case DEFENSE_TURRET_PHASE.LOADING:
            return true;

        case DEFENSE_TURRET_PHASE.READY:
        case DEFENSE_TURRET_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never =
                phase;

            return exhaustivePhase;
        }
    }
}

// Central timing policy for installed defense turret.
//
// Kept separate from occupation so future physical phases can remain
// world-time without silently changing crew ownership.
export function doesDefenseTurretPhaseAdvanceWithCrew(
    phase: DefenseTurretPhase,
): boolean {
    switch (phase) {
        case DEFENSE_TURRET_PHASE.LOADING:
            return true;

        case DEFENSE_TURRET_PHASE.READY:
        case DEFENSE_TURRET_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never =
                phase;

            return exhaustivePhase;
        }
    }
}

// Mutable state of one installed ship defense turret.
//
// loadedSignature and targetProjectileId remain null outside an active load.
// The runner owns those phase invariants.
export type ShipDefenseTurretState = {
    // Runtime id конкретной установки.
    id: string;

    // Stable immutable content definition.
    defenseTurretId:
        DefenseTurretId;

    phase: DefenseTurretPhase;
    phaseElapsedMs: number;

    loadedSignature: DefenseTurretSignature | null;
    targetProjectileId: string | null;
};
