import {
    describe,
    expect,
    it,
} from 'vitest';
import type {
    PowerCoreState,
} from '../../../src/engine/defs/power_core';
import {
    spendPowerCoreCharge,
    spendPowerCoreCharges,
} from '../../../src/engine/encounter/combat/power_core/spend_power_core_charge';

describe(
    'Power Core spending',
    () => {
        it(
            'spends multiple charges atomically and preserves sequential recharge progress',
            () => {
                const powerCore =
                    createPowerCore({
                        charges: 4,
                        rechargeElapsedMs:
                            700,
                    });

                expect(
                    spendPowerCoreCharges(
                        powerCore,
                        2,
                    ),
                ).toEqual({
                    ...powerCore,
                    charges: 2,
                    rechargeElapsedMs: 700,
                });

                expect(powerCore).toEqual({
                    id: 'power_core_test',
                    powerCoreId:
                        'power_core_test_definition',
                    charges: 2,
                    rechargeElapsedMs: 700,
                });
            },
        );

        it(
            'does not partially spend when the requested amount is unavailable',
            () => {
                const powerCore =
                    createPowerCore({
                        charges: 1,
                        rechargeElapsedMs:
                            500,
                    });

                expect(() => {
                    spendPowerCoreCharges(
                        powerCore,
                        2,
                    );
                }).toThrow(
                    'Cannot spend defense-powerCore charges: power_core_test/1/2',
                );

                expect(powerCore).toEqual({
                    id: 'power_core_test',
                    powerCoreId:
                        'power_core_test_definition',
                    charges: 1,
                    rechargeElapsedMs: 500,
                });
            },
        );

        it.each([
            0,
            -1,
            1.5,
            Number.NaN,
        ])(
            'rejects invalid spend count %s without mutation',
            (count) => {
                const powerCore =
                    createPowerCore({
                        charges: 4,
                        rechargeElapsedMs:
                            200,
                    });

                expect(() => {
                    spendPowerCoreCharges(
                        powerCore,
                        count,
                    );
                }).toThrow(
                    'Power Core spend count must be a positive integer',
                );

                expect(powerCore).toEqual({
                    id: 'power_core_test',
                    powerCoreId:
                        'power_core_test_definition',
                    charges: 4,
                    rechargeElapsedMs: 200,
                });
            },
        );

        it(
            'preserves recharge progress through the one-charge helper',
            () => {
                const powerCore =
                    createPowerCore({
                        charges: 2,
                        rechargeElapsedMs:
                            300,
                    });

                spendPowerCoreCharge(
                    powerCore,
                );

                expect(powerCore).toEqual({
                    id: 'power_core_test',
                    powerCoreId:
                        'power_core_test_definition',
                    charges: 1,
                    rechargeElapsedMs: 300,
                });
            },
        );
    },
);

function createPowerCore(
    overrides: Partial<PowerCoreState> =
        {},
): PowerCoreState {
    return {
        id: 'power_core_test',
        powerCoreId:
            'power_core_test_definition',
        charges: 4,
        rechargeElapsedMs: 0,
        ...overrides,
    };
}
