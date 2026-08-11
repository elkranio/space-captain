// src/app/scenes/game/bridge/controller/player_ship_status/BridgePlayerShipStatusMapper.ts

import {
    DEFENSE_CAPACITORS,
} from '../../../../../../engine/content/catalogs/defense_capacitors';
import type { PlayerShipState } from '../../../../../../engine/defs/player';
import type { BridgePlayerShipStatusUpdatedPayload } from '../../events/bridge_event';

export function mapPlayerShipToBridgeStatusPayload(
    ship: PlayerShipState,
): BridgePlayerShipStatusUpdatedPayload {
    return {
        hull: {
            current: ship.hull,
            max: ship.maxHull,
        },

        drive: {
            status: ship.drive.status,
        },

        // Temporary presentation alias.
        // The old status strip still calls this cell PD,
        // but its number is now the shared DEF pool.
        pointDefense: {
            current:
                ship.defenseCapacitor
                    .charges,

            max:
                DEFENSE_CAPACITORS[
                    ship
                        .defenseCapacitor
                        .defenseCapacitorId
                ].capacity,
        },

        shieldGenerator: {
            current: ship.shieldGenerator.charges,
            max: ship.shieldGenerator.maxCharges,
        },
    };
}
