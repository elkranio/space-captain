// tests/engine/encounter/scientist_purge_spam.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

const PURGE_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENTIST_PURGE_SPAM,
    );

describe('Scientist purge spam command', () => {
    it('purges an active hostile spam channel', () => {
        const { node, stationId } =
            createSingleStationNodeFixture();

        node.actors.push(
            ShipNodeActorFactory.create({
                id: 'ship_enemy_00',
                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,
                anchorId: stationId,
            }),
        );

        const engine = new EncounterEngine({
            random: () => 0.5,
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,
            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
            completeTimedTasksImmediately: true,
        });

        const [loadedEvent] = engine.drainEvents();

        if (
            loadedEvent.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                `Expected encounter loaded event, received: ` +
                    `${loadedEvent.type}`,
            );
        }

        const enemy = getMutableEncounterStateForTest(engine)
            .actors[0];
        const projector = enemy.weapons[0];

        if (
            projector.kind !==
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected enemy spam projector',
            );
        }

        expect(
            findPurgeCommand(engine),
        ).toBeUndefined();

        engine.step(
            0,
        );

        const [
            targetingEvent,
            channelStartedEvent,
        ] = engine.drainEvents();

        expect(targetingEvent.type).toBe(
            ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED,
        );

        if (
            channelStartedEvent.type !==
            ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED
        ) {
            throw new Error(
                `Expected spam channel started event, received: ` +
                    `${channelStartedEvent.type}`,
            );
        }

        const purgeCommand =
            findPurgeCommand(engine);

        expect(purgeCommand).toEqual({
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM,
            label: 'PURGE SPAM',
            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND.THREAT,
                threatId:
                    channelStartedEvent.channel.id,
            },
            targetLabel: 'SPAM CHANNEL',
        });

        if (!purgeCommand) {
            throw new Error(
                'Expected PURGE SPAM command',
            );
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENTIST,
                commandId: purgeCommand.commandId,
                target: purgeCommand.target,
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        const [
            taskStartedEvent,
            channelEndedEvent,
            taskEndedEvent,
        ] = engine.drainEvents();

        expect(taskStartedEvent).toMatchObject({
            type:
                ENCOUNTER_EVENT.OFFICER_TASK_STARTED,
            task: {
                kind:
                    OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM,
                role: OFFICER_ROLE.SCIENTIST,
                sourceCommandId:
                    ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM,
                channelId:
                    channelStartedEvent.channel.id,
                label: 'PURGE SPAM',
                canBeCancelledByPlayer: true,
                durationMs:
                    PURGE_DURATION_MS,
            },
        });

        expect(channelEndedEvent).toEqual({
            type:
                ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,
            channel: channelStartedEvent.channel,
            outcome:
                SPAM_CHANNEL_OUTCOME.PURGED,
        });

        expect(taskEndedEvent).toMatchObject({
            type:
                ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            outcome:
                OFFICER_TASK_OUTCOME.COMPLETED,
            result: undefined,
        });

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([]);
        expect(engine.getOfficerTasks()).toEqual([]);
        expect(
            findPurgeCommand(engine),
        ).toBeUndefined();
    });
});

function findPurgeCommand(
    engine: EncounterEngine,
) {
    return engine
        .getAvailableCommands(OFFICER_ROLE.SCIENTIST)
        .find((command) => {
            return (
                command.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM
            );
        });
}
