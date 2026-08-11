// tests/engine/encounter/laser_threat_snapshots.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('EncounterEngine laser threat snapshots', () => {
    it('derives countdown from the charging weapon', () => {
        const { engine, chargeDurationMs } = createLaserEngine();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);
        engine.drainEvents();

        expect(engine.getLaserThreatSnapshots()).toEqual([
            {
                attack: createExpectedAttack(),

                timeToFireMs: chargeDurationMs,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

        engine.step(1234);
        engine.drainEvents();

        expect(engine.getLaserThreatSnapshots()).toEqual([
            {
                attack: createExpectedAttack(),

                timeToFireMs: chargeDurationMs - 1234,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

    });
});

function createLaserEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),

        random: () => {
            return 0.5;
        },
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(
            `Expected encounter loaded event, received: ${loadedEvent.type}`,
        );
    }

    const laser = getMutableEncounterStateForTest(engine)
        .actors[0]
        .weapons[0];

    if (laser.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected loaded enemy laser');
    }

    const definition = SHIP_WEAPONS[laser.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected laser definition');
    }

    return {
        engine,

        chargeDurationMs: definition.chargeDurationMs,
    };
}

function createExpectedAttack() {
    return {
        id: 'laser_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'laser_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
