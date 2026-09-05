import missileData from '../../../src/engine/content/data/missile_launchers.json';
import beamData from '../../../src/engine/content/data/beam_cannons.json';
import spamData from '../../../src/engine/content/data/spam_projectors.json';
import mineData from '../../../src/engine/content/data/sticky_mine_dispensers.json';
import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import {
    BEAM_CANNON_TUNING_SCHEMA,
    MISSILE_LAUNCHER_TUNING_SCHEMA,
    SPAM_PROJECTOR_TUNING_SCHEMA,
    STICKY_MINE_DISPENSER_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import { SHIP_SLOT_KIND } from '../../../src/engine/defs/ship_slot';

describe('Weapon content tuning', () => {
    it('loads every built-in weapon family into the unified catalog', () => {
        const families = [
            [missileData, SHIP_WEAPON_KIND.MISSILE_LAUNCHER, SHIP_SLOT_KIND.WEAPON],
            [beamData, SHIP_WEAPON_KIND.BEAM_CANNON, SHIP_SLOT_KIND.WEAPON],
            [spamData, SHIP_WEAPON_KIND.SPAM_PROJECTOR, SHIP_SLOT_KIND.UTILITY],
            [mineData, SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER, SHIP_SLOT_KIND.WEAPON],
        ] as const;
        for (const [data, kind, slotKind] of families) {
            for (const [id, tuning] of Object.entries(data)) {
                expect(SHIP_WEAPONS[id]).toEqual({ id, kind, slotKind, ...tuning });
            }
        }
    });

    it('accepts new weapon ids inside their concrete family schema', () => {
        expect(
            MISSILE_LAUNCHER_TUNING_SCHEMA.safeParse({
                heavy_launcher_00: {
                    name: 'HEAVY LAUNCHER',
                    shortName: 'HEAVY LAUNCHER',

                    maxIntegrity: 3,

                    damage: 2,
                    flightDurationMs: 14000,
                    ammoCapacity: 3,
                    cooldownDurationMs: 18000,
                },
            }).success,
        ).toBe(true);

        expect(
            BEAM_CANNON_TUNING_SCHEMA.safeParse({
                fast_beam_cannon_00: {
                    name: 'FAST BEAM_CANNON',
                    shortName: 'FAST BEAM',

                    maxIntegrity: 2,

                    hullDamage: 1,
                    moduleDamage: 1,
                    powerCost: 1,
                    chargeDurationMs: 8000,
                    cooldownDurationMs: 12000,
                },
            }).success,
        ).toBe(true);

        expect(
            SPAM_PROJECTOR_TUNING_SCHEMA.safeParse({
                spam_projector_01: {
                    name: 'SPAM PROJECTOR II',
                    shortName: 'SPAM PROJECTOR',

                    maxIntegrity: 2,

                    channelDurationMs: 24000,

                    officerTaskProgressMultiplier: 0.4,

                    cooldownDurationMs: 18000,
                },
            }).success,
        ).toBe(true);

        expect(
            STICKY_MINE_DISPENSER_TUNING_SCHEMA.safeParse({
                mine_dispenser_01: {
                    name: 'MINE DISPENSER II',
                    shortName: 'MINE DISPENSER',

                    maxIntegrity: 4,

                    damage: 2,
                    fuseDurationMs: 9000,
                    ammoCapacity: 4,
                    cooldownDurationMs: 17000,
                },
            }).success,
        ).toBe(true);
    });

    it('rejects invalid family tuning', () => {
        const missile = { ...missileData.missile_launcher_00, damage: -1 };
        const result = MISSILE_LAUNCHER_TUNING_SCHEMA.safeParse({ invalid: missile });
        expect(result.error?.issues.map((issue) => issue.path)).toEqual([['invalid', 'damage']]);
        const mine = { ...mineData.sticky_mine_dispenser_00, ammoCapacity: -1 };
        const mineResult = STICKY_MINE_DISPENSER_TUNING_SCHEMA.safeParse({ invalid: mine });
        expect(mineResult.error?.issues.map((issue) => issue.path)).toEqual([['invalid', 'ammoCapacity']]);
    });
});
