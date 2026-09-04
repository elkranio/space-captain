import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { describe, expect, it } from 'vitest';
import { POWER_CORES } from '../../../src/engine/content/catalogs/power_cores';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { POWER_CORE_ID } from '../../../src/engine/defs/power_core';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { DEFENSE_TURRET_ID, DEFENSE_TURRET_PHASE } from '../../../src/engine/defs/defense_turret';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('Enemy defense sandbox preset', () => {
    it('creates a fully crewed defense sandbox with one missile launcher', () => {
        const actor = ShipNodeActorFactory.create({
            id: 'ship_enemy_defense_sandbox_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_DEFENSE_SANDBOX_00,

            anchorId: 'anchor_00',
        });

        expect(actor.weapons).toEqual([
            {
                id: 'missile_launcher_00',

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

                kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

                ammoCount: SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00].ammoCapacity,

                phase: SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,
                cooldownRemainingMs: 0,
            },
        ]);

        expect(actor.defenseTurret).toEqual({
            id: 'defense_turret_00',

            defenseTurretId: DEFENSE_TURRET_ID.BASIC_00,

            phase: DEFENSE_TURRET_PHASE.READY,
            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,

            targetProjectileId: null,
        });

        expect(actor.powerCore).toEqual({
            id: 'power_core_00',

            powerCoreId: POWER_CORE_ID.BASIC_00,

            charges: POWER_CORES[POWER_CORE_ID.BASIC_00].capacity,
            rechargeElapsedMs: 0,
        });

        expect(actor.shieldGenerator).toEqual({
            id: 'shield_generator_00',

            shieldGeneratorId: SHIELD_GENERATOR_ID.BASIC_00,

            status: SHIELD_GENERATOR_STATUS.ONLINE,

            phase: SHIELD_GENERATOR_PHASE.READY,

            phaseElapsedMs: 0,
        });

        expect(actor.crewRoles).toEqual([
            OFFICER_ROLE.SCIENTIST,
            OFFICER_ROLE.PILOT,
            OFFICER_ROLE.GUNNER,
            OFFICER_ROLE.ENGINEER,
        ]);
    });
});
