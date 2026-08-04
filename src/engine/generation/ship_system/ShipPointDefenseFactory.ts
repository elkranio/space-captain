// src/engine/generation/ship_system/ShipPointDefenseFactory.ts

import {
    POINT_DEFENSES,
} from '../../content/catalogs/point_defenses';
import {
    POINT_DEFENSE_PHASE,
    type PointDefenseId,
    type ShipPointDefenseState,
} from '../../defs/point_defense';

export type CreateShipPointDefenseInput = {
    // Runtime id of the installed system.
    id: string;

    pointDefenseId: PointDefenseId;

    // Test/setup seam. Default is fully charged.
    charges?: number;
};

// Creates fresh mutable state for one installed ship point-defense system.
export default class ShipPointDefenseFactory {
    public static create({
        id,
        pointDefenseId,
        charges,
    }: CreateShipPointDefenseInput): ShipPointDefenseState {
        const definition =
            POINT_DEFENSES[pointDefenseId];

        const resolvedCharges =
            charges ?? definition.maxCharges;

        if (
            !Number.isInteger(resolvedCharges) ||
            resolvedCharges < 0 ||
            resolvedCharges >
                definition.maxCharges
        ) {
            throw new Error(
                'Invalid ship point-defense charge count: ' +
                    `${resolvedCharges}/` +
                    `${definition.maxCharges}`,
            );
        }

        return {
            id,
            pointDefenseId,

            charges: resolvedCharges,
            maxCharges:
                definition.maxCharges,

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        };
    }
}
