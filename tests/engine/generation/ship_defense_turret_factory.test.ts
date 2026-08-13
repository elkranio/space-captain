import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import ShipDefenseTurretFactory from '../../../src/engine/generation/ship_system/ShipDefenseTurretFactory';

describe('ShipDefenseTurretFactory', () => {
    it('creates fresh ready installed state from the definition', () => {
        const first =
            ShipDefenseTurretFactory.create({
                id: 'defense_turret_00',

                defenseTurretId:
                    DEFENSE_TURRET_ID.BASIC_00,
            });

        const second =
            ShipDefenseTurretFactory.create({
                id: 'defense_turret_00',

                defenseTurretId:
                    DEFENSE_TURRET_ID.BASIC_00,
            });

        expect(first).toEqual({
            id: 'defense_turret_00',

            defenseTurretId:
                DEFENSE_TURRET_ID.BASIC_00,

            phase:
                DEFENSE_TURRET_PHASE.READY,
            phaseElapsedMs: 0,

            targetProjectileId: null,
        });

        expect(first).not.toBe(second);

        first.phase =
            DEFENSE_TURRET_PHASE.COOLDOWN;

        expect(second.phase).toBe(
            DEFENSE_TURRET_PHASE.READY,
        );

        expect(first)
            .not.toHaveProperty('charges');

        expect(first)
            .not.toHaveProperty('maxCharges');
    });
});
