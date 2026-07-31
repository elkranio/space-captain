// tests/engine/encounter/laser_shield_resolution.test.ts

import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Laser shield resolution', () => {
    it('blocks a laser aimed at the active shield zone and consumes the matching shield', () => {
        const { engine, state, laserChargeDurationMs } = createLaserEngine();

        startLaserCharging(engine);

        engine.step(laserChargeDurationMs - 1);
        engine.drainEvents();

        state.combat.activeShield = {
            zone: LASER_TARGET_ZONE.CENTER,

            elapsedMs: 0,
            durationMs: 5000,
        };

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createExpectedAttack(),

                outcome: LASER_SHOT_OUTCOME.BLOCKED,
            },
        ]);

        expect(engine.getActiveShieldState()).toBeUndefined();
    });

    it('hits when the active shield protects another zone', () => {
        const { engine, state, laserChargeDurationMs } = createLaserEngine();

        startLaserCharging(engine);

        engine.step(laserChargeDurationMs - 1);
        engine.drainEvents();

        state.combat.activeShield = {
            zone: LASER_TARGET_ZONE.LEFT,

            elapsedMs: 0,
            durationMs: 5000,
        };

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createExpectedAttack(),

                outcome: LASER_SHOT_OUTCOME.HIT,
                damage: 1,
            },
        ]);

        expect(engine.getActiveShieldState()).toEqual({
            zone: LASER_TARGET_ZONE.LEFT,

            elapsedMs: 1,
            durationMs: 5000,
        });
    });

    it('hits when no shield is active', () => {
        const { engine, laserChargeDurationMs } = createLaserEngine();

        startLaserCharging(engine);

        engine.step(laserChargeDurationMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: createExpectedAttack(),

                outcome: LASER_SHOT_OUTCOME.HIT,
                damage: 1,
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
        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),

        shieldGenerator: {
            charges: 3,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        },

        // [left, center, right] → center.
        random: () => 0.5,
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
    }

    const laser = loadedEvent.state.actors[0].weapons[0];

    if (laser.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected loaded enemy laser');
    }

    const definition = SHIP_WEAPONS[laser.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected laser definition');
    }

    return {
        engine,
        state: loadedEvent.state,

        laserChargeDurationMs: definition.chargeDurationMs,
    };
}

function startLaserCharging(engine: EncounterEngine): void {
    engine.step(1);
    engine.drainEvents();

    engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - 1);

    const events = engine.drainEvents();

    expect(
        events.some((event) => {
            return event.type === ENCOUNTER_EVENT.LASER_ATTACK_STARTED;
        }),
    ).toBe(true);
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

        targetZone: LASER_TARGET_ZONE.CENTER,

        identification: {
            status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
        },
    };
}
