// src/engine/generation/ship_system/ShipDefenseTurretFactory.ts

import {
    DEFENSE_TURRET_PHASE,
    type DefenseTurretId,
    type ShipDefenseTurretState,
} from '../../defs/defense_turret';

export type CreateShipDefenseTurretInput = {
    // Runtime id of the installed system.
    id: string;

    defenseTurretId: DefenseTurretId;
};

// Creates fresh mutable state for one installed ship defense-turret system.
export default class ShipDefenseTurretFactory {
    public static create({
        id,
        defenseTurretId,
    }: CreateShipDefenseTurretInput): ShipDefenseTurretState {
        return {
            id,
            defenseTurretId,

            phase:
                DEFENSE_TURRET_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        };
    }
}
