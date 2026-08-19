import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_DRIVE_STATUS } from '../../../src/engine/defs/ship_drive';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    BEAM_CANNON_SHOT_OUTCOME,
    BEAM_CANNON_TARGET_NODE,
    createBeamCannonAttackSnapshot,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';

describe('Beam Cannon drive damage', () => {
    it('damages an operational drive without spilling into hull', () => {
        const setup = createDriveTargetBeamSetup();
        const hullBefore = setup.engine.getPlayerHullState().hull;

        const events = fireBeam(setup);

        expect(setup.engine.getDriveState()).toMatchObject({
            integrity: 1,
            status: SHIP_DRIVE_STATUS.ONLINE,
        });

        expect(setup.engine.getPlayerHullState().hull).toBe(hullBefore);

        expect(events).toContainEqual({
            type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,
            attack: setup.attack,
            outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
            appliedDamage: 0,
            remainingHull: hullBefore,
            destroyed: false,
        });
    });

    it('breaks a damaged drive without module-damage overkill spilling into hull', () => {
        const setup = createDriveTargetBeamSetup();
        const hullBefore = setup.engine.getPlayerHullState().hull;

        setup.state.drive.integrity = 1;

        const events = fireBeam(setup);

        expect(setup.engine.getDriveState()).toMatchObject({
            integrity: 0,
            status: SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(setup.engine.getPlayerHullState().hull).toBe(hullBefore);

        expect(events).toContainEqual({
            type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,
            attack: setup.attack,
            outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
            appliedDamage: 0,
            remainingHull: hullBefore,
            destroyed: false,
        });
    });

    it('deals double hull damage when the targeted drive was already broken', () => {
        const setup = createDriveTargetBeamSetup();
        const hullBefore = setup.engine.getPlayerHullState().hull;

        setup.state.drive.integrity = 0;
        setup.state.drive.status = SHIP_DRIVE_STATUS.DISABLED;

        const events = fireBeam(setup);

        expect(setup.engine.getDriveState()).toMatchObject({
            integrity: 0,
            status: SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(setup.engine.getPlayerHullState().hull).toBe(
            hullBefore - setup.definition.hullDamage * 2,
        );

        expect(events).toContainEqual({
            type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,
            attack: setup.attack,
            outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
            appliedDamage: setup.definition.hullDamage * 2,
            remainingHull: hullBefore - setup.definition.hullDamage * 2,
            destroyed: false,
        });
    });
});

function createDriveTargetBeamSetup() {
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

        // DRIVE is the upper half of the two-node target roll.
        random: () => 0.75,
    });

    engine.drainEvents();

    engine.step(0);
    engine.drainEvents();

    const state = getMutableEncounterStateForTest(engine);
    const beamCannon = state.actors[0]?.weapons[0];

    if (!beamCannon || beamCannon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected loaded enemy Beam Cannon');
    }

    const definition = SHIP_WEAPONS[beamCannon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected Beam Cannon definition');
    }

    const activeAttack = state.combat.beamCannonAttacks[0];

    if (!activeAttack || activeAttack.targetNode !== BEAM_CANNON_TARGET_NODE.DRIVE) {
        throw new Error('Expected active Beam Cannon attack targeting DRIVE');
    }

    return {
        engine,
        state,
        beamCannon,
        definition,
        attack: createBeamCannonAttackSnapshot(activeAttack),
    };
}

function fireBeam(setup: ReturnType<typeof createDriveTargetBeamSetup>) {
    setup.beamCannon.phaseElapsedMs = setup.definition.chargeDurationMs;

    setup.engine.step(0);

    return setup.engine.drainEvents();
}
