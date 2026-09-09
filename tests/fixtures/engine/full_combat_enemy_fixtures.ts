// tests/fixtures/engine/full_combat_enemy_fixtures.ts

import type { ShipPreset } from '../../../src/engine/content/presets/ships';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { SHIP_CHASSIS_ID } from '../../../src/engine/defs/ship_chassis';
import { SHIP_DRIVE_ID } from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import type {
    ShipSpaceNodeActorState,
} from '../../../src/engine/defs/universe';
import ShipFactory from '../../../src/engine/generation/ship/ShipFactory';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createShipBehaviorFixture,
} from './ship_behavior_fixtures';

const FULL_COMBAT_ENEMY_SHIP_PRESET: ShipPreset = {
    id: 'test_full_combat_enemy',

    chassisId: SHIP_CHASSIS_ID.GENERIC_00,

    drive: {
        id: 'drive_00',
        slotId: 'drive',

        driveId: SHIP_DRIVE_ID.BASIC_00,
    },

    weapons: [
        {
            id: 'missile_launcher_00',
            slotId: 'weapon_01',

            kind:
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER,

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,
        },
        {
            id: 'beam_cannon_00',
            slotId: 'weapon_02',

            kind:
                SHIP_WEAPON_KIND
                    .BEAM_CANNON,

            weaponId:
                SHIP_WEAPON_ID
                    .BEAM_CANNON_00,
        },
        {
            id: 'spam_projector_00',
            slotId: 'utility_01',

            kind:
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR,

            weaponId:
                SHIP_WEAPON_ID
                    .SPAM_PROJECTOR_00,
        },
    ],
};

export function createFullCombatEnemyActorFixture(
    anchorId: string,
    id = 'ship_enemy_combat_00',
): ShipSpaceNodeActorState {
    return ShipNodeActorFactory.createFromShip({
        id,
        anchorId,

        team: ENCOUNTER_TEAM.ENEMY,

        ship:
            ShipFactory.createFromPreset(
                FULL_COMBAT_ENEMY_SHIP_PRESET,
            ),

        crewRoles: [
            OFFICER_ROLE.SCIENTIST,
            OFFICER_ROLE.PILOT,
            OFFICER_ROLE.GUNNER,
            OFFICER_ROLE.ENGINEER,
        ],

        behavior: createShipBehaviorFixture(),
    });
}
