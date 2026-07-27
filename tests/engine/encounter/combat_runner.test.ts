// tests/engine/encounter/combat_runner.test.ts

import { describe, expect, it } from 'vitest';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { MISSILE_GUIDANCE_KIND, MISSILE_ID } from '../../../src/engine/defs/missile';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import { SPACE_NODE_ACTOR_KIND } from '../../../src/engine/defs/universe';
import { COMBAT_PROJECTILE_KIND } from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('CombatRunner', () => {
    it('prepares an enemy launcher, launches a missile and starts cooldown', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        node.actors.push({
            id: 'ship_enemy_00',
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: ENCOUNTER_TEAM.ENEMY,

            shipId: SHIP_ID.GENERIC_00,
            anchorId: stationId,

            weapons: [
                {
                    id: 'missile_launcher_00',
                    kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                    firmwareGuidanceKind: MISSILE_GUIDANCE_KIND.HEAT,
                    loadedMissileId: MISSILE_ID.HEAT_00,

                    ammoCount: 5,
                    ammoCapacity: 5,

                    phase: SHIP_WEAPON_PHASE.READY,
                    phaseElapsedMs: 0,

                    preparationDurationMs: 2000,
                    cooldownDurationMs: 3000,
                },
            ],
        });

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ${loadedEvent.type}`);
        }

        const enemy = loadedEvent.state.actors[0];
        const launcher = enemy.weapons[0];

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

        engine.step(launcher.preparationDurationMs - launcher.phaseElapsedMs);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

                projectile: {
                    id: 'projectile_1',

                    kind: COMBAT_PROJECTILE_KIND.MISSILE,

                    sourceActorId: enemy.id,
                    sourceWeaponId: launcher.id,

                    missileId: MISSILE_ID.HEAT_00,

                    timeToImpactMs: 4000,
                    initialTimeToImpactMs: 4000,
                },
            },
        ]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);
        expect(launcher.phaseElapsedMs).toBe(0);
        expect(launcher.ammoCount).toBe(4);

        expect(loadedEvent.state.combat.projectiles).toEqual([
            {
                id: 'projectile_1',

                kind: COMBAT_PROJECTILE_KIND.MISSILE,

                sourceActorId: enemy.id,
                sourceWeaponId: launcher.id,

                missileId: MISSILE_ID.HEAT_00,

                timeToImpactMs: 4000,
                initialTimeToImpactMs: 4000,
            },
        ]);

        engine.step(launcher.cooldownDurationMs);

        expect(engine.drainEvents()).toEqual([]);

        expect(launcher.phase).toBe(SHIP_WEAPON_PHASE.READY);
        expect(launcher.phaseElapsedMs).toBe(0);
        expect(launcher.ammoCount).toBe(4);
    });
});
