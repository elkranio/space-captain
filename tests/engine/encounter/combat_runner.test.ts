import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/combat_runner.test.ts

import {
    createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
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
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    BEAM_CANNON_SHOT_OUTCOME,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('CombatRunner', () => {
    it('runs an enemy missile launcher through targeting, flight, impact and cooldown', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: stationId,
        });

        const nodeLauncher = nodeEnemy.weapons[0];

        if (nodeLauncher.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error('Expected enemy missile launcher');
        }

        // Тесту нужен ровно один выстрел.
        nodeLauncher.ammoCount = 1;

        node.actors.push(nodeEnemy);

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },

            random: () => 0,
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ` + `${loadedEvent.type}`);
        }

        const state = getMutableEncounterStateForTest(engine);
        const enemy = state.actors[0];

        const launcher = enemy.weapons[0];

        if (launcher.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error('Expected loaded enemy missile launcher');
        }

        const loadedLauncherDefinition = SHIP_WEAPONS[launcher.weaponId];

        if (
            loadedLauncherDefinition.kind !==
            SHIP_WEAPON_KIND.MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected missile launcher definition',
            );
        }

        expect(state.combat.projectiles).toEqual([]);
        expect(state.combat.beamCannonAttacks).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.READY);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: launcher.id,
            },
        ]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.TARGETING);

        expect(launcher.phaseElapsedMs).toBe(1);

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - launcher.phaseElapsedMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

                projectile: {
                    id: 'projectile_1',
                    designation: 'M1',

                    kind: COMBAT_PROJECTILE_KIND.MISSILE,

                    source: {
                        kind: COMBAT_SOURCE_KIND.ACTOR,
                        actorId: enemy.id,
                    },

                    sourceWeaponId: launcher.id,

                    target: {
                        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
                    },

                    timeToImpactMs: 12000,
                    initialTimeToImpactMs: 12000,
                },
            },
        ]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);

        expect(launcher.phaseElapsedMs).toBe(0);
        expect(launcher.ammoCount).toBe(0);

        const [projectile] = state.combat.projectiles;

        expect(projectile).toEqual({
            id: 'projectile_1',
            designation: 'M1',

            kind: COMBAT_PROJECTILE_KIND.MISSILE,

            source: {
                kind: COMBAT_SOURCE_KIND.ACTOR,
                actorId: enemy.id,
            },

            sourceWeaponId: launcher.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                status: MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN,
            },

            damage:
                loadedLauncherDefinition.damage,

            timeToImpactMs: 12000,
            initialTimeToImpactMs: 12000,
        });

        engine.step(1000);

        expect(engine.drainEvents()).toEqual([]);

        expect(projectile.timeToImpactMs).toBe(11000);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);

        expect(launcher.phaseElapsedMs).toBe(1000);

        engine.step(projectile.timeToImpactMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    id: 'projectile_1',
                    designation: 'M1',

                    kind: COMBAT_PROJECTILE_KIND.MISSILE,

                    source: {
                        kind: COMBAT_SOURCE_KIND.ACTOR,
                        actorId: enemy.id,
                    },

                    sourceWeaponId: launcher.id,

                    target: {
                        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
                    },

                    timeToImpactMs: 0,
                    initialTimeToImpactMs: 12000,
                },

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(
            engine.getPlayerHullState(),
        ).toEqual({
            hull: 2,
            maxHull: 3,
        });

        expect(state.combat.projectiles).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);

        expect(launcher.phaseElapsedMs).toBe(projectile.initialTimeToImpactMs);

        const remainingCooldownMs = loadedLauncherDefinition.cooldownDurationMs - launcher.phaseElapsedMs;

        expect(remainingCooldownMs).toBe(3000);

        engine.step(remainingCooldownMs);

        expect(engine.drainEvents()).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.READY);

        expect(launcher.phaseElapsedMs).toBe(0);
        expect(launcher.ammoCount).toBe(0);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.READY);
    });

    it('runs an enemy beamCannon through universal targeting, charging, fire and cooldown', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BEAM_CANNON_00,

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
            random: () => 0.5,
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ` + `${loadedEvent.type}`);
        }

        const state = getMutableEncounterStateForTest(engine);
        const enemy = state.actors[0];
        const beamCannon = enemy.weapons[0];

        if (beamCannon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error('Expected loaded enemy beamCannon');
        }

        const beamCannonDefinition = SHIP_WEAPONS[beamCannon.weaponId];

        if (beamCannonDefinition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error('Expected beamCannon weapon definition');
        }

        expect(state.combat.projectiles).toEqual([]);
        expect(state.combat.beamCannonAttacks).toEqual([]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.READY);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: beamCannon.id,
            },
        ]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.TARGETING);
        expect(beamCannon.phaseElapsedMs).toBe(1);

        // Во время универсального targeting ещё нет
        // видимой L# charging threat.
        expect(engine.getBeamCannonAttacks()).toEqual([]);

        const firstAttack = {
            id: 'beam_cannon_attack_1',
            designation: 'L1',

            sourceActorId: enemy.id,
            sourceWeaponId: beamCannon.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

        };

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - beamCannon.phaseElapsedMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED,

                attack: firstAttack,
            },
        ]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.CHARGING);
        expect(beamCannon.phaseElapsedMs).toBe(0);

        expect(engine.getBeamCannonAttacks()).toEqual([firstAttack]);

        engine.step(beamCannonDefinition.chargeDurationMs - 1);

        expect(engine.drainEvents()).toEqual([]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.CHARGING);
        expect(beamCannon.phaseElapsedMs).toBe(beamCannonDefinition.chargeDurationMs - 1);

        expect(engine.getBeamCannonAttacks()).toEqual([firstAttack]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,

                attack: firstAttack,

                outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
                appliedDamage: beamCannonDefinition.damage,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(engine.getBeamCannonAttacks()).toEqual([]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);
        expect(beamCannon.phaseElapsedMs).toBe(0);

        engine.step(beamCannonDefinition.cooldownDurationMs - 1);

        expect(engine.drainEvents()).toEqual([]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);
        expect(beamCannon.phaseElapsedMs).toBe(beamCannonDefinition.cooldownDurationMs - 1);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.READY);
        expect(beamCannon.phaseElapsedMs).toBe(0);

        enemy.decision
            .decisionTickRemainingMs = 0;

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: beamCannon.id,
            },
        ]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.TARGETING);
        expect(beamCannon.phaseElapsedMs).toBe(1);

        expect(engine.getBeamCannonAttacks()).toEqual([]);

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS - beamCannon.phaseElapsedMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED,

                attack: {
                    ...firstAttack,

                    id: 'beam_cannon_attack_2',
                    designation: 'L2',
                },
            },
        ]);

        expect(beamCannon.phase).toBe(SHIP_WEAPON_PHASE.CHARGING);
        expect(beamCannon.phaseElapsedMs).toBe(0);
    });
});
