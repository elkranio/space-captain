// src/engine/encounter/model/equipment.ts

import type { ShipDefenseTurretState } from "../../defs/defense_turret";
import type { ShipDriveState } from "../../defs/ship_drive";
import {
    SHIP_WEAPON_KIND,
    type ShipWeaponState,
} from "../../defs/ship_weapon";
import type { ShieldGeneratorState } from "../../defs/shield_generator";

export type EncounterEquipmentIntegrityState = {
    integrity: number;
};

export type EncounterShipDriveState =
    ShipDriveState & EncounterEquipmentIntegrityState;

export type EncounterShipDefenseTurretState =
    ShipDefenseTurretState & EncounterEquipmentIntegrityState;

export type EncounterShieldGeneratorState =
    ShieldGeneratorState & EncounterEquipmentIntegrityState;

export type EncounterShipWeaponState =
    ShipWeaponState & EncounterEquipmentIntegrityState;

export type EquipmentDamageResult = {
    appliedDamage: number;
    remainingIntegrity: number;
    broken: boolean;
};

export function createEncounterEquipmentState<T extends object>(
    state: T,
    maxIntegrity: number,
    operational = true,
): T & EncounterEquipmentIntegrityState {
    validateMaxIntegrity(maxIntegrity);

    return {
        ...state,

        integrity:
            operational
                ? maxIntegrity
                : 0,
    };
}

export function isEquipmentOperational(
    state: EncounterEquipmentIntegrityState,
): boolean {
    return state.integrity > 0;
}

export function damageEquipmentIntegrity(
    state: EncounterEquipmentIntegrityState,
    damage: number,
): EquipmentDamageResult {
    validateIntegrity(state.integrity);

    if (!Number.isInteger(damage) || damage < 0) {
        throw new Error(
            "Equipment damage must be a non-negative integer: " +
                String(damage),
        );
    }

    const wasOperational =
        isEquipmentOperational(state);

    const appliedDamage =
        Math.min(
            damage,
            state.integrity,
        );

    state.integrity =
        Math.max(
            0,
            state.integrity - appliedDamage,
        );

    return {
        appliedDamage,

        remainingIntegrity:
            state.integrity,

        broken:
            wasOperational &&
            appliedDamage > 0 &&
            !isEquipmentOperational(state),
    };
}

export function createDefenseTurretStateSnapshot(
    state: ShipDefenseTurretState,
): ShipDefenseTurretState {
    return {
        id: state.id,
        defenseTurretId: state.defenseTurretId,

        phase: state.phase,
        phaseElapsedMs: state.phaseElapsedMs,

        cooldownRemainingMs:
            state.cooldownRemainingMs,

        targetProjectileId:
            state.targetProjectileId,
    };
}

export function createShieldGeneratorStateSnapshot(
    state: ShieldGeneratorState,
): ShieldGeneratorState {
    return {
        id: state.id,
        shieldGeneratorId:
            state.shieldGeneratorId,

        status: state.status,

        phase: state.phase,
        phaseElapsedMs: state.phaseElapsedMs,
    };
}

export function createShipWeaponStateSnapshot(
    state: ShipWeaponState,
): ShipWeaponState {
    const base = {
        id: state.id,
        weaponId: state.weaponId,

        phase: state.phase,
        phaseElapsedMs: state.phaseElapsedMs,

        cooldownRemainingMs:
            state.cooldownRemainingMs,
    };

    switch (state.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            return {
                ...base,

                kind: state.kind,

                ammoCount: state.ammoCount,
            };

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return {
                ...base,

                kind: state.kind,
            };

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return {
                ...base,

                kind: state.kind,

                activeChannelId:
                    state.activeChannelId,
            };

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return {
                ...base,

                kind: state.kind,

                ammoCount: state.ammoCount,

                dispensedMineCount:
                    state.dispensedMineCount,
            };

        default:
            return assertNever(state);
    }
}

function validateMaxIntegrity(
    maxIntegrity: number,
): void {
    if (
        !Number.isInteger(maxIntegrity) ||
        maxIntegrity <= 0
    ) {
        throw new Error(
            "Equipment max integrity must be a positive integer: " +
                String(maxIntegrity),
        );
    }
}

function validateIntegrity(
    integrity: number,
): void {
    if (
        !Number.isInteger(integrity) ||
        integrity < 0
    ) {
        throw new Error(
            "Equipment integrity must be a non-negative integer: " +
                String(integrity),
        );
    }
}

function assertNever(value: never): never {
    throw new Error(
        "Unhandled encounter equipment state: " +
            String(value),
    );
}
