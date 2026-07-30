// src/engine/content/catalogs/ship_weapons.ts

import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, type ShipWeaponDefinition, type ShipWeaponId } from '../../defs/ship_weapon';

// Любое enemy weapon сначала проходит одинаковый targeting.
// Это не даёт определить тип атаки по длительности warning lamp.
export const SHIP_WEAPON_TARGETING_DURATION_MS = 3000;

export const SHIP_WEAPONS = {
    [SHIP_WEAPON_ID.MISSILE_LAUNCHER_00]: {
        id: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

        name: 'MISSILE LAUNCHER',

        kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

        ammoCapacity: 5,

        cooldownDurationMs: 15000,
    },

    [SHIP_WEAPON_ID.LASER_00]: {
        id: SHIP_WEAPON_ID.LASER_00,

        name: 'LASER EMITTER',

        kind: SHIP_WEAPON_KIND.LASER,

        damage: 1,

        chargeDurationMs: 6000,
        cooldownDurationMs: 7000,
    },
} satisfies Record<ShipWeaponId, ShipWeaponDefinition>;
