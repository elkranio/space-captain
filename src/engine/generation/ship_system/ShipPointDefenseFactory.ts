// src/engine/generation/ship_system/ShipPointDefenseFactory.ts

import {
    POINT_DEFENSE_PHASE,
    type PointDefenseId,
    type ShipPointDefenseState,
} from '../../defs/point_defense';

export type CreateShipPointDefenseInput = {
    // Runtime id of the installed system.
    id: string;

    pointDefenseId: PointDefenseId;
};

// Creates fresh mutable state for one installed ship point-defense system.
export default class ShipPointDefenseFactory {
    public static create({
        id,
        pointDefenseId,
    }: CreateShipPointDefenseInput): ShipPointDefenseState {
        return {
            id,
            pointDefenseId,

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        };
    }
}
