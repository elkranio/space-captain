// tests/engine/generation/missile_launcher_factory.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { MISSILE_LAUNCHER_PRESET_ID } from '../../../src/engine/content/presets/missile_launchers';
import { MISSILE_ID } from '../../../src/engine/defs/missile';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import MissileLauncherFactory from '../../../src/engine/generation/ship_weapon/MissileLauncherFactory';

describe('MissileLauncherFactory', () => {
    it('creates fresh basic red launcher state from content', () => {
        const definition = SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00];

        // Отдельно фиксируем текущий content balance,
        // чтобы поведенческие тесты не подстроились
        // молча под случайное изменение значений.
        expect(definition).toEqual({
            id: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

            name: 'MISSILE LAUNCHER',

            kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

            ammoCapacity: 5,

            cooldownDurationMs: 15000,
        });

        const first = MissileLauncherFactory.create({
            id: 'launcher_test_00',

            presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,
        });

        const second = MissileLauncherFactory.create({
            id: 'launcher_test_01',

            presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,
        });

        expect(first).toEqual({
            id: 'launcher_test_00',

            weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

            kind: SHIP_WEAPON_KIND.MISSILE_LAUNCHER,

            loadedMissileId: MISSILE_ID.BASIC_00,

            ammoCount: 5,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
        });

        expect(first).not.toBe(second);

        first.ammoCount = 0;
        first.phase = SHIP_WEAPON_PHASE.COOLDOWN;

        expect(second.ammoCount).toBe(5);
        expect(second.phase).toBe(SHIP_WEAPON_PHASE.READY);
    });

    it('supports a bounded initial ammo override', () => {
        const launcher = MissileLauncherFactory.create({
            id: 'launcher_test_00',

            presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,

            ammoCount: 1,
        });

        expect(launcher.ammoCount).toBe(1);

        expect(() => {
            MissileLauncherFactory.create({
                id: 'launcher_invalid',

                presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,

                ammoCount: 6,
            });
        }).toThrow('Invalid missile launcher ammo count: 6/5');
    });
});
