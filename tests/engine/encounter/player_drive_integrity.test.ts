import { describe, expect, it } from 'vitest';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_DRIVE_STATUS, type ShipDriveStatus } from '../../../src/engine/defs/ship_drive';
import { engineerRepairDriveCommandHandler } from '../../../src/engine/encounter/commands/handlers/engineer_repair_drive_command_handler';
import {
    isEquipmentOperational,
} from '../../../src/engine/encounter/model/equipment';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';

function createStore(status: ShipDriveStatus = SHIP_DRIVE_STATUS.ONLINE): EncounterStateStore {
    const { node, stationId } = createSingleStationNodeFixture();

    return EncounterStateStore.fromSpaceNode({
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },

        playerHull: createPlayerHullFixture(),
        drive: createShipDriveFixture(status),
    });
}

describe('player drive integrity', () => {
    it('applies module damage to integrity and clamps overkill without hull spill', () => {
        const store = createStore();
        const state = store.getState();
        const initialHull = state.playerHull.hull;

        expect(store.damagePlayerDrive(1)).toMatchObject({
            integrity: 1,
            status: SHIP_DRIVE_STATUS.ONLINE,
        });

        expect(
            isEquipmentOperational(state.drive),
        ).toBe(true);

        expect(store.damagePlayerDrive(5)).toMatchObject({
            integrity: 0,
            status: SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(
            isEquipmentOperational(state.drive),
        ).toBe(false);

        expect(state.playerHull.hull).toBe(initialHull);

        expect(() => {
            store.damagePlayerDrive(1);
        }).toThrow('Cannot damage player drive from status: disabled');
    });

    it('does not allow repair while the damaged drive is still operational', () => {
        const store = createStore();

        store.damagePlayerDrive(1);

        expect(store.getState().drive).toMatchObject({
            integrity: 1,
            status: SHIP_DRIVE_STATUS.ONLINE,
        });

        expect(
            engineerRepairDriveCommandHandler.getAvailableCommands(
                store.getState(),
            ),
        ).toEqual([]);

        expect(() => {
            store.repairPlayerDrive();
        }).toThrow('Cannot repair player drive from status: online');
    });

    it('hard-disables the drive by dropping integrity to zero', () => {
        const store = createStore();

        expect(store.disablePlayerDrive()).toMatchObject({
            integrity: 0,
            status: SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(store.disablePlayerDrive()).toBeUndefined();
    });

    it('starts a disabled encounter drive broken and repairs it straight to full integrity', () => {
        const store = createStore(SHIP_DRIVE_STATUS.DISABLED);

        expect(store.getState().drive).toMatchObject({
            integrity: 0,
            status: SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(store.repairPlayerDrive()).toMatchObject({
            integrity: 2,
            status: SHIP_DRIVE_STATUS.ONLINE,
        });
    });
});
