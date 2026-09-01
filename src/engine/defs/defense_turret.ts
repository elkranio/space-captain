// src/engine/defs/defense_turret.ts

import { SHIP_SLOT_KIND } from "./ship_slot";

export const DEFENSE_TURRET_SHOT_OUTCOME = {
    HIT: "hit",
    MISS: "miss",
} as const;

export type DefenseTurretShotOutcome = (typeof DEFENSE_TURRET_SHOT_OUTCOME)[keyof typeof DEFENSE_TURRET_SHOT_OUTCOME];

// Удобный стабильный id встроенной Defense Turret.
// Каталог открыт для новых module ids из content editor.
export const DEFENSE_TURRET_ID = {
    BASIC_00: "defense_turret_basic_00",
} as const;

export type DefenseTurretDefinition = {
    id: string;
    name: string;
    shortName: string;

    slotKind: typeof SHIP_SLOT_KIND.DEFENSE;
    maxIntegrity: number;

    loadDurationMs: number;
    cooldownDurationMs: number;
};

export const DEFENSE_TURRET_PHASE = {
    READY: "ready",
    LOADING: "loading",
    COOLDOWN: "cooldown",
} as const;

export type DefenseTurretPhase = (typeof DEFENSE_TURRET_PHASE)[keyof typeof DEFENSE_TURRET_PHASE];

// One shared operator-occupation query for installed defense turret.
// Loading requires Weapons; ready and cooldown do not.
export function doesDefenseTurretPhaseRequireOperator(phase: DefenseTurretPhase): boolean {
    switch (phase) {
        case DEFENSE_TURRET_PHASE.LOADING:
            return true;

        case DEFENSE_TURRET_PHASE.READY:
        case DEFENSE_TURRET_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never = phase;

            return exhaustivePhase;
        }
    }
}

// Central timing policy for installed defense turret.
//
// Kept separate from occupation so future physical phases can remain
// world-time without silently changing crew ownership.
export function doesDefenseTurretPhaseAdvanceWithCrew(phase: DefenseTurretPhase): boolean {
    switch (phase) {
        case DEFENSE_TURRET_PHASE.LOADING:
            return true;

        case DEFENSE_TURRET_PHASE.READY:
        case DEFENSE_TURRET_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never = phase;

            return exhaustivePhase;
        }
    }
}

// Mutable state of one installed ship defense turret.
// targetProjectileId is non-null only during enemy LOADING.
export type ShipDefenseTurretState = {
    // Runtime id конкретной установки.
    id: string;

    // Stable immutable content definition.
    defenseTurretId: string;

    phase: DefenseTurretPhase;
    phaseElapsedMs: number;

    // Independent world-time recovery clock. Enemy LOADING may overlap it.
    cooldownRemainingMs: number;

    targetProjectileId: string | null;
};

export function commitDefenseTurretCooldown(defenseTurret: ShipDefenseTurretState, cooldownDurationMs: number): void {
    validateDefenseTurretCooldownDuration(cooldownDurationMs);

    if (defenseTurret.cooldownRemainingMs > 0) {
        throw new Error(
            "Defense Turret cooldown is already committed: " +
                defenseTurret.id +
                "/" +
                String(defenseTurret.cooldownRemainingMs),
        );
    }

    defenseTurret.cooldownRemainingMs = cooldownDurationMs;
}

export function advanceDefenseTurretCooldown(
    defenseTurret: ShipDefenseTurretState,
    cooldownDurationMs: number,
    deltaMs: number,
): void {
    validateDefenseTurretCooldownDuration(cooldownDurationMs);

    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
        throw new Error(
            "Defense Turret cooldown delta must be non-negative: " + defenseTurret.id + "/" + String(deltaMs),
        );
    }

    defenseTurret.cooldownRemainingMs = Math.max(0, defenseTurret.cooldownRemainingMs - deltaMs);

    if (defenseTurret.phase !== DEFENSE_TURRET_PHASE.COOLDOWN) {
        return;
    }

    if (defenseTurret.cooldownRemainingMs === 0) {
        setDefenseTurretReady(defenseTurret);
        return;
    }

    defenseTurret.phaseElapsedMs = Math.max(0, cooldownDurationMs - defenseTurret.cooldownRemainingMs);
}

export function finishDefenseTurretAction(defenseTurret: ShipDefenseTurretState, cooldownDurationMs: number): void {
    validateDefenseTurretCooldownDuration(cooldownDurationMs);

    defenseTurret.targetProjectileId = null;

    if (defenseTurret.cooldownRemainingMs > 0) {
        defenseTurret.phase = DEFENSE_TURRET_PHASE.COOLDOWN;

        defenseTurret.phaseElapsedMs = Math.max(0, cooldownDurationMs - defenseTurret.cooldownRemainingMs);

        return;
    }

    setDefenseTurretReady(defenseTurret);
}

function setDefenseTurretReady(defenseTurret: ShipDefenseTurretState): void {
    defenseTurret.phase = DEFENSE_TURRET_PHASE.READY;
    defenseTurret.phaseElapsedMs = 0;
    defenseTurret.cooldownRemainingMs = 0;
    defenseTurret.targetProjectileId = null;
}

function validateDefenseTurretCooldownDuration(cooldownDurationMs: number): void {
    if (!Number.isFinite(cooldownDurationMs) || cooldownDurationMs < 0) {
        throw new Error("Defense Turret cooldown duration must be non-negative: " + String(cooldownDurationMs));
    }
}
