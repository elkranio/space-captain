// tests/engine/StickyMineDispenserPreset.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    STICKY_MINE_DISPENSER_PRESET_ID,
} from '../../src/engine/content/presets/sticky_mine_dispensers';
import {
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import StickyMineDispenserFactory from '../../src/engine/generation/ship_weapon/StickyMineDispenserFactory';

describe('Sticky-mine dispenser preset', () => {
    it('creates a fresh fully loaded dispenser', () => {
        const first =
            StickyMineDispenserFactory.create({
                id: 'dispenser_00',

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,
            });

        const second =
            StickyMineDispenserFactory.create({
                id: 'dispenser_01',

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,
            });

        expect(first).toEqual({
            id: 'dispenser_00',

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
        });

        expect(first).not.toBe(second);
    });

    it('rejects an invalid ammunition override', () => {
        expect(() => {
            StickyMineDispenserFactory.create({
                id: 'dispenser_invalid',

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,

                ammoCount: 7,
            });
        }).toThrow(
            'Invalid sticky-mine dispenser ammo count: 7/6',
        );
    });
});
