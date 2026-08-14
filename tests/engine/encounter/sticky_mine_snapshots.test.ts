// tests/engine/encounter/sticky_mine_snapshots.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('Sticky mine snapshots', () => {
    it('keeps display order and derives reservation plus next target', () => {
        const {
            engine,
            state,
        } = createEngine();

        state.combat.stickyMines.push(
            createMine('slow', 9000),

            createOutgoingMine(
                'outgoing',
                1000,
            ),

            createMine('urgent', 5000),
            createMine('middle', 7000),
        );

        expect(
            flags(engine),
        ).toEqual([
            ['slow', false, false],
            ['urgent', false, true],
            ['middle', false, false],
        ]);

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENCE,

                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .CLEAR_STICKY_MINE,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .NONE,
                },
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(
            flags(engine),
        ).toEqual([
            ['slow', false, false],
            ['urgent', true, false],
            ['middle', false, true],
        ]);

        const [task] =
            engine.getOfficerTasks();

        if (!task) {
            throw new Error(
                'Expected CLEAR MINE task',
            );
        }

        engine.cancelTask(task.id);

        expect(
            flags(engine),
        ).toEqual([
            ['slow', false, false],
            ['urgent', false, true],
            ['middle', false, false],
        ]);
    });
});

function flags(
    engine: EncounterEngine,
): Array<[string, boolean, boolean]> {
    return engine
        .getCombatPresentationSnapshot().stickyMineSnapshots
        .map((snapshot) => {
            return [
                snapshot.mine.id,
                snapshot.isBeingCleared,
                snapshot.isNextClearTarget,
            ];
        });
}

function createEngine() {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },    });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    return {
        engine,
        state: getMutableEncounterStateForTest(engine),
    };
}

function createOutgoingMine(
    id: string,
    timeToDetonationMs: number,
): StickyMineState {
    return {
        id,


        source: {
            kind:
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP,
        },

        sourceWeaponId:
            'player_dispenser',

        target: {
            kind:
                COMBAT_TARGET_KIND.ACTOR,

            actorId: 'enemy',
        },

        timeToDetonationMs,
        initialTimeToDetonationMs: 10000,

        damage: 1,
    };
}

function createMine(
    id: string,
    timeToDetonationMs: number,
): StickyMineState {
    return {
        id,


        source: {
            kind:
                COMBAT_SOURCE_KIND.ACTOR,

            actorId: 'enemy',
        },

        sourceWeaponId:
            'dispenser',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        timeToDetonationMs,
        initialTimeToDetonationMs: 10000,

        damage: 1,
    };
}
