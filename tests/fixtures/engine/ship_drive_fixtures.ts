// tests/fixtures/engine/ship_drive_fixtures.ts

import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
    type ShipDriveState,
    type ShipDriveStatus,
} from '../../../src/engine/defs/ship_drive';

export function createShipDriveFixture(
    status: ShipDriveStatus =
        SHIP_DRIVE_STATUS.ONLINE,
): ShipDriveState {
    return {
        id: 'drive_player_00',
        driveId: SHIP_DRIVE_ID.BASIC_00,
        status,
    };
}
