// tests/engine/encounter/sticky_mine_dispenser.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { describe, expect, it } from 'vitest';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../src/engine/encounter/model/officer_task';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../../src/engine/encounter/model/combat';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

const MINE_TARGETING_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .GUNNER_FIRE_STICKY_MINES,
    );

describe('Sticky mine dispenser', () => {
    it('targets first, then commits exactly one mine and starts cooldown', () => {
        const {
            engine,
            state,
            dispenser,
        } = createStickyMineEngine();

        engine.step(0);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .ENEMY_ATTACK_STARTED,

                sourceActorId: 'ship_enemy_00',
                sourceWeaponId:
                    'sticky_mine_dispenser_00',
            },
        ]);

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(dispenser.phaseElapsedMs).toBe(0);
        expect(dispenser.ammoCount).toBe(6);

        engine.step(
            MINE_TARGETING_DURATION_MS - 1,
        );

        expect(engine.drainEvents()).toEqual([]);
        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(dispenser.phaseElapsedMs).toBe(
            MINE_TARGETING_DURATION_MS - 1,
        );
        expect(state.combat.stickyMines).toEqual([]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
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
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(dispenser.ammoCount).toBe(5);
        expect(
            dispenser.cooldownRemainingMs,
        ).toBe(17000);

        expect(state.combat.stickyMines).toEqual([
            createMine('sticky_mine_1', 7500),
        ]);

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

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(state.combat.stickyMines).toEqual([]);
        expect(dispenser.ammoCount).toBe(5);
    });

    it('spends one final mine and stays empty after cooldown', () => {
        const {
            engine,
            dispenser,
        } = createStickyMineEngine({
            ammoCount: 1,
        });

        engine.step(0);
        engine.drainEvents();

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(dispenser.ammoCount).toBe(1);

        engine.step(
            MINE_TARGETING_DURATION_MS,
        );
        engine.drainEvents();

        expect(dispenser.ammoCount).toBe(0);
        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(
            dispenser.cooldownRemainingMs,
        ).toBe(17000);

        engine.step(17000);
        engine.drainEvents();

        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(dispenser.phaseElapsedMs).toBe(0);
        expect(dispenser.ammoCount).toBe(0);

        engine.step(0);

        expect(engine.drainEvents()).toEqual([]);
        expect(dispenser.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });

    it('uses the normal damage interruption path when a mine detonates', () => {
        const {
            engine,
            state,
        } = createStickyMineEngine();

        engine.step(0);
        engine.drainEvents();

        engine.step(
            MINE_TARGETING_DURATION_MS,
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

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
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
        ]);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);
    });
});

function createStickyMineEngine({
    ammoCount,
}: {
    ammoCount?: number;
} = {}) {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const enemy =
        ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_GENERIC_STICKY_MINES_00,

            anchorId: stationId,
        });

    const nodeDispenser =
        enemy.weapons[0];

    if (
        nodeDispenser.kind !==
        SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER
    ) {
        throw new Error(
            'Expected node sticky-mine dispenser',
        );
    }

    if (ammoCount !== undefined) {
        nodeDispenser.ammoCount =
            ammoCount;
    }

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        random: () => 0.5,
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

    const state =
        getMutableEncounterStateForTest(engine);

    const dispenser =
        state.actors[0]
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
        state,
        dispenser,
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

            actorId: 'ship_enemy_00',
        },

        sourceWeaponId:
            'sticky_mine_dispenser_00',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

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
                .ENGINEER_REPAIR_DRIVE,

        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .ENGINEER_REPAIR_DRIVE,

        label: 'REPAIR DRIVE',

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 20000,
        elapsedMs: 0,
    };
}
