// src/app/scenes/game/bridge/controller/player_ship_status/BridgePlayerShipStatusMapper.ts

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

        pointDefense: {
            current: ship.pointDefense.charges,
            max: ship.pointDefense.maxCharges,
        },

        shieldGenerator: {
            current: ship.shieldGenerator.charges,
            max: ship.shieldGenerator.maxCharges,
        },
    };
}
