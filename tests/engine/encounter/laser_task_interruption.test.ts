// tests/engine/encounter/laser_task_interruption.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Laser hit officer task interruption', () => {
    it('uses encounter RNG to cancel one of several active tasks after a hit', () => {
        const { engine, state, laserChargeDurationMs } = createLaserEngine([
            // Two active tasks: select index 1.
            0.75,
        ]);

        startLaserCharging(engine);

        engine.step(laserChargeDurationMs - 1);
        engine.drainEvents();

        const scienceTask = createScienceTask();
        const engineerTask = createEngineerTask();

        // Object.values preserves insertion order for these role keys.
        state.officerTasks[OFFICER_ROLE.SCIENCE] = scienceTask;
        state.officerTasks[OFFICER_ROLE.ENGINEER] = engineerTask;

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createExpectedAttack(),

                outcome: LASER_SHOT_OUTCOME.HIT,
                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    ...engineerTask,

                    elapsedMs: 1,
                },

                outcome: OFFICER_TASK_OUTCOME.CANCELLED,
            },
        ]);

        expect(engine.getOfficerTasks()).toEqual([
            {
                ...scienceTask,

                elapsedMs: 1,
            },
        ]);
    });
});

function createLaserEngine(randomValues: number[]) {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(enemy);

    let randomIndex = 0;

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },
        random: () => {
            const value = randomValues[randomIndex];

            randomIndex += 1;

            if (value === undefined) {
                throw new Error(`Unexpected random call: ${randomIndex}`);
            }

            return value;
        },
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    const state = getMutableEncounterStateForTest(engine);
    const laser = state.actors[0].weapons[0];

    if (laser.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected loaded enemy laser');
    }

    const definition = SHIP_WEAPONS[laser.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected laser definition');
    }

    return {
        engine,
        state,

        laserChargeDurationMs: definition.chargeDurationMs,
    };
}

function startLaserCharging(engine: EncounterEngine): void {
    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);

    expect(engine.drainEvents()).toEqual([
        {
            type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

            sourceActorId: 'ship_enemy_00',
            sourceWeaponId: 'laser_00',
        },

        {
            type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

            attack: createExpectedAttack(),
        },
    ]);
}

function createScienceTask(): OfficerTaskState {
    return {
        id: 'task_science',

        kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,
        role: OFFICER_ROLE.SCIENCE,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

        targetNodeId: 'node_test',

        label: 'PLOT COURSE',
        showProgress: true,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 3000,
        elapsedMs: 0,
    };
}

function createEngineerTask(): OfficerTaskState {
    return {
        id: 'task_engineer',

        kind: OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE,
        role: OFFICER_ROLE.ENGINEER,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

        label: 'REPAIR DRIVE',
        showProgress: true,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 12000,
        elapsedMs: 0,
    };
}

function createExpectedAttack() {
    return {
        id: 'laser_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'laser_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
