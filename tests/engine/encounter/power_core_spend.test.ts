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
} from '../../../src/engine/encounter/combat/defense/spend_power_core_charge';

describe(
    'Power Core spending',
    () => {
        it(
            'spends multiple charges atomically and restarts sequential recharge',
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
                    rechargeElapsedMs: 0,
                });

                expect(powerCore).toEqual({
                    id: 'power_core_test',
                    powerCoreId:
                        'power_core_test_definition',
                    charges: 2,
                    rechargeElapsedMs: 0,
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
            'keeps the existing one-charge helper semantics',
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
                    rechargeElapsedMs: 0,
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
