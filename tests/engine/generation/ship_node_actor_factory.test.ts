import { SHIP_CHASSIS } from '../../../src/engine/content/catalogs/ship_chassis';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import behaviorData from '../../../src/engine/content/data/ship_behaviors.json';
// tests/engine/generation/ship_node_actor_factory.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_PRESET_ID,
    type ShipPresetId,
} from '../../../src/engine/content/presets/ships';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { SHIP_CHASSIS_ID } from '../../../src/engine/defs/ship_chassis';
import { SHIP_DRIVE_ID } from '../../../src/engine/defs/ship_drive';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import { SPACE_NODE_ACTOR_KIND } from '../../../src/engine/defs/universe';
import ShipFactory from '../../../src/engine/generation/ship/ShipFactory';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

const STANDARD_CREW_ROLES = [OFFICER_ROLE.SCIENTIST, OFFICER_ROLE.PILOT, OFFICER_ROLE.GUNNER, OFFICER_ROLE.ENGINEER];

describe('ShipNodeActorFactory', () => {
    it('creates fresh enemy ship state from explicit ship input', () => {
        const first = createEnemyActor(
            'ship_enemy_00',
            'beacon_test',
            SHIP_PRESET_ID.GENERIC_MISSILE_00,
        );

        const second = createEnemyActor(
            'ship_enemy_01',
            'station_test',
            SHIP_PRESET_ID.GENERIC_MISSILE_00,
        );

        expect(first).toEqual({
            id: 'ship_enemy_00',
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: ENCOUNTER_TEAM.ENEMY,

            chassisId: SHIP_CHASSIS_ID.GENERIC_00,
            anchorId: 'beacon_test',

            hull: SHIP_CHASSIS[SHIP_CHASSIS_ID.GENERIC_00].maxHull,
            maxHull: SHIP_CHASSIS[SHIP_CHASSIS_ID.GENERIC_00].maxHull,

            mounts: [
                {
                    slotId: 'drive',
                    equipmentId: 'drive_00',
                },
                {
                    slotId: 'weapon_01',
                    equipmentId: 'missile_launcher_00',
                },
            ],

            drive: {
                id: 'drive_00',

                driveId: SHIP_DRIVE_ID.BASIC_00,
            },

            behavior: behaviorData.standard_combat_00,

            crewRoles: STANDARD_CREW_ROLES,

            weapons: [
                {
                    id: 'missile_launcher_00',

                    weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

                    kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                    ammoCount: SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00].ammoCapacity,

                    phase: SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                },
            ],
        });

        expect(first).not.toBe(second);

        expect(first.drive).not.toBe(second.drive);
        expect(first.behavior).not.toBe(second.behavior);
        expect(first.crewRoles).not.toBe(second.crewRoles);

        expect(first.mounts).not.toBe(second.mounts);

        expect(first.mounts[0]).not.toBe(second.mounts[0]);

        expect(first.weapons).not.toBe(second.weapons);

        const firstWeapon = first.weapons[0];
        const secondWeapon = second.weapons[0];

        expect(firstWeapon).not.toBe(secondWeapon);

        if (
            firstWeapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER ||
            secondWeapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER
        ) {
            throw new Error('Expected missile launcher weapons');
        }

        first.hull = 0;


        first.behavior.aggression = 0;

        first.crewRoles.length = 0;

        firstWeapon.ammoCount = 0;
        firstWeapon.phase = SHIP_WEAPON_PHASE.COOLDOWN;

        expect(second.hull).toBe(SHIP_CHASSIS[SHIP_CHASSIS_ID.GENERIC_00].maxHull);


        expect(second.behavior.aggression).toBe(behaviorData.standard_combat_00.aggression);

        expect(second.crewRoles).toEqual(STANDARD_CREW_ROLES);

        expect(secondWeapon.ammoCount).toBe(SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00].ammoCapacity);
        expect(secondWeapon.phase).toBe(SHIP_WEAPON_PHASE.READY);
    });

    it('creates a ship actor with a beamCannon weapon', () => {
        const actor = createEnemyActor(
            'ship_enemy_00',
            'station_00',
            SHIP_PRESET_ID.GENERIC_BEAM_CANNON_00,
        );

        expect(actor).toEqual({
            id: 'ship_enemy_00',
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: ENCOUNTER_TEAM.ENEMY,

            chassisId: SHIP_CHASSIS_ID.GENERIC_00,
            anchorId: 'station_00',

            hull: SHIP_CHASSIS[SHIP_CHASSIS_ID.GENERIC_00].maxHull,
            maxHull: SHIP_CHASSIS[SHIP_CHASSIS_ID.GENERIC_00].maxHull,

            mounts: [
                {
                    slotId: 'drive',
                    equipmentId: 'drive_00',
                },
                {
                    slotId: 'weapon_01',
                    equipmentId: 'beam_cannon_00',
                },
            ],

            drive: {
                id: 'drive_00',

                driveId: SHIP_DRIVE_ID.BASIC_00,
            },

            behavior: behaviorData.standard_combat_00,

            crewRoles: STANDARD_CREW_ROLES,

            weapons: [
                {
                    id: 'beam_cannon_00',

                    weaponId: SHIP_WEAPON_ID.BEAM_CANNON_00,

                    kind: SHIP_WEAPON_KIND.BEAM_CANNON,

                    phase: SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                },
            ],
        });
    });

    it('creates the full combat ship without activating it in an encounter', () => {
        const actor = createEnemyActor(
            'ship_enemy_combat_00',
            'station_00',
            SHIP_PRESET_ID.GENERIC_COMBAT_00,
        );

        expect(
            actor.weapons.map((weapon) => {
                return {
                    id: weapon.id,
                    kind: weapon.kind,
                };
            }),
        ).toEqual([
            {
                id: 'missile_launcher_00',
                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,
            },
            {
                id: 'beam_cannon_00',
                kind: SHIP_WEAPON_KIND.BEAM_CANNON,
            },
            {
                id: 'spam_projector_00',
                kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,
            },
        ]);
    });
});

function createEnemyActor(
    id: string,
    anchorId: string,
    shipPresetId: ShipPresetId,
) {
    return ShipNodeActorFactory.createFromShip({
        id,
        anchorId,

        team: ENCOUNTER_TEAM.ENEMY,

        ship: ShipFactory.create({
            presetId: shipPresetId,
        }),

        crewRoles: STANDARD_CREW_ROLES,

        behavior: behaviorData.standard_combat_00,
    });
}
