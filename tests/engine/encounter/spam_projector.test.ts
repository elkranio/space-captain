// tests/engine/encounter/spam_projector.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { SPAM_CHANNEL_OUTCOME } from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
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

            pointDefense: createPointDefenseFixture(),
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

        const enemy = loadedEvent.state.actors[0];
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
        expect(definition.cooldownDurationMs).toBe(15000);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: projector.id,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(projector.phaseElapsedMs).toBe(1);

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                projector.phaseElapsedMs -
                1,
        );

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );
        expect(projector.phaseElapsedMs).toBe(
            SHIP_WEAPON_TARGETING_DURATION_MS - 1,
        );
        expect(engine.getSpamChannels()).toEqual([]);

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
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: firstChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBe(
            firstChannel.id,
        );
        expect(engine.getSpamChannels()).toEqual([
            firstChannel,
        ]);

        engine.step(definition.channelDurationMs - 1);

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );
        expect(projector.phaseElapsedMs).toBe(
            definition.channelDurationMs - 1,
        );
        expect(engine.getSpamChannels()).toEqual([
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
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        engine.step(definition.cooldownDurationMs);

        expect(engine.drainEvents()).toEqual([]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);

        // Second cycle reaches CHANNELING directly
        // after targeting and is stopped early by purge.
        engine.step(1);
        engine.drainEvents();

        const secondChannel = {
            ...firstChannel,

            id: 'spam_channel_2',
        };

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS -
                projector.phaseElapsedMs,
        );

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

                channel: secondChannel,
            },
        ]);

        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.CHANNELING,
        );

        engine.step(7000);

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getSpamChannels()).toEqual([
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
        expect(projector.phaseElapsedMs).toBe(0);
        expect(projector.activeChannelId).toBeNull();
        expect(engine.getSpamChannels()).toEqual([]);

        expect(
            engine.purgeSpamChannel(secondChannel.id),
        ).toBe(false);
        expect(engine.drainEvents()).toEqual([]);

        engine.step(definition.cooldownDurationMs);

        expect(engine.drainEvents()).toEqual([]);
        expect(projector.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
        expect(projector.phaseElapsedMs).toBe(0);
    });
});
