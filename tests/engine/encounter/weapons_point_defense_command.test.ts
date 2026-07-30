// tests/engine/encounter/weapons_point_defense_command.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_SHOT_OUTCOME,
    type PointDefenseState,
} from '../../../src/engine/defs/point_defense';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
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
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Weapons point defense command', () => {
    it.each([
        {
            missileLabel: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            beamBand: POINT_DEFENSE_BEAM_BAND.RED,
        },
        {
            missileLabel: 'BLUE',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

            beamBand: POINT_DEFENSE_BEAM_BAND.BLUE,
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
                    type: ENCOUNTER_EVENT.PLAYER_POINT_DEFENSE_CHARGE_SPENT,

                    remainingCharges: 3,
                },

                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        pointDefenseBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,
                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 0,
                    },
                },
            ]);

            expect(state.combat.pointDefense).toEqual({
                charges: 3,
                maxCharges: 4,
            });

            engine.step(2999);

            expect(engine.drainEvents()).toEqual([]);

            expect(state.officerTasks[OFFICER_ROLE.WEAPONS]).toEqual({
                kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                role: OFFICER_ROLE.WEAPONS,

                sourceCommandId: commandId,

                threatId: 'projectile_1',

                pointDefenseBeamBand: beamBand,

                label: 'PD AIM',
                showProgress: true,
                durationMs: 3000,

                id: 'task_1',
                elapsedMs: 2999,
            });

            expect(state.combat.projectiles).toHaveLength(1);

            expect(state.combat.pointDefense).toEqual({
                charges: 3,
                maxCharges: 4,
            });

            engine.step(1);

            expect(engine.drainEvents()).toEqual([
                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        pointDefenseBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,
                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 3000,
                    },

                    outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                    result: {
                        kind: OFFICER_TASK_RESULT_KIND.POINT_DEFENSE_FIRED,

                        threatId: 'projectile_1',

                        beamBand,

                        outcome: POINT_DEFENSE_SHOT_OUTCOME.HIT,
                    },
                },
            ]);

            expect(state.combat.pointDefense).toEqual({
                charges: 3,
                maxCharges: 4,
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

            beamBand: POINT_DEFENSE_BEAM_BAND.BLUE,
        },
        {
            missileLabel: 'BLUE',
            beamLabel: 'RED',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            beamBand: POINT_DEFENSE_BEAM_BAND.RED,
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

            expect(state.combat.pointDefense).toEqual({
                charges: 3,
                maxCharges: 4,
            });

            engine.drainEvents();

            engine.step(3000);

            expect(engine.drainEvents()).toEqual([
                {
                    type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                    task: {
                        kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                        role: OFFICER_ROLE.WEAPONS,

                        sourceCommandId: commandId,

                        threatId: 'projectile_1',

                        pointDefenseBeamBand: beamBand,

                        label: 'PD AIM',
                        showProgress: true,
                        durationMs: 3000,

                        id: 'task_1',
                        elapsedMs: 3000,
                    },

                    outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                    result: {
                        kind: OFFICER_TASK_RESULT_KIND.POINT_DEFENSE_FIRED,

                        threatId: 'projectile_1',

                        beamBand,

                        outcome: POINT_DEFENSE_SHOT_OUTCOME.MISS,
                    },
                },
            ]);

            expect(state.combat.pointDefense).toEqual({
                charges: 3,
                maxCharges: 4,
            });

            expect(state.combat.projectiles).toHaveLength(1);

            expect(state.combat.projectiles[0].timeToImpactMs).toBe(9000);

            expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toHaveLength(2);
        },
    );

    it('does not offer point-defense commands without charges', () => {
        const { engine, state } = createEngineWithIncomingMissile({
            pointDefense: createPointDefenseFixture(0),
        });

        expect(state.combat.pointDefense).toEqual({
            charges: 0,
            maxCharges: 4,
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

        expect(state.combat.pointDefense).toEqual({
            charges: 3,
            maxCharges: 4,
        });

        // Имитируем уничтожение ракеты
        // другой системой до завершения aim.
        state.combat.projectiles.length = 0;

        engine.step(3000);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                    role: OFFICER_ROLE.WEAPONS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                    threatId: 'projectile_1',

                    pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

                    label: 'PD AIM',
                    showProgress: true,
                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 3000,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,
            },
        ]);

        expect(state.combat.pointDefense).toEqual({
            charges: 3,
            maxCharges: 4,
        });
    });

    it('does not refund the spent charge when point-defense aim is cancelled', () => {
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
            throw new Error('Expected active point-defense task');
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

        expect(state.combat.pointDefense).toEqual({
            charges: 3,
            maxCharges: 4,
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

    pointDefense?: PointDefenseState;
};

function createEngineWithIncomingMissile({
    presetId = SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

    pointDefense = createPointDefenseFixture(),
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
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense,
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
        state: loadedEvent.state,
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
