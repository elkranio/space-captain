// tests/engine/generation/ship_node_actor_factory.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { MISSILE_ID } from '../../../src/engine/defs/missile';
import { SHIP_ID } from '../../../src/engine/defs/ship';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import { SPACE_NODE_ACTOR_KIND } from '../../../src/engine/defs/universe';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('ShipNodeActorFactory', () => {
    it('creates fresh enemy ship state from content preset', () => {
        const first = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: 'beacon_test',
        });

        const second = ShipNodeActorFactory.create({
            id: 'ship_enemy_01',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: 'station_test',
        });

        expect(first).toEqual({
            id: 'ship_enemy_00',
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: ENCOUNTER_TEAM.ENEMY,

            shipId: SHIP_ID.GENERIC_00,
            anchorId: 'beacon_test',

            weapons: [
                {
                    id: 'missile_launcher_00',

                    weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

                    kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                    loadedMissileId: MISSILE_ID.RED_00,

                    ammoCount: 5,

                    phase: SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },
            ],
        });

        expect(first).not.toBe(second);
        expect(first.weapons).not.toBe(second.weapons);

        expect(first.weapons[0]).not.toBe(second.weapons[0]);

        first.weapons[0].ammoCount = 0;

        first.weapons[0].phase = SHIP_WEAPON_PHASE.COOLDOWN;

        expect(second.weapons[0].ammoCount).toBe(5);

        expect(second.weapons[0].phase).toBe(SHIP_WEAPON_PHASE.READY);
    });
});
