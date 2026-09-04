// tests/engine/generation/missile_launcher_factory.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import MissileLauncherFactory from '../../../src/engine/generation/ship_weapon/MissileLauncherFactory';

describe('MissileLauncherFactory', () => {
    it('creates fresh launcher state directly from weapon content', () => {
        const definition = SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00];

        const first = MissileLauncherFactory.create({
            id: 'launcher_test_00',

            weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
        });

        const second = MissileLauncherFactory.create({
            id: 'launcher_test_01',

            weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,
        });

        expect(first).toEqual({
            id: 'launcher_test_00',

            weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

            kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

            ammoCount: definition.ammoCapacity,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,
        });

        expect(first).not.toBe(second);

        first.ammoCount = 0;
        first.phase = SHIP_WEAPON_PHASE.COOLDOWN;

        expect(second.ammoCount).toBe(definition.ammoCapacity);
        expect(second.phase).toBe(SHIP_WEAPON_PHASE.READY);
    });

    it('supports a bounded initial ammo override', () => {
        const capacity = SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00].ammoCapacity;
        const initialAmmo = Math.floor(capacity / 2);
        const launcher = MissileLauncherFactory.create({
            id: 'launcher_test_00',

            weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

            ammoCount: initialAmmo,
        });

        expect(launcher.ammoCount).toBe(initialAmmo);

        expect(() => {
            MissileLauncherFactory.create({
                id: 'launcher_invalid',

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

                ammoCount: capacity + 1,
            });
        }).toThrow(`Invalid missile launcher ammo count: ${capacity + 1}/${capacity}`);
    });
});
