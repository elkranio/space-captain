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
import { advancePowerCore } from '../../../src/engine/encounter/combat/power_core/PowerCoreRunner';

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

                const definition =
                    POWER_CORES[
                        POWER_CORE_ID.BASIC_00
                    ];
                const startingCharges =
                    Math.min(3, definition.capacity);
                const rechargeElapsedMs =
                    startingCharges === definition.capacity
                        ? 0
                        : Math.floor(definition.rechargeDurationMs / 2);

                powerCore.charges =
                    startingCharges;
                powerCore.rechargeElapsedMs =
                    rechargeElapsedMs;

                expect(
                    spendPowerCoreCharge(
                        powerCore,
                    ),
                ).toMatchObject({
                    charges:
                        startingCharges - 1,
                    rechargeElapsedMs,
                });

                expect(
                    powerCore,
                ).toMatchObject({
                    charges:
                        startingCharges - 1,
                    rechargeElapsedMs,
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

                playerPowerCore.charges = 0;
                playerPowerCore.rechargeElapsedMs = 0;

                enemyPowerCore.charges = 0;
                enemyPowerCore.rechargeElapsedMs = 0;

                engine.step(
                    definition
                        .rechargeDurationMs -
                        1,
                );

                expect(
                    playerPowerCore,
                ).toMatchObject({
                    charges: 0,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                expect(
                    enemyPowerCore,
                ).toMatchObject({
                    charges: 0,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                engine.step(1);

                expect(
                    playerPowerCore,
                ).toMatchObject({
                    charges: 1,
                    rechargeElapsedMs: 0,
                });

                expect(
                    enemyPowerCore,
                ).toMatchObject({
                    charges: 1,
                    rechargeElapsedMs: 0,
                });

                engine.step(
                    definition
                        .rechargeDurationMs *
                        (definition.capacity - 1),
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

        it('fills an already installed zero-duration core without retaining progress', () => {
            // This tests recharge physics, independently of PowerCoreFactory's input validation.
            const id = 'power_core_zero_duration_test';
            POWER_CORES[id] = {
                ...POWER_CORES[POWER_CORE_ID.BASIC_00],
                id,
                capacity: 3,
                rechargeDurationMs: 0,
            };
            try {
                const core = { id: 'installed_core', powerCoreId: id, charges: 0, rechargeElapsedMs: 0 };
                advancePowerCore(core, 0);
                expect(core).toEqual({ id: 'installed_core', powerCoreId: id, charges: 3, rechargeElapsedMs: 0 });
            } finally {
                delete POWER_CORES[id];
            }
        });
    },
);
