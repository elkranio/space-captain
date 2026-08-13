import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../../src/engine/defs/defense_turret';
import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
import {
    resolveMissileInterception,
} from '../../../src/engine/encounter/combat/defense_turret/resolve_missile_interception';

describe(
    'Missile interception resolver',
    () => {
        it(
            'guarantees a hit for a correct concrete hypothesis without rolling blind chance',
            () => {
                expect(
                    resolveMissileInterception({
                        truth:
                            MISSILE_SIGNATURE.A,

                        hypothesis:
                            MISSILE_SIGNATURE.A,

                        blindInterceptChance:
                            0,

                        random: () => {
                            throw new Error(
                                'Correct hypothesis must not use blind RNG',
                            );
                        },
                    }),
                ).toBe(
                    DEFENSE_TURRET_SHOT_OUTCOME
                        .HIT,
                );
            },
        );

        it.each([
            {
                label:
                    'unknown',

                hypothesis:
                    undefined,
            },
            {
                label:
                    'wrong hypothesis',

                hypothesis:
                    MISSILE_SIGNATURE.B,
            },
        ])(
            'uses blind equipment chance for $label',
            ({ hypothesis }) => {
                expect(
                    resolveMissileInterception({
                        truth:
                            MISSILE_SIGNATURE.A,

                        hypothesis,

                        blindInterceptChance:
                            0.4,

                        random:
                            () => 0.39,
                    }),
                ).toBe(
                    DEFENSE_TURRET_SHOT_OUTCOME
                        .HIT,
                );

                expect(
                    resolveMissileInterception({
                        truth:
                            MISSILE_SIGNATURE.A,

                        hypothesis,

                        blindInterceptChance:
                            0.4,

                        random:
                            () => 0.4,
                    }),
                ).toBe(
                    DEFENSE_TURRET_SHOT_OUTCOME
                        .MISS,
                );
            },
        );

        it.each([
            -0.01,
            1.01,
            Number.NaN,
        ])(
            'rejects invalid blind chance %s',
            (blindInterceptChance) => {
                expect(() => {
                    resolveMissileInterception({
                        truth:
                            MISSILE_SIGNATURE.A,

                        blindInterceptChance,

                        random:
                            () => 0,
                    });
                }).toThrow(
                    'Defense turret blind intercept chance must be in [0, 1]',
                );
            },
        );

        it.each([
            -0.01,
            1,
            Number.NaN,
        ])(
            'rejects invalid blind RNG %s',
            (randomValue) => {
                expect(() => {
                    resolveMissileInterception({
                        truth:
                            MISSILE_SIGNATURE.A,

                        blindInterceptChance:
                            0.4,

                        random:
                            () => randomValue,
                    });
                }).toThrow(
                    'Defense turret random source must return a value in [0, 1)',
                );
            },
        );
    },
);
