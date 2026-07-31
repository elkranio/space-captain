// tests/engine/StickyMineModel.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../src/engine/defs/ship_weapon';
import type {
    StickyMineState,
} from '../../src/engine/encounter/model/combat';

describe('Sticky mine model', () => {
    it('defines the initial sticky-mine burst tuning', () => {
        const definition =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00
            ];

        expect(definition).toMatchObject({
            name: 'STICKY MINE DISPENSER',

            kind:
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER,

            burstSize: 6,
            launchIntervalMs: 2000,

            fuseDurationMs: 7500,
            damage: 1,

            cooldownDurationMs: 15000,
        });
    });

    it('keeps dispenser progress and attached mine state explicit', () => {
        const dispenser: StickyMineDispenserState = {
            id: 'enemy_sticky_mine_dispenser',

            weaponId:
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00,

            kind:
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,

            dispensedMineCount: 0,
        };

        const mine: StickyMineState = {
            id: 'sticky_mine_1',

            sourceActorId: 'enemy_ship',
            sourceWeaponId: dispenser.id,

            timeToDetonationMs: 7500,
            initialTimeToDetonationMs: 7500,

            damage: 1,
        };

        expect(dispenser.dispensedMineCount).toBe(0);
        expect(mine.timeToDetonationMs).toBe(7500);
        expect(mine.damage).toBe(1);
    });
});
