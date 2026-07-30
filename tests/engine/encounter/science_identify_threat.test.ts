// tests/engine/encounter/science_identify_threat.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { MISSILE_SPECTRAL_BAND } from '../../../src/engine/defs/missile';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_THREAT_KIND,
    LASER_SHOT_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Science identify threat command', () => {
    it.each([
        {
            label: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            expectedBand: MISSILE_SPECTRAL_BAND.RED,
        },
        {
            label: 'BLUE',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            expectedBand: MISSILE_SPECTRAL_BAND.BLUE,
        },
    ])('identifies an unknown $label incoming missile threat', ({ presetId, expectedBand }) => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId,

            anchorId: stationId,
        });

        const nodeLauncher = nodeEnemy.weapons[0];

        if (nodeLauncher.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error('Expected enemy missile launcher');
        }

        nodeLauncher.ammoCount = 1;

        node.actors.push(nodeEnemy);

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },

            completeTimedTasksImmediately: true,

            pointDefense: createPointDefenseFixture(),
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, ` + `received: ${loadedEvent.type}`);
        }

        engine.step(1);

        engine.drainEvents();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

        engine.drainEvents();

        const identifyCommand = engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
            return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
        });

        expect(identifyCommand).toEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

            label: 'MISSILE M1',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                threatId: 'projectile_1',
            },

            targetLabel: 'IDENTIFY THREAT',
        });

        if (!identifyCommand) {
            throw new Error('Expected IDENTIFY THREAT command');
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENCE,

                commandId: identifyCommand.commandId,
                target: identifyCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getCombatProjectiles()[0].identification).toEqual({
            status: THREAT_IDENTIFICATION_STATUS.IDENTIFIED,

            spectralBand: expectedBand,
        });

        expect(
            engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
                return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
            }),
        ).toBeUndefined();

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: {
                    kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
                    role: OFFICER_ROLE.SCIENCE,
                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: 'projectile_1',

                    label: 'IDENTIFY',
                    showProgress: true,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,

                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 0,
                },
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
                    role: OFFICER_ROLE.SCIENCE,
                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: 'projectile_1',

                    label: 'IDENTIFY',
                    showProgress: true,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,

                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 0,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

                    threatId: 'projectile_1',

                    identification: {
                        kind: COMBAT_THREAT_KIND.MISSILE,

                        spectralBand: expectedBand,
                    },
                },
            },
        ]);
    });

    it('offers LASER 1 only during charging and identifies its target zone', () => {
        const { engine } = createLaserEngine({
            completeTimedTasksImmediately: true,
        });

        engine.step(1);

        expect(
            engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
                return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
            }),
        ).toBeUndefined();

        engine.drainEvents();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

        const [laserStartedEvent] = engine.drainEvents();

        if (laserStartedEvent.type !== ENCOUNTER_EVENT.LASER_ATTACK_STARTED) {
            throw new Error(`Expected laser attack started event, received: ${laserStartedEvent.type}`);
        }

        const identifyCommand = engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
            return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
        });

        expect(identifyCommand).toEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

            label: 'LASER 1',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                threatId: 'laser_attack_1',
            },

            targetLabel: 'IDENTIFY THREAT',
        });

        expect(engine.getLaserAttacks()[0].identification).toEqual({
            status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
        });

        if (!identifyCommand) {
            throw new Error('Expected laser IDENTIFY THREAT command');
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENCE,

                commandId: identifyCommand.commandId,
                target: identifyCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getLaserAttacks()[0].identification).toEqual({
            status: THREAT_IDENTIFICATION_STATUS.IDENTIFIED,

            targetZone: LASER_TARGET_ZONE.CENTER,
        });

        expect(
            engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
                return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
            }),
        ).toBeUndefined();

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: {
                    kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
                    role: OFFICER_ROLE.SCIENCE,
                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: 'laser_attack_1',

                    label: 'IDENTIFY',
                    showProgress: true,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,

                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 0,
                },
            },

            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
                    role: OFFICER_ROLE.SCIENCE,
                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: 'laser_attack_1',

                    label: 'IDENTIFY',
                    showProgress: true,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,

                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 0,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

                    threatId: 'laser_attack_1',

                    identification: {
                        kind: COMBAT_THREAT_KIND.LASER,

                        targetZone: LASER_TARGET_ZONE.CENTER,
                    },
                },
            },
        ]);
    });

    it('cancels unfinished Science identification when the laser hits', () => {
        const { engine, laserChargeDurationMs } = createLaserEngine();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);

        engine.drainEvents();

        engine.step(laserChargeDurationMs - 2000);

        expect(engine.drainEvents()).toEqual([]);

        const identifyCommand = engine.getAvailableCommands(OFFICER_ROLE.SCIENCE).find((command) => {
            return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;
        });

        if (!identifyCommand) {
            throw new Error('Expected laser IDENTIFY THREAT command');
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENCE,

                commandId: identifyCommand.commandId,
                target: identifyCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        const [taskStartedEvent] = engine.drainEvents();

        if (taskStartedEvent.type !== ENCOUNTER_EVENT.OFFICER_TASK_STARTED) {
            throw new Error(`Expected officer task started event, received: ${taskStartedEvent.type}`);
        }

        engine.step(2000);

        const [laserFiredEvent, taskEndedEvent] = engine.drainEvents();

        expect(laserFiredEvent).toMatchObject({
            type: ENCOUNTER_EVENT.LASER_FIRED,

            outcome: LASER_SHOT_OUTCOME.HIT,
            damage: 1,
        });

        expect(taskEndedEvent).toEqual({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

            task: {
                ...taskStartedEvent.task,

                elapsedMs: 2000,
            },

            outcome: OFFICER_TASK_OUTCOME.CANCELLED,
        });

        expect(engine.getLaserAttacks()).toEqual([]);
        expect(engine.getOfficerTasks()).toEqual([]);

        engine.step(1000);

        expect(engine.drainEvents()).toEqual([]);
    });
});

type CreateLaserEngineOptions = {
    completeTimedTasksImmediately?: boolean;
};

function createLaserEngine({
    completeTimedTasksImmediately = false,
}: CreateLaserEngineOptions = {}) {
    const { node, stationId } = createSingleStationNodeFixture();

    const nodeEnemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(nodeEnemy);

    const engine = new EncounterEngine({
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),

        completeTimedTasksImmediately,

        // [left, center, right] → center.
        random: () => 0.5,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    const laser = loadedEvent.state.actors[0].weapons[0];

    if (laser.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected loaded enemy laser');
    }

    const laserDefinition = SHIP_WEAPONS[laser.weaponId];

    if (laserDefinition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected laser weapon definition');
    }

    return {
        engine,

        laserChargeDurationMs: laserDefinition.chargeDurationMs,
    };
}
