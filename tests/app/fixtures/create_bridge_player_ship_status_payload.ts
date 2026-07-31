// tests/app/fixtures/create_bridge_player_ship_status_payload.ts

import type { BridgePlayerShipStatusUpdatedPayload } from '../../../src/app/scenes/game/bridge/events/bridge_event';
import { SHIP_DRIVE_STATUS } from '../../../src/engine/defs/ship_drive';

type BridgePlayerShipStatusPayloadOverrides = {
    hull?: Partial<BridgePlayerShipStatusUpdatedPayload['hull']>;

    drive?: Partial<BridgePlayerShipStatusUpdatedPayload['drive']>;

    pointDefense?: Partial<
        BridgePlayerShipStatusUpdatedPayload['pointDefense']
    >;

    shieldGenerator?: Partial<
        BridgePlayerShipStatusUpdatedPayload['shieldGenerator']
    >;
};

const DEFAULT_PAYLOAD: BridgePlayerShipStatusUpdatedPayload = {
    hull: {
        current: 3,
        max: 3,
    },

    drive: {
        status: SHIP_DRIVE_STATUS.ONLINE,
    },

    pointDefense: {
        current: 4,
        max: 4,
    },

    shieldGenerator: {
        current: 3,
        max: 3,
    },
};

// Узкий fixture только для bridge ship-status snapshot.
// Не создаёт PlayerShipState и не принимает unrelated ship fields.
export function createBridgePlayerShipStatusPayload(
    overrides: BridgePlayerShipStatusPayloadOverrides = {},
): BridgePlayerShipStatusUpdatedPayload {
    return {
        hull: {
            ...DEFAULT_PAYLOAD.hull,
            ...overrides.hull,
        },

        drive: {
            ...DEFAULT_PAYLOAD.drive,
            ...overrides.drive,
        },

        pointDefense: {
            ...DEFAULT_PAYLOAD.pointDefense,
            ...overrides.pointDefense,
        },

        shieldGenerator: {
            ...DEFAULT_PAYLOAD.shieldGenerator,
            ...overrides.shieldGenerator,
        },
    };
}
