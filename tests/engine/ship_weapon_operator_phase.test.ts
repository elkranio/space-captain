// tests/engine/ship_weapon_operator_phase.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    doesShipWeaponPhaseRequireOperator,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';

describe(
    'Ship weapon operator phase',
    () => {
        it(
            'classifies every weapon phase',
            () => {
                expect(
                    Object.values(
                        SHIP_WEAPON_PHASE,
                    ).map((phase) => {
                        return [
                            phase,
                            doesShipWeaponPhaseRequireOperator(
                                phase,
                            ),
                        ];
                    }),
                ).toEqual([
                    [
                        SHIP_WEAPON_PHASE.READY,
                        false,
                    ],
                    [
                        SHIP_WEAPON_PHASE.TARGETING,
                        true,
                    ],
                    [
                        SHIP_WEAPON_PHASE.CHARGING,
                        true,
                    ],
                    [
                        SHIP_WEAPON_PHASE.CHANNELING,
                        true,
                    ],
                    [
                        SHIP_WEAPON_PHASE.COOLDOWN,
                        false,
                    ],
                ]);
            },
        );
    },
);
