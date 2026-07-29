// tests/engine/encounter/combat_runner.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { MISSILE_ID } from '../../../src/engine/defs/missile';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';

describe('CombatRunner', () => {
    it('runs an enemy missile launcher through preparation, flight, impact and cooldown', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: stationId,
        });

        // Тесту нужен ровно один выстрел.
        nodeEnemy.weapons[0].ammoCount = 1;

        node.actors.push(nodeEnemy);

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
            pointDefense: createPointDefenseFixture(),
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ` + `${loadedEvent.type}`);
        }

        const enemy = loadedEvent.state.actors[0];

        const launcher = enemy.weapons[0];

        const loadedLauncherDefinition = SHIP_WEAPONS[launcher.weaponId];

        expect(loadedEvent.state.combat.projectiles).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.READY);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: enemy.id,
                sourceWeaponId: launcher.id,
            },
        ]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.PREPARING);

        expect(launcher.phaseElapsedMs).toBe(1);

        engine.step(loadedLauncherDefinition.preparationDurationMs - launcher.phaseElapsedMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

                projectile: {
                    id: 'projectile_1',
                    designation: 'M1',

                    kind: COMBAT_PROJECTILE_KIND.MISSILE,

                    sourceActorId: enemy.id,
                    sourceWeaponId: launcher.id,

                    target: {
                        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
                    },

                    identification: {
                        status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
                    },

                    missileId: MISSILE_ID.RED_00,

                    timeToImpactMs: 12000,
                    initialTimeToImpactMs: 12000,
                },
            },
        ]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);

        expect(launcher.phaseElapsedMs).toBe(0);
        expect(launcher.ammoCount).toBe(0);

        const [projectile] = loadedEvent.state.combat.projectiles;

        expect(projectile).toEqual({
            id: 'projectile_1',
            designation: 'M1',

            kind: COMBAT_PROJECTILE_KIND.MISSILE,

            sourceActorId: enemy.id,
            sourceWeaponId: launcher.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },

            missileId: MISSILE_ID.RED_00,

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

                    sourceActorId: enemy.id,
                    sourceWeaponId: launcher.id,

                    target: {
                        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
                    },

                    identification: {
                        status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
                    },

                    missileId: MISSILE_ID.RED_00,

                    timeToImpactMs: 0,
                    initialTimeToImpactMs: 12000,
                },

                damage: 1,
            },
        ]);

        expect(loadedEvent.state.combat.projectiles).toEqual([]);

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
});
