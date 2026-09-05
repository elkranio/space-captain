// tests/engine/encounter/beam_cannon_task_interruption.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
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
    BEAM_CANNON_SHOT_OUTCOME,
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

describe('BeamCannon hit officer task interruption', () => {
    it('uses encounter RNG to cancel one of several active tasks after a hit', () => {
        const { engine, state, beamCannonChargeDurationMs } = createBeamCannonEngine([
            // Beam target selection: HULL.
            0.25,

            // Two active tasks: select index 1.
            0.75,
        ]);

        state.actors[0].behavior
            .decisionTickWiggleMs = 0;

        startBeamCannonCharging(engine);

        engine.step(beamCannonChargeDurationMs - 1);
        engine.drainEvents();

        const scientistTask = createScientistTask();
        const engineerTask = createEngineerTask();

        // Object.values preserves insertion order for these role keys.
        state.officerTasks[OFFICER_ROLE.SCIENTIST] = scientistTask;
        state.officerTasks[OFFICER_ROLE.ENGINEER] = engineerTask;

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,

                attack: createExpectedAttack(),

                outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
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
                ...scientistTask,

                elapsedMs: 1,
            },
        ]);
    });
});

function createBeamCannonEngine(randomValues: number[]) {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BEAM_CANNON_00,

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
    const beamCannon = state.actors[0].weapons[0];

    if (beamCannon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected loaded enemy beamCannon');
    }

    const definition = SHIP_WEAPONS[beamCannon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected beamCannon definition');
    }

    return {
        engine,
        state,

        beamCannonChargeDurationMs: definition.chargeDurationMs,
    };
}

function startBeamCannonCharging(engine: EncounterEngine): void {
    engine.step(0);

    expect(engine.drainEvents()).toEqual([
        {
            type: ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED,

            sourceActorId: 'ship_enemy_00',
            sourceWeaponId: 'beam_cannon_00',
        },

        {
            type: ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED,

            attack: createExpectedAttack(),
        },
    ]);
}

function createScientistTask(): OfficerTaskState {
    return {
        id: 'task_scientist',

        kind: OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE,
        role: OFFICER_ROLE.SCIENTIST,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE,

        targetNodeId: 'node_test',

        label: 'PLOT COURSE',

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

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 12000,
        elapsedMs: 0,
    };
}

function createExpectedAttack() {
    return {
        id: 'beam_cannon_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'beam_cannon_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
