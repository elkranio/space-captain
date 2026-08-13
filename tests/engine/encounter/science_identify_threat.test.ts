// tests/engine/encounter/science_identify_threat.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { MISSILE_SIGNATURE } from '../../../src/engine/defs/missile';
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
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Science identify threat command', () => {
    it.each([
        {
            label: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            expectedBand: MISSILE_SIGNATURE.A,

            random: () => 0,
        },
        {
            label: 'BLUE',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            expectedBand: MISSILE_SIGNATURE.B,

            random: () => 1,
        },
    ])('identifies an unknown $label incoming missile threat', ({
            presetId,
            expectedBand,
            random,
        }) => {
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
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },

            completeTimedTasksImmediately: true,
        
            random,
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
            status: MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED,

            hypothesis: expectedBand,
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

                        status:
                            MISSILE_SIGNATURE_INTEL_STATUS
                                .CONFIRMED,

                        hypothesis: expectedBand,
                    },
                },
            },
        ]);
    });

    it('does not offer IDENTIFY THREAT for a laser without identifiable intel', () => {
        const { engine } =
            createLaserEngine();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        engine.drainEvents();

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.SCIENCE,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_IDENTIFY_THREAT
                    );
                }),
        ).toBeUndefined();
    });

});

function createLaserEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const nodeEnemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(nodeEnemy);

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },
        random: () => 0.5,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    return {
        engine,
    };
}
