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

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        });

        expect(first).not.toBe(second);

        first.phase =
            POINT_DEFENSE_PHASE.COOLDOWN;

        expect(second.phase).toBe(
            POINT_DEFENSE_PHASE.READY,
        );

        expect(first)
            .not.toHaveProperty('charges');

        expect(first)
            .not.toHaveProperty('maxCharges');
    });
});
