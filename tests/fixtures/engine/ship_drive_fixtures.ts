// tests/fixtures/engine/ship_drive_fixtures.ts

import {
    SHIP_DRIVE_ID,
    type ShipDriveState,
} from '../../../src/engine/defs/ship_drive';

export function createShipDriveFixture(): ShipDriveState {
    return {
        id: 'drive_player_00',
        driveId: SHIP_DRIVE_ID.BASIC_00,
    };
}
