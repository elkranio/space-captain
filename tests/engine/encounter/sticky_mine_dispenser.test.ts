// tests/engine/encounter/sticky_mine_dispenser.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    SPACE_NODE_ACTOR_KIND,
    type ShipSpaceNodeActorState,
} from '../../../src/engine/defs/universe';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../src/engine/encounter/model/officer_task';
import type { StickyMineState } from '../../../src/engine/encounter/model/combat';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Sticky mine dispenser', () => {
    it('attaches the first mine after targeting and catches up missed burst intervals', () => {
        const {
            engine,
            state,
            dispenser,
        } = createStickyMineEngine();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: 'ship_enemy_00',
                sourceWeaponId:
                    'sticky_mine_dispenser_00',
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_1',
                    7500,
                ),
            },
        ]);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.DISPENSING,
        );
        expect(dispenser.phaseElapsedMs).toBe(0);
        expect(dispenser.dispensedMineCount).toBe(1);

        expect(state.combat.stickyMines).toEqual([
            createMine('sticky_mine_1', 7500),
        ]);

        engine.step(5000);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_2',
                    4500,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_3',
                    6500,
                ),
            },
        ]);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.DISPENSING,
        );
        expect(dispenser.phaseElapsedMs).toBe(1000);
        expect(dispenser.dispensedMineCount).toBe(3);

        expect(state.combat.stickyMines).toEqual([
            createMine('sticky_mine_1', 2500),
            createMine('sticky_mine_2', 4500),
            createMine('sticky_mine_3', 6500),
        ]);

        engine.step(5000);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: createMine(
                    'sticky_mine_1',
                    0,
                ),

                damage: 1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: createMine(
                    'sticky_mine_2',
                    0,
                ),

                damage: 1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_4',
                    3500,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_5',
                    5500,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_6',
                    7500,
                ),
            },
        ]);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(dispenser.phaseElapsedMs).toBe(0);
        expect(dispenser.dispensedMineCount).toBe(6);

        expect(state.combat.stickyMines).toEqual([
            createMine('sticky_mine_3', 1500),
            createMine('sticky_mine_4', 3500),
            createMine('sticky_mine_5', 5500),
            createMine('sticky_mine_6', 7500),
        ]);
    });

    it('uses the normal damage interruption path when a mine detonates', () => {
        const {
            engine,
            state,
        } = createStickyMineEngine();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );
        engine.drainEvents();

        const engineerTask = createEngineerTask();

        state.officerTasks[
            OFFICER_ROLE.ENGINEER
        ] = engineerTask;

        engine.step(7500);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine: createMine(
                    'sticky_mine_1',
                    0,
                ),

                damage: 1,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_ENDED,

                task: {
                    ...engineerTask,

                    elapsedMs: 7500,
                },

                outcome:
                    OFFICER_TASK_OUTCOME.CANCELLED,
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_2',
                    2000,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_3',
                    4000,
                ),
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_ATTACHED,

                mine: createMine(
                    'sticky_mine_4',
                    6000,
                ),
            },
        ]);

        expect(engine.getOfficerTasks()).toEqual([]);
    });
});

function createStickyMineEngine() {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const enemy: ShipSpaceNodeActorState = {
        id: 'ship_enemy_00',

        kind: SPACE_NODE_ACTOR_KIND.SHIP,

        team: ENCOUNTER_TEAM.ENEMY,

        shipId: SHIP_ID.GENERIC_00,
        anchorId: stationId,

        weapons: [
            {
                id:
                    'sticky_mine_dispenser_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                phase:
                    SHIP_WEAPON_PHASE.READY,
                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },
        ],
    };

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },

        pointDefense:
            createPointDefenseFixture(),
    });

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

    const dispenser =
        loadedEvent.state.actors[0]
            .weapons[0];

    if (
        dispenser.kind !==
        SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER
    ) {
        throw new Error(
            'Expected sticky-mine dispenser',
        );
    }

    return {
        engine,
        state: loadedEvent.state,
        dispenser,
    };
}

function createMine(
    id: string,
    timeToDetonationMs: number,
): StickyMineState {
    return {
        id,

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId:
            'sticky_mine_dispenser_00',

        timeToDetonationMs,
        initialTimeToDetonationMs: 7500,

        damage: 1,
    };
}

function createEngineerTask(): OfficerTaskState {
    return {
        id: 'task_engineer',

        kind:
            OFFICER_TASK_KIND
                .ENGINEER_DEPLOY_SHIELD,

        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .ENGINEER_DEPLOY_SHIELD_LEFT,

        shieldZone: LASER_TARGET_ZONE.LEFT,

        label: 'SHIELD LEFT',
        showProgress: true,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 20000,
        elapsedMs: 0,
    };
}
