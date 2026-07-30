// tests/engine/encounter/engineer_deploy_shield_command.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Engineer deploy shield commands', () => {
    it('offers all zones during laser charging and spends a charge before task start', () => {
        const engine = createLaserEngine(3);

        engine.step(1);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([]);

        engine.drainEvents();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

        const [laserStartedEvent] = engine.drainEvents();

        expect(laserStartedEvent.type).toBe(ENCOUNTER_EVENT.LASER_ATTACK_STARTED);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([
            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT,

                label: 'SHIELD LEFT',

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },

            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,

                label: 'SHIELD CENTER',

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },

            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_RIGHT,

                label: 'SHIELD RIGHT',

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },
        ]);

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.ENGINEER,

                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 2,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        const task = {
            id: 'task_1',

            kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
            role: OFFICER_ROLE.ENGINEER,
            sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,

            shieldZone: LASER_TARGET_ZONE.CENTER,

            label: 'SHIELD CENTER',
            showProgress: true,

            durationMs: 2000,
            elapsedMs: 0,
        };

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 2,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 0,
                },
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task,
            },
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([]);

        engine.cancelTask(task.id);

        expect(engine.getShieldGeneratorState()?.charges).toBe(2);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task,

                outcome: OFFICER_TASK_OUTCOME.CANCELLED,
            },
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toHaveLength(3);
    });

    it('does not offer shield commands without an available charge', () => {
        const engine = createLaserEngine(0);

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);

        engine.drainEvents();

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([]);
    });
});

function createLaserEngine(charges: number): EncounterEngine {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),

        shieldGenerator: {
            charges,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        },

        random: () => 0.5,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    return engine;
}
