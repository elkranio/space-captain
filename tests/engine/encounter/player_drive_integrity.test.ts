import { describe, expect, it } from 'vitest';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { engineerRepairDriveCommandHandler } from '../../../src/engine/encounter/commands/handlers/engineer_repair_drive_command_handler';
import {
    isEquipmentOperational,
} from '../../../src/engine/encounter/model/equipment';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';

function createStore(): EncounterStateStore {
    const { node, stationId } = createSingleStationNodeFixture();

    return EncounterStateStore.fromSpaceNode({
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },

        playerHull: createPlayerHullFixture(),
        drive: createShipDriveFixture(),
    });
}

describe('player drive integrity', () => {
    it('applies module damage to integrity and clamps overkill without hull spill', () => {
        const store = createStore();
        const state = store.getState();
        const initialHull = state.playerHull.hull;

        expect(store.damagePlayerDrive(1)).toMatchObject({
            integrity: 1,
        });

        expect(
            isEquipmentOperational(state.drive),
        ).toBe(true);

        expect(store.damagePlayerDrive(5)).toMatchObject({
            integrity: 0,
        });

        expect(
            isEquipmentOperational(state.drive),
        ).toBe(false);

        expect(state.playerHull.hull).toBe(initialHull);

        expect(() => {
            store.damagePlayerDrive(1);
        }).toThrow('Cannot damage broken player drive');
    });

    it('does not allow repair while the damaged drive is still operational', () => {
        const store = createStore();

        store.damagePlayerDrive(1);

        expect(store.getState().drive).toMatchObject({
            integrity: 1,
        });

        expect(
            engineerRepairDriveCommandHandler.getAvailableCommands(
                store.getState(),
            ),
        ).toEqual([]);

        expect(() => {
            store.repairPlayerDrive();
        }).toThrow('Cannot repair operational player drive');
    });

    it('repairs a broken encounter drive straight to full integrity', () => {
        const store = createStore();

        store.damagePlayerDrive(2);

        expect(store.getState().drive).toMatchObject({
            integrity: 0,
        });

        expect(store.repairPlayerDrive()).toMatchObject({
            integrity: 2,
        });
    });
});
