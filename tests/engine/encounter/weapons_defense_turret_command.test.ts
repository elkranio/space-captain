// tests/engine/encounter/weapons_defense_turret_command.test.ts

import type {
    PowerCoreState,
} from '../../../src/engine/defs/power_core';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    createPowerCoreFixture,
} from '../../fixtures/engine/power_core_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    DEFENSE_TURRET_BEAM_BAND,
    DEFENSE_TURRET_SHOT_OUTCOME,} from '../../../src/engine/defs/defense_turret';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
    type EncounterOfficerCommandId,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Weapons defense turret command', () => {
    it.each([
        {
            missileLabel: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            beamBand: DEFENSE_TURRET_BEAM_BAND.RED,
        },
        {
            missileLabel: 'BLUE',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

            beamBand: DEFENSE_TURRET_BEAM_BAND.BLUE,
        },
    ] as const)(
        'spends one charge immediately and destroys a $missileLabel missile when the beam band matches',
        ({ presetId, commandId, beamBand }) => {
            const { engine, state } = createEngineWithIncomingMissile({
                presetId,
            });

            const commands = engine.getAvailableCommands(OFFICER_ROLE.WEAPONS);

            expect(commands).toEqual([
                {
                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                    label: 'RED BEAM',

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                        threatId: 'projectile_1',
                    },

                    targetLabel: 'MISSILE M1',
                },

                {
                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

                    label: 'BLUE BEAM',

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                        threatId: 'projectile_1',
                    },

                    targetLabel: 'MISSILE M1',
                },
            ]);

            const beamCommand = getCommand(engine, commandId);

            expect(
                engine.executeCommand({
                    role: OFFICER_ROLE.WEAPONS,

                    commandId: beamCommand.commandId,
                    target: beamCommand.target,
                }),
            ).toEqual({
                status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
            });

            expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toEqual([]);

            expect(engine.drainEvents()).toEqual([

                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        defenseTurretBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,

                        canBeCancelledByPlayer: true,
                        canBeInterruptedByDamage: true,

                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 0,
                    },
                },
            ]);

            expect(
                state.combat
                    .powerCore,
            ).toMatchObject({
                charges: 3,
            });

            engine.step(2999);

            expect(engine.drainEvents()).toEqual([]);

            expect(state.officerTasks[OFFICER_ROLE.WEAPONS]).toEqual({
                kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,

                role: OFFICER_ROLE.WEAPONS,

                sourceCommandId: commandId,

                threatId: 'projectile_1',

                defenseTurretBeamBand: beamBand,

                label: 'PD AIM',
                showProgress: true,

                canBeCancelledByPlayer: true,
                canBeInterruptedByDamage: true,

                durationMs: 3000,

                id: 'task_1',
                elapsedMs: 2999,
            });

            expect(state.combat.projectiles).toHaveLength(1);

            expect(
                state.combat
                    .powerCore,
            ).toMatchObject({
                charges: 3,
            });

            engine.step(1);

            expect(engine.drainEvents()).toEqual([
                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        defenseTurretBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,

                        canBeCancelledByPlayer: true,
                        canBeInterruptedByDamage: true,

                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 3000,
                    },

                    outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                    result: {
                        kind: OFFICER_TASK_RESULT_KIND.DEFENSE_TURRET_FIRED,

                        threatId: 'projectile_1',

                        beamBand,

                        outcome: DEFENSE_TURRET_SHOT_OUTCOME.HIT,
                    },
                },
            ]);

            expect(
                state.combat
                    .powerCore,
            ).toMatchObject({
                charges: 3,
            });

            expect(state.combat.projectiles).toEqual([]);

            expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toEqual([]);
        },
    );

    it.each([
        {
            missileLabel: 'RED',
            beamLabel: 'BLUE',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

            beamBand: DEFENSE_TURRET_BEAM_BAND.BLUE,
        },
        {
            missileLabel: 'BLUE',
            beamLabel: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            beamBand: DEFENSE_TURRET_BEAM_BAND.RED,
        },
    ] as const)(
        'spends one charge and leaves a $missileLabel missile active after a $beamLabel beam miss',
        ({ presetId, commandId, beamBand }) => {
            const { engine, state } = createEngineWithIncomingMissile({
                presetId,
            });

            const beamCommand = getCommand(engine, commandId);

            expect(
                engine.executeCommand({
                    role: OFFICER_ROLE.WEAPONS,

                    commandId: beamCommand.commandId,
                    target: beamCommand.target,
                }),
            ).toEqual({
                status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
            });

            expect(
                state.combat
                    .powerCore,
            ).toMatchObject({
                charges: 3,
            });

            engine.drainEvents();

            engine.step(3000);

            expect(engine.drainEvents()).toEqual([
                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        defenseTurretBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,

                        canBeCancelledByPlayer: true,
                        canBeInterruptedByDamage: true,

                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 3000,
                    },

                    outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                    result: {
                        kind: OFFICER_TASK_RESULT_KIND.DEFENSE_TURRET_FIRED,

                        threatId: 'projectile_1',

                        beamBand,

                        outcome: DEFENSE_TURRET_SHOT_OUTCOME.MISS,
                    },
                },
            ]);

            expect(
                state.combat
                    .powerCore,
            ).toMatchObject({
                charges: 3,
            });

            expect(state.combat.projectiles).toHaveLength(1);

            expect(state.combat.projectiles[0].timeToImpactMs).toBe(9000);

            expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toHaveLength(2);
        },
    );

    it('does not offer defense-turret commands without shared defensive charges', () => {
        const { engine, state } = createEngineWithIncomingMissile({
            powerCore:
                createPowerCoreFixture(
                    0,
                ),
        });

        // Scenario setup advances combat time before this assertion,
        // so an empty rechargeable powerCore has already accumulated
        // some recharge progress. Availability depends only on charges.
        expect(
            state.combat
                .powerCore,
        ).toMatchObject({
            charges: 0,
        });

        expect(state.combat.projectiles).toHaveLength(1);

        expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toEqual([]);
    });

    it('does not refund the spent charge when the target disappears before task completion', () => {
        const { engine, state } = createEngineWithIncomingMissile();

        const redBeamCommand = getCommand(
            engine,

            ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,
        );

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.WEAPONS,

                commandId: redBeamCommand.commandId,
                target: redBeamCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        engine.drainEvents();

        expect(
            state.combat
                .powerCore,
        ).toMatchObject({
            charges: 3,
        });

        // Имитируем уничтожение ракеты
        // другой системой до завершения aim.
        state.combat.projectiles.length = 0;

        engine.step(3000);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,

                    role: OFFICER_ROLE.WEAPONS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                    threatId: 'projectile_1',

                    defenseTurretBeamBand: DEFENSE_TURRET_BEAM_BAND.RED,

                    label: 'PD AIM',
                    showProgress: true,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,

                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 3000,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: undefined,
            },
        ]);

        expect(
            state.combat
                .powerCore,
        ).toMatchObject({
            charges: 3,
        });
    });

    it('does not refund the spent charge when defense-turret aim is cancelled', () => {
        const { engine, state } = createEngineWithIncomingMissile();

        const redBeamCommand = getCommand(
            engine,

            ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,
        );

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.WEAPONS,

                commandId: redBeamCommand.commandId,
                target: redBeamCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        engine.drainEvents();

        const task = state.officerTasks[OFFICER_ROLE.WEAPONS];

        if (!task) {
            throw new Error('Expected active defense-turret task');
        }

        engine.cancelTask(task.id);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    ...task,
                },

                outcome: OFFICER_TASK_OUTCOME.CANCELLED,
            },
        ]);

        expect(
            state.combat
                .powerCore,
        ).toMatchObject({
            charges: 3,
        });

        expect(state.combat.projectiles).toHaveLength(1);

        expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toHaveLength(2);
    });
});

type IncomingMissileActorPresetId =
    | typeof SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00
    | typeof SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00;

type CreateEngineWithIncomingMissileOptions = {
    presetId?: IncomingMissileActorPresetId;

    powerCore?:
        PowerCoreState;
};

function createEngineWithIncomingMissile({
    presetId = SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,
    powerCore =
        createPowerCoreFixture(),
}: CreateEngineWithIncomingMissileOptions = {}) {
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
        powerCore,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, ` + `received: ${loadedEvent.type}`);
    }

    engine.step(1);

    engine.drainEvents();

    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

    engine.drainEvents();

    return {
        engine,
        state: getMutableEncounterStateForTest(engine),
    };
}

function getCommand(engine: EncounterEngine, commandId: EncounterOfficerCommandId) {
    const command = engine.getAvailableCommands(OFFICER_ROLE.WEAPONS).find((candidate) => {
        return candidate.commandId === commandId;
    });

    if (!command) {
        throw new Error(`Expected Weapons command: ${commandId}`);
    }

    return command;
}
