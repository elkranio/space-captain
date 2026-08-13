// tests/engine/encounter/officer_performance_spam.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { SHIP_WEAPON_TARGETING_DURATION_MS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Officer performance during hostile spam', () => {
    it('slows task progress without changing duration', () => {
        const { engine, projector } = createActiveSpamEncounter();
        const taskStartedEvent = startPurgeTask(engine);

        engine.step(5000);

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getOfficerTasks()).toEqual([
            {
                ...taskStartedEvent.task,
                elapsedMs: 2500,
            },
        ]);
        expect(taskStartedEvent.task.durationMs).toBe(5000);

        engine.step(5000);

        const [channelEndedEvent, taskEndedEvent] =
            engine.drainEvents();

        expect(channelEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,
            outcome: SPAM_CHANNEL_OUTCOME.PURGED,
        });
        expect(taskEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            task: {
                id: taskStartedEvent.task.id,
                elapsedMs: 5000,
                durationMs: 5000,
            },
            outcome: OFFICER_TASK_OUTCOME.COMPLETED,
        });

        expect(engine.getOfficerTasks()).toEqual([]);
        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
    });

    it('cancels PURGE SPAM when its channel expires first', () => {
        const { engine, channel } = createActiveSpamEncounter();

        engine.step(channel.durationMs - 5000);
        expect(engine.drainEvents()).toEqual([]);

        const taskStartedEvent = startPurgeTask(engine);

        engine.step(5000);

        const [channelEndedEvent, taskEndedEvent] =
            engine.drainEvents();

        expect(channelEndedEvent).toEqual({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,
            channel: {
                ...channel,
                elapsedMs: channel.durationMs,
            },
            outcome: SPAM_CHANNEL_OUTCOME.EXPIRED,
        });
        expect(taskEndedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            task: {
                id: taskStartedEvent.task.id,
                elapsedMs: 2500,
            },
            outcome: OFFICER_TASK_OUTCOME.CANCELLED,
        });

        expect(engine.getOfficerTasks()).toEqual([]);
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([]);
    });
});

function createActiveSpamEncounter() {
    const { node, stationId } = createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id: 'ship_enemy_00',
            presetId:
                SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,
            anchorId: stationId,
        }),
    );

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,
        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error('Expected encounter loaded event');
    }

    const projector = getMutableEncounterStateForTest(engine)
        .actors[0]
        .weapons[0];

    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);

    const channelStartedEvent = engine
        .drainEvents()
        .find((event) => {
            return event.type === ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED;
        });

    if (
        !channelStartedEvent ||
        channelStartedEvent.type !==
            ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED
    ) {
        throw new Error('Expected spam channel started event');
    }

    return {
        engine,
        projector,
        channel: channelStartedEvent.channel,
    };
}

function startPurgeTask(engine: EncounterEngine) {
    const command = engine
        .getAvailableCommands(OFFICER_ROLE.SCIENCE)
        .find((candidate) => {
            return (
                candidate.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM
            );
        });

    if (!command) {
        throw new Error('Expected PURGE SPAM command');
    }

    expect(
        engine.executeCommand({
            role: OFFICER_ROLE.SCIENCE,
            commandId: command.commandId,
            target: command.target,
        }),
    ).toEqual({
        status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
    });

    const [event] = engine.drainEvents();

    if (event.type !== ENCOUNTER_EVENT.OFFICER_TASK_STARTED) {
        throw new Error('Expected officer task started event');
    }

    return event;
}
