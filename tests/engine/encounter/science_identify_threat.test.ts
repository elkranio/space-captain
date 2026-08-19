// tests/engine/encounter/science_identify_threat.test.ts
import { getTestMissileTargetingDurationMs } from './combat_test_support';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
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
    BEAM_CANNON_TARGET_INTEL_STATUS,
    BEAM_CANNON_TARGET_NODE,
    COMBAT_THREAT_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import {
    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE,
} from '../../../src/engine/encounter/model/missile_signature_analysis';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

const IDENTIFY_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENCE_IDENTIFY_THREAT,
    );

describe('Science identify threat command', () => {
    it.each([
        {
            label: 'SIGNATURE A',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            expectedBand: MISSILE_SIGNATURE.A,
},
        {
            label: 'SIGNATURE B',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            expectedBand: MISSILE_SIGNATURE.B,
},
    ])('identifies an unknown $label incoming missile threat', ({
            presetId,
            expectedBand,
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

            random: () => 0,
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, ` + `received: ${loadedEvent.type}`);
        }

        engine.step(1);

        engine.drainEvents();

        engine.step(getTestMissileTargetingDurationMs() - 1);

        engine.drainEvents();

        const projectile =
            getMutableEncounterStateForTest(
                engine,
            ).combat.projectiles[0];

        if (!projectile) {
            throw new Error(
                'Expected incoming missile projectile',
            );
        }

        // Test controls hidden truth explicitly.
        // Science quality uses its own deterministic RNG above.
        projectile.signature =
            expectedBand;

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

                    durationMs:
                        IDENTIFY_DURATION_MS,

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

                    durationMs:
                        IDENTIFY_DURATION_MS,

                    id: 'task_1',
                    elapsedMs: 0,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED,

                    threatId: 'projectile_1',

                    analysisConfidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .CERTAIN,

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

    it('offers IDENTIFY THREAT for uncertain missile intel after the source actor is gone', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const nodeEnemy =
            ShipNodeActorFactory.create({
                id: 'ship_enemy_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_00,

                anchorId:
                    stationId,
            });

        const nodeLauncher =
            nodeEnemy.weapons[0];

        if (
            nodeLauncher.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected enemy missile launcher',
            );
        }

        nodeLauncher.ammoCount = 1;
        node.actors.push(nodeEnemy);

        const engine =
            new EncounterEngine({
                playerHull:
                    createPlayerHullFixture(),

                drive:
                    createShipDriveFixture(),

                node,

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        stationId,
                },

                random:
                    () => 0,
            });

        engine.drainEvents();

        engine.step(1);
        engine.drainEvents();

        engine.step(
            getTestMissileTargetingDurationMs() -
                1,
        );
        engine.drainEvents();

        const state =
            getMutableEncounterStateForTest(
                engine,
            );

        const projectile =
            state.combat
                .projectiles[0];

        if (!projectile) {
            throw new Error(
                'Expected incoming missile projectile',
            );
        }

        projectile.identification = {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .UNCERTAIN,

            hypothesis:
                MISSILE_SIGNATURE.B,
        };

        // Mirrors enemy destruction while the missile is still inbound.
        state.actors.length = 0;

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.SCIENCE,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .SCIENCE_IDENTIFY_THREAT &&
                        command.target.kind ===
                            OFFICER_COMMAND_TARGET_KIND
                                .THREAT &&
                        command.target.threatId ===
                            projectile.id
                    );
                }),
        ).toBeDefined();
    });

    it('identifies an incoming beamCannon target node', () => {
        const { engine } =
            createBeamCannonEngine();

        engine.step(0);

        engine.drainEvents();

        const identifyCommand =
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
                });

        expect(
            identifyCommand,
        ).toEqual({
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .SCIENCE_IDENTIFY_THREAT,

            label:
                'BEAM L1',

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .THREAT,

                threatId:
                    'beam_cannon_attack_1',
            },

            targetLabel:
                'IDENTIFY THREAT',
        });

        if (!identifyCommand) {
            throw new Error(
                'Expected Beam IDENTIFY THREAT command',
            );
        }

        engine.executeCommand({
            role:
                OFFICER_ROLE.SCIENCE,

            commandId:
                identifyCommand.commandId,

            target:
                identifyCommand.target,
        });

        expect(
            engine
                .getCombatPresentationSnapshot()
                .beamCannonThreats[0]
                ?.targetIntel,
        ).toEqual({
            status:
                BEAM_CANNON_TARGET_INTEL_STATUS
                    .CONFIRMED,

            hypothesis:
                BEAM_CANNON_TARGET_NODE
                    .HULL,
        });

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

function createBeamCannonEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const nodeEnemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BEAM_CANNON_00,

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

        completeTimedTasksImmediately: true,

        random: () => 0,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    return {
        engine,
    };
}
