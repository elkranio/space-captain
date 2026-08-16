// tests/engine/encounter/spam_projector.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Spam projector', () => {
    it('runs through targeting, channel expiry, cooldown and purge', () => {
        const { node, stationId } =
            createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_SPAM_00,

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
                'Expected loaded enemy spam projector',
            );
        }

        const definition =
            SHIP_WEAPONS[projector.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected spam projector definition',
            );
        }

        expect(definition.channelDurationMs).toBe(20000);
        expect(definition.cooldownDurationMs).toBe(35000);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([]);

        const firstChannel = {
            id: 'spam_channel_1',

            sourceActorId: enemy.id,
            sourceWeaponId: projector.id,

            elapsedMs: 0,
            durationMs: definition.channelDurationMs,
        };

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED,

                sourceActorId: enemy.id,
                sourceWeaponId: projector.id,
            },
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: firstChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(1);
        expect(projector.activeChannelId).toBe(
            firstChannel.id,
        );
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([
            {
                ...firstChannel,
                elapsedMs: 1,
            },
        ]);

        engine.step(definition.channelDurationMs - 2);

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(
            definition.channelDurationMs - 1,
        );
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([
            {
                ...firstChannel,

                elapsedMs:
                    definition.channelDurationMs - 1,
            },
        ]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

                channel: {
                    ...firstChannel,

                    elapsedMs:
                        definition.channelDurationMs,
                },

                outcome:
                    SPAM_CHANNEL_OUTCOME.EXPIRED,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(projector.phaseElapsedMs).toBe(
            definition.channelDurationMs,
        );
        expect(projector.cooldownRemainingMs).toBe(
            definition.cooldownDurationMs -
                definition.channelDurationMs,
        );
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([]);

        engine.step(
            definition.cooldownDurationMs -
                definition.channelDurationMs,
        );

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);

        // Second cycle starts CHANNELING directly
        // and is stopped early by purge.
        enemy.decision
            .decisionTickRemainingMs = 0;

        const secondChannel = {
            ...firstChannel,

            id: 'spam_channel_2',
        };

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED,

                sourceActorId: enemy.id,
                sourceWeaponId: projector.id,
            },
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: secondChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );

        engine.step(6999);

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([
            {
                ...secondChannel,

                elapsedMs: 7000,
            },
        ]);

        expect(
            engine.purgeSpamChannel(secondChannel.id),
        ).toBe(true);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

                channel: {
                    ...secondChannel,

                    elapsedMs: 7000,
                },

                outcome:
                    SPAM_CHANNEL_OUTCOME.PURGED,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.COOLDOWN,
        );
        expect(projector.phaseElapsedMs).toBe(7000);
        expect(projector.cooldownRemainingMs).toBe(
            definition.cooldownDurationMs - 7000,
        );
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getCombatPresentationSnapshot().spamChannels).toEqual([]);

        expect(
            engine.purgeSpamChannel(secondChannel.id),
        ).toBe(false);
        expect(engine.drainEvents()).toEqual([]);

        engine.step(
            definition.cooldownDurationMs - 7000,
        );

        expect(engine.drainEvents()).toEqual([]);
        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
    });
});
