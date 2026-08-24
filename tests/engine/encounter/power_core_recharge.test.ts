// tests/engine/encounter/power_core_recharge.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POWER_CORES,
} from '../../../src/engine/content/catalogs/power_cores';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    spendPowerCoreCharge,
} from '../../../src/engine/encounter/combat/power_core/spend_power_core_charge';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'Defense powerCore recharge',
    () => {
        it(
            'spending a charge preserves recharge progress',
            () => {
                const {
                    state,
                } =
                    createAnchoredPlayerCombatTestSetup();

                const powerCore =
                    state.combat
                        .powerCore;

                if (!powerCore) {
                    throw new Error(
                        'Expected installed player power core',
                    );
                }

                powerCore.charges = 3;
                powerCore.rechargeElapsedMs = 12000;

                expect(
                    spendPowerCoreCharge(
                        powerCore,
                    ),
                ).toMatchObject({
                    charges: 2,
                    rechargeElapsedMs: 12000,
                });

                expect(
                    powerCore,
                ).toMatchObject({
                    charges: 2,
                    rechargeElapsedMs: 12000,
                });
            },
        );

        it(
            'recharges player and enemy installations sequentially',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                const playerPowerCore =
                    state.combat
                        .powerCore;

                const enemyPowerCore =
                    targetActor
                        .powerCore;

                if (
                    !playerPowerCore ||
                    !enemyPowerCore
                ) {
                    throw new Error(
                        'Expected installed power cores',
                    );
                }

                const definition =
                    POWER_CORES[
                        POWER_CORE_ID
                            .BASIC_00
                    ];

                playerPowerCore.charges = 2;
                playerPowerCore.rechargeElapsedMs = 0;

                enemyPowerCore.charges = 1;
                enemyPowerCore.rechargeElapsedMs = 0;

                engine.step(
                    definition
                        .rechargeDurationMs -
                        1,
                );

                expect(
                    playerPowerCore,
                ).toMatchObject({
                    charges: 2,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                expect(
                    enemyPowerCore,
                ).toMatchObject({
                    charges: 1,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                engine.step(1);

                expect(
                    playerPowerCore,
                ).toMatchObject({
                    charges: 3,
                    rechargeElapsedMs: 0,
                });

                expect(
                    enemyPowerCore,
                ).toMatchObject({
                    charges: 2,
                    rechargeElapsedMs: 0,
                });

                engine.step(
                    definition
                        .rechargeDurationMs *
                        3 +
                        500,
                );

                expect(
                    playerPowerCore,
                ).toMatchObject({
                    charges:
                        definition.capacity,

                    rechargeElapsedMs: 0,
                });

                expect(
                    enemyPowerCore,
                ).toMatchObject({
                    charges:
                        definition.capacity,

                    rechargeElapsedMs: 0,
                });
            },
        );
    },
);
