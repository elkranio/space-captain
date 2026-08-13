// tests/engine/encounter/opening_disruption_pulse.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { describe, expect, it } from 'vitest';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_DRIVE_STATUS } from '../../../src/engine/defs/ship_drive';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
    createStationAndBeaconNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('opening disruption pulse', () => {
    it('disables the player drive once when initial hostile ships engage', () => {
        const { node, stationId } =
            createSingleStationNodeFixture();

        const actor = createShipActor(
            'ship_enemy_00',
            stationId,
            ENCOUNTER_TEAM.ENEMY,
        );

        node.actors.push(actor);

        const drive = createShipDriveFixture();

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },

            drive,
        });

        const [loadedEvent] = engine.drainEvents();

        if (
            loadedEvent.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                'Expected encounter loaded event',
            );
        }

        expect(engine.getDriveState().status).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
        );

        expect(
            getMutableEncounterStateForTest(
                engine,
            ).actors[0]
                .hasUsedOpeningDisruptionPulse,
        ).toBe(false);

        engine.engageHostileActors();

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

                sourceActorId: actor.id,

                drive: {
                    ...drive,
                    status:
                        SHIP_DRIVE_STATUS.DISABLED,
                },

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                    anchorId: stationId,
                },
            },
        ]);

        expect(engine.getDriveState().status).toBe(
            SHIP_DRIVE_STATUS.DISABLED,
        );

        expect(
            getMutableEncounterStateForTest(engine)
                .actors[0]
                .hasUsedOpeningDisruptionPulse,
        ).toBe(true);

        engine.engageHostileActors();

        expect(engine.drainEvents()).toEqual([]);
    });

    it('fires immediately on NEUTRAL to ENEMY and never repeats for the same ship', () => {
        const { engine, actorId } =
            createNeutralEncounter();

        engine.engageHostileActors();
        expect(engine.drainEvents()).toEqual([]);

        engine.setActorTeam(
            actorId,
            ENCOUNTER_TEAM.ENEMY,
        );

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

                sourceActorId: actorId,

                drive: expect.objectContaining({
                    status:
                        SHIP_DRIVE_STATUS.DISABLED,
                }),
            }),
        ]);

        engine.setActorTeam(
            actorId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.setActorTeam(
            actorId,
            ENCOUNTER_TEAM.ENEMY,
        );

        expect(engine.drainEvents()).toEqual([]);
    });

    it('cancels FLY TO and restores its origin anchor', () => {
        const {
            node,
            stationId,
            beaconId,
        } = createStationAndBeaconNodeFixture();

        const actor = createShipActor(
            'ship_neutral_00',
            stationId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        node.actors.push(actor);

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },

            drive: createShipDriveFixture(),
        });

        engine.drainEvents();

        engine.executeCommand({
            role: OFFICER_ROLE.HELM,
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND.ANCHOR,
                anchorId: beaconId,
            },
        });

        const startedEvents = engine.drainEvents();

        const taskStartedEvent = startedEvents.find(
            (event) => {
                return (
                    event.type ===
                    ENCOUNTER_EVENT.OFFICER_TASK_STARTED
                );
            },
        );

        if (
            !taskStartedEvent ||
            taskStartedEvent.type !==
                ENCOUNTER_EVENT.OFFICER_TASK_STARTED
        ) {
            throw new Error(
                'Expected FLY TO task started event',
            );
        }

        engine.setActorTeam(
            actor.id,
            ENCOUNTER_TEAM.ENEMY,
        );

        const [taskEndedEvent, disruptedEvent] =
            engine.drainEvents();

        expect(taskEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

            task: {
                id: taskStartedEvent.task.id,
                kind: OFFICER_TASK_KIND.HELM_FLY_TO,
            },

            outcome:
                OFFICER_TASK_OUTCOME.CANCELLED,
        });

        expect(disruptedEvent).toMatchObject({
            type:
                ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

            sourceActorId: actor.id,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
        });

        expect(engine.getOfficerTasks()).toEqual([]);

        expect(engine.getNavigationState()).toEqual({
            kind:
                PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        });
    });

    it('cancels active DOCK and JUMP tasks', () => {
        for (const task of [
            createDockTask(),
            createJumpTask(),
        ]) {
            const {
                engine,
                state,
                actorId,
            } = createNeutralEncounter();

            state.officerTasks[OFFICER_ROLE.HELM] =
                task;

            engine.setActorTeam(
                actorId,
                ENCOUNTER_TEAM.ENEMY,
            );

            const [taskEndedEvent, disruptedEvent] =
                engine.drainEvents();

            expect(taskEndedEvent).toMatchObject({
                type:
                    ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    id: task.id,
                    kind: task.kind,
                },

                outcome:
                    OFFICER_TASK_OUTCOME.CANCELLED,
            });

            expect(disruptedEvent).toMatchObject({
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,

                sourceActorId: actorId,
            });

            expect(engine.getOfficerTasks()).toEqual([]);
        }
    });
});

function createNeutralEncounter() {
    const { node, stationId } =
        createSingleStationNodeFixture();

    const actor = createShipActor(
        'ship_neutral_00',
        stationId,
        ENCOUNTER_TEAM.NEUTRAL,
    );

    node.actors.push(actor);

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },

        drive: createShipDriveFixture(),    });

    const [loadedEvent] = engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    return {
        engine,
        state: getMutableEncounterStateForTest(engine),
        actorId: actor.id,
    };
}

function createShipActor(
    id: string,
    anchorId: string,
    team: typeof ENCOUNTER_TEAM.ENEMY |
        typeof ENCOUNTER_TEAM.NEUTRAL,
) {
    const actor = ShipNodeActorFactory.create({
        id,
        presetId:
            SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,
        anchorId,
    });

    actor.team = team;
    actor.weapons = [];

    return actor;
}

function createDockTask(): OfficerTaskState {
    return {
        id: 'task_dock',

        kind: OFFICER_TASK_KIND.HELM_DOCK,
        role: OFFICER_ROLE.HELM,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK,

        targetAnchorId: 'station_target',

        label: 'DOCK',
        showProgress: false,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: false,
        canBeInterruptedByDamage: false,
    };
}

function createJumpTask(): OfficerTaskState {
    return {
        id: 'task_jump',

        kind: OFFICER_TASK_KIND.HELM_JUMP,
        role: OFFICER_ROLE.HELM,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP,

        targetAnchorId: 'jump_point_target',
        targetNodeId: 'node_target',

        label: 'JUMP',
        showProgress: false,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,
    };
}
