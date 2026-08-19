// tests/engine/encounter/beam_cannon_threat_snapshots.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    BEAM_CANNON_TARGET_INTEL_STATUS,
    BEAM_CANNON_TARGET_NODE,
    COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('EncounterEngine beamCannon threat snapshots', () => {
    it('derives countdown from the charging weapon', () => {
        const { engine, chargeDurationMs } = createBeamCannonEngine();

        engine.step(0);

        const mutableState = getMutableEncounterStateForTest(engine);

        expect(mutableState.combat.beamCannonAttacks[0]?.targetNode).toBe(BEAM_CANNON_TARGET_NODE.DRIVE);

        expect(mutableState.combat.beamCannonAttacks[0]?.targetIntel).toEqual({
            status: BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN,
        });

        expect(engine.getBeamCannonAttacks()).toEqual([createExpectedAttack()]);

        expect(engine.drainEvents()).toContainEqual({
            type: ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED,

            attack: createExpectedAttack(),
        });

        expect(engine.getCombatPresentationSnapshot().beamCannonThreats).toEqual([
            {
                attack: createExpectedAttack(),

                targetIntel: {
                    status: BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN,
                },

                timeToFireMs: chargeDurationMs,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

        engine.step(1234);
        engine.drainEvents();

        expect(mutableState.combat.beamCannonAttacks[0]?.targetNode).toBe(BEAM_CANNON_TARGET_NODE.DRIVE);

        expect(engine.getCombatPresentationSnapshot().beamCannonThreats).toEqual([
            {
                attack: createExpectedAttack(),

                targetIntel: {
                    status: BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN,
                },

                timeToFireMs: chargeDurationMs - 1234,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

    });
});

function createBeamCannonEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BEAM_CANNON_00,

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

    const beamCannon = getMutableEncounterStateForTest(engine)
        .actors[0]
        .weapons[0];

    if (beamCannon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected loaded enemy beamCannon');
    }

    const definition = SHIP_WEAPONS[beamCannon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected beamCannon definition');
    }

    return {
        engine,

        chargeDurationMs: definition.chargeDurationMs,
    };
}

function createExpectedAttack() {
    return {
        id: 'beam_cannon_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'beam_cannon_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
