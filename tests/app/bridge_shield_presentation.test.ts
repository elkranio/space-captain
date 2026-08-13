import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    BRIDGE_SHIELD_PRESENTATION,
    getBridgeShieldAbsorbFadeAlpha,
    getBridgeShieldAlpha,
} from '../../src/app/scenes/game/bridge/view/combat/bridge_shield_presentation';

describe(
    'bridge shield presentation',
    () => {
        it(
            'keeps stable alpha before the blink window and alternates inside it',
            () => {
                expect(
                    getBridgeShieldAlpha(
                        2000,
                    ),
                ).toBe(
                    BRIDGE_SHIELD_PRESENTATION
                        .baseAlpha,
                );

                expect(
                    getBridgeShieldAlpha(
                        1000,
                    ),
                ).toBe(
                    BRIDGE_SHIELD_PRESENTATION
                        .baseAlpha,
                );

                expect(
                    getBridgeShieldAlpha(
                        875,
                    ),
                ).toBe(
                    BRIDGE_SHIELD_PRESENTATION
                        .blinkDimAlpha,
                );

                expect(
                    getBridgeShieldAlpha(
                        750,
                    ),
                ).toBe(
                    BRIDGE_SHIELD_PRESENTATION
                        .baseAlpha,
                );
            },
        );

        it(
            'clamps shield time and absorb fade inputs at their visual boundaries',
            () => {
                expect(
                    getBridgeShieldAlpha(
                        -100,
                    ),
                ).toBe(
                    getBridgeShieldAlpha(
                        0,
                    ),
                );

                expect(
                    getBridgeShieldAbsorbFadeAlpha(
                        -20,
                    ),
                ).toBe(
                    1,
                );

                expect(
                    getBridgeShieldAbsorbFadeAlpha(
                        80,
                    ),
                ).toBe(
                    0.5,
                );

                expect(
                    getBridgeShieldAbsorbFadeAlpha(
                        160,
                    ),
                ).toBe(
                    0,
                );

                expect(
                    getBridgeShieldAbsorbFadeAlpha(
                        500,
                    ),
                ).toBe(
                    0,
                );
            },
        );
    },
);
