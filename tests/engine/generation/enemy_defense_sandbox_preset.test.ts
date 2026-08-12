import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('Enemy defense sandbox preset', () => {
    it('creates a fully crewed defensive enemy with one sticky-mine dispenser', () => {
        const actor =
            ShipNodeActorFactory.create({
                id:
                    'ship_enemy_defense_sandbox_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_DEFENSE_SANDBOX_00,

                anchorId: 'anchor_00',
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

                loadedMineId:
                    STICKY_MINE_ID.BASIC_00,

                ammoCount: 6,

                phase:
                    SHIP_WEAPON_PHASE.READY,
                phaseElapsedMs: 0,

                dispensedMineCount: 0,
            },
        ]);

        expect(actor.pointDefense).toEqual({
            id: 'point_defense_00',

            pointDefenseId:
                POINT_DEFENSE_ID.BASIC_00,

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        });

        expect(
            actor.defenseCapacitor,
        ).toEqual({
            id:
                'defense_capacitor_00',

            defenseCapacitorId:
                DEFENSE_CAPACITOR_ID
                    .BASIC_00,

            charges: 4,
            rechargeElapsedMs: 0,
        });

        expect(actor.crewRoles).toEqual([
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ]);
    });
});
