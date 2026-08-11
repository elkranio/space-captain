// tests/engine/encounter/defense_capacitor_recharge.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_CAPACITORS,
} from '../../../src/engine/content/catalogs/defense_capacitors';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    spendDefenseCapacitorCharge,
} from '../../../src/engine/encounter/combat/defense/spend_defense_capacitor_charge';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'Defense capacitor recharge',
    () => {
        it(
            'spending a charge restarts recharge progress',
            () => {
                const {
                    state,
                } =
                    createAnchoredPlayerCombatTestSetup();

                const capacitor =
                    state.combat
                        .defenseCapacitor;

                if (!capacitor) {
                    throw new Error(
                        'Expected installed player defense capacitor',
                    );
                }

                capacitor.charges = 3;
                capacitor.rechargeElapsedMs = 12000;

                expect(
                    spendDefenseCapacitorCharge(
                        capacitor,
                    ),
                ).toMatchObject({
                    charges: 2,
                    rechargeElapsedMs: 0,
                });

                expect(
                    capacitor,
                ).toMatchObject({
                    charges: 2,
                    rechargeElapsedMs: 0,
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

                const playerCapacitor =
                    state.combat
                        .defenseCapacitor;

                const enemyCapacitor =
                    targetActor
                        .defenseCapacitor;

                if (
                    !playerCapacitor ||
                    !enemyCapacitor
                ) {
                    throw new Error(
                        'Expected installed defense capacitors',
                    );
                }

                const definition =
                    DEFENSE_CAPACITORS[
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00
                    ];

                playerCapacitor.charges = 2;
                playerCapacitor.rechargeElapsedMs = 0;

                enemyCapacitor.charges = 1;
                enemyCapacitor.rechargeElapsedMs = 0;

                engine.step(
                    definition
                        .rechargeDurationMs -
                        1,
                );

                expect(
                    playerCapacitor,
                ).toMatchObject({
                    charges: 2,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                expect(
                    enemyCapacitor,
                ).toMatchObject({
                    charges: 1,

                    rechargeElapsedMs:
                        definition
                            .rechargeDurationMs -
                        1,
                });

                engine.step(1);

                expect(
                    playerCapacitor,
                ).toMatchObject({
                    charges: 3,
                    rechargeElapsedMs: 0,
                });

                expect(
                    enemyCapacitor,
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
                    playerCapacitor,
                ).toMatchObject({
                    charges:
                        definition.capacity,

                    rechargeElapsedMs: 0,
                });

                expect(
                    enemyCapacitor,
                ).toMatchObject({
                    charges:
                        definition.capacity,

                    rechargeElapsedMs: 0,
                });
            },
        );
    },
);
