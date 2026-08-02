// tests/engine/encounter/engineer_deploy_shield_command.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
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
    type EngineerDeployShieldCommandId,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Engineer deploy shield commands', () => {
    it('offers all zones during laser charging and spends a charge before task start', () => {
        const engine = createLaserEngine({
            charges: 3,
        });

        startLaserCharging(engine);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([
            createAvailableShieldCommand(ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT, 'SHIELD LEFT'),

            createAvailableShieldCommand(ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER, 'SHIELD CENTER'),

            createAvailableShieldCommand(ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_RIGHT, 'SHIELD RIGHT'),
        ]);

        executeShieldCommand(engine, ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER);

        expect(engine.getShieldGeneratorState()).toEqual({
            charges: 2,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });

        // До завершения Engineer task поле ещё не существует.
        expect(engine.getActiveShieldState()).toBeUndefined();

        const task = createEngineerShieldTask({
            id: 'task_1',

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,
            zone: LASER_TARGET_ZONE.CENTER,
        });

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
        expect(engine.getActiveShieldState()).toBeUndefined();

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task,

                outcome: OFFICER_TASK_OUTCOME.CANCELLED,
            },
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toHaveLength(3);
    });

    it('deploys the selected zone on task completion without consuming the same step lifetime', () => {
        const engine = createLaserEngine({
            charges: 3,
        });

        startLaserCharging(engine);

        executeShieldCommand(engine, ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER);

        engine.drainEvents();

        engine.step(2000);

        const shield = {
            zone: LASER_TARGET_ZONE.CENTER,

            elapsedMs: 0,
            durationMs: 5000,
        };

        expect(engine.getActiveShieldState()).toEqual(shield);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: createEngineerShieldTask({
                    id: 'task_1',

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,
                    zone: LASER_TARGET_ZONE.CENTER,

                    elapsedMs: 2000,
                }),

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED,

                    shield,
                },
            },

            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 2,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 2000,
                },
            },
        ]);
    });

    it('replaces the active zone and resets its lifetime', () => {
        const engine = createLaserEngine({
            charges: 3,

            completeTimedTasksImmediately: true,
        });

        startLaserCharging(engine);

        executeShieldCommand(engine, ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER);

        expect(engine.getActiveShieldState()).toEqual({
            zone: LASER_TARGET_ZONE.CENTER,

            elapsedMs: 0,
            durationMs: 5000,
        });

        engine.drainEvents();

        executeShieldCommand(engine, ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT);

        const replacementShield = {
            zone: LASER_TARGET_ZONE.LEFT,

            elapsedMs: 0,
            durationMs: 5000,
        };

        expect(engine.getActiveShieldState()).toEqual(replacementShield);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator: {
                    charges: 1,
                    maxCharges: 3,

                    chargeRegenerationDurationMs: 20000,
                    chargeRegenerationElapsedMs: 0,
                },
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: createEngineerShieldTask({
                    id: 'task_2',

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT,
                    zone: LASER_TARGET_ZONE.LEFT,
                }),
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: createEngineerShieldTask({
                    id: 'task_2',

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT,
                    zone: LASER_TARGET_ZONE.LEFT,
                }),

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED,

                    shield: replacementShield,
                },
            },
        ]);
    });

    it('expires the active shield after five seconds', () => {
        const engine = createLaserEngine({
            charges: 3,

            completeTimedTasksImmediately: true,
        });

        startLaserCharging(engine);

        executeShieldCommand(engine, ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER);

        engine.drainEvents();

        engine.step(4999);

        expect(engine.getActiveShieldState()).toEqual({
            zone: LASER_TARGET_ZONE.CENTER,

            elapsedMs: 4999,
            durationMs: 5000,
        });

        engine.drainEvents();

        engine.step(1);

        expect(engine.getActiveShieldState()).toBeUndefined();
    });

    it('does not offer shield commands without an available charge', () => {
        const engine = createLaserEngine({
            charges: 0,
        });

        startLaserCharging(engine);

        expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([]);
    });
});

type CreateLaserEngineOptions = {
    charges: number;

    completeTimedTasksImmediately?: boolean;
};

function createLaserEngine({
    charges,
    completeTimedTasksImmediately = false,
}: CreateLaserEngineOptions): EncounterEngine {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
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

        completeTimedTasksImmediately,

        random: () => 0.5,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    return engine;
}

function startLaserCharging(engine: EncounterEngine): void {
    engine.step(1);

    expect(engine.getAvailableCommands(OFFICER_ROLE.ENGINEER)).toEqual([]);

    engine.drainEvents();

    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

    const events = engine.drainEvents();

    expect(
        events.some((event) => {
            return event.type === ENCOUNTER_EVENT.LASER_ATTACK_STARTED;
        }),
    ).toBe(true);
}

function executeShieldCommand(engine: EncounterEngine, commandId: EngineerDeployShieldCommandId): void {
    expect(
        engine.executeCommand({
            role: OFFICER_ROLE.ENGINEER,

            commandId,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.NONE,
            },
        }),
    ).toEqual({
        status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
    });
}

function createAvailableShieldCommand(commandId: EngineerDeployShieldCommandId, label: string) {
    return {
        commandId,
        label,

        target: {
            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
        },
    };
}

type CreateEngineerShieldTaskOptions = {
    id: string;

    commandId: EngineerDeployShieldCommandId;
    zone: (typeof LASER_TARGET_ZONE)[keyof typeof LASER_TARGET_ZONE];

    elapsedMs?: number;
};

function createEngineerShieldTask({
    id,
    commandId,
    zone,

    elapsedMs = 0,
}: CreateEngineerShieldTaskOptions) {
    return {
        id,

        kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
        role: OFFICER_ROLE.ENGINEER,
        sourceCommandId: commandId,

        shieldZone: zone,

        label: `SHIELD ${zone.toUpperCase()}`,
        showProgress: true,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,

        durationMs: 2000,
        elapsedMs,
    };
}
