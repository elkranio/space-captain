import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('Enemy defense sandbox preset', () => {
    it('creates a fully crewed enemy without offensive weapons', () => {
        const actor =
            ShipNodeActorFactory.create({
                id:
                    'ship_enemy_defense_sandbox_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_DEFENSE_SANDBOX_00,

                anchorId: 'anchor_00',
            });

        expect(actor.weapons).toEqual([]);

        expect(actor.crewRoles).toEqual([
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ]);
    });
});
