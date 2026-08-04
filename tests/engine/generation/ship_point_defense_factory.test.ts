import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import ShipPointDefenseFactory from '../../../src/engine/generation/ship_system/ShipPointDefenseFactory';

describe('ShipPointDefenseFactory', () => {
    it('creates fresh ready installed state from the definition', () => {
        const first =
            ShipPointDefenseFactory.create({
                id: 'point_defense_00',

                pointDefenseId:
                    POINT_DEFENSE_ID.BASIC_00,
            });

        const second =
            ShipPointDefenseFactory.create({
                id: 'point_defense_00',

                pointDefenseId:
                    POINT_DEFENSE_ID.BASIC_00,
            });

        expect(first).toEqual({
            id: 'point_defense_00',

            pointDefenseId:
                POINT_DEFENSE_ID.BASIC_00,

            charges: 3,
            maxCharges: 3,

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        });

        expect(first).not.toBe(second);

        first.charges = 0;

        expect(second.charges).toBe(3);
    });

    it('rejects an invalid charge override', () => {
        expect(() => {
            ShipPointDefenseFactory.create({
                id: 'point_defense_00',

                pointDefenseId:
                    POINT_DEFENSE_ID.BASIC_00,

                charges: 4,
            });
        }).toThrow(
            'Invalid ship point-defense charge count: 4/3',
        );
    });
});
