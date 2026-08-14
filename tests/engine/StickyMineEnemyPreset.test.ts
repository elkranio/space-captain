// tests/engine/StickyMineEnemyPreset.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../src/engine/content/presets/ship_node_actors';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import ShipNodeActorFactory from '../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('Sticky-mine enemy preset', () => {
    it('creates one ready fully loaded sticky-mine dispenser', () => {
        const actor =
            ShipNodeActorFactory.create({
                id: 'enemy_sticky_mines',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_STICKY_MINES_00,

                anchorId: 'navigation_beacon',
            });

        expect(actor.weapons).toEqual([
            {
                id:
                    'sticky_mine_dispenser_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,


                ammoCount: 6,

                phase:
                    SHIP_WEAPON_PHASE.READY,
                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },
        ]);
    });
});
