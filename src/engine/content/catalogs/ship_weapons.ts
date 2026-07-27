// src/engine/content/catalogs/ship_weapons.ts

import { MISSILE_GUIDANCE_KIND } from '../../defs/missile';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, type ShipWeaponDefinition, type ShipWeaponId } from '../../defs/ship_weapon';

export const SHIP_WEAPONS = {
    [SHIP_WEAPON_ID.HEAT_MISSILE_LAUNCHER_00]: {
        id: SHIP_WEAPON_ID.HEAT_MISSILE_LAUNCHER_00,

        name: 'HEAT MISSILE LAUNCHER',

        kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

        firmwareGuidanceKind: MISSILE_GUIDANCE_KIND.HEAT,

        ammoCapacity: 5,

        preparationDurationMs: 3000,
        cooldownDurationMs: 15000,
    },
} satisfies Record<ShipWeaponId, ShipWeaponDefinition>;
