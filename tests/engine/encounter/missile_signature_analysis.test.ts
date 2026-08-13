import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
import {
    MISSILE_SIGNATURE_ANALYSIS_PROFILE,
    resolveMissileSignatureAnalysis,
} from '../../../src/engine/encounter/combat/intel/resolve_missile_signature_analysis';
import {
    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE,
} from '../../../src/engine/encounter/model/missile_signature_analysis';
import {
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../src/engine/encounter/model/missile_signature_intel';

describe(
    'Missile signature analysis',
    () => {
        it(
            'confirms only a certain truthful result',
            () => {
                const result =
                    resolveMissileSignatureAnalysis({
                        truth:
                            MISSILE_SIGNATURE.B,

                        profile:
                            MISSILE_SIGNATURE_ANALYSIS_PROFILE
                                .STANDARD,

                        random:
                            () => 0,
                    });

                expect(result)
                    .toEqual({
                        confidence:
                            MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                                .CERTAIN,

                        identification: {
                            status:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .CONFIRMED,

                            hypothesis:
                                MISSILE_SIGNATURE.B,
                        },
                    });
            },
        );

        it.each([
            {
                label:
                    'strong correct',

                randomValue:
                    0.5,

                confidence:
                    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                        .STRONG,

                expectedHypothesis:
                    MISSILE_SIGNATURE.B,
            },
            {
                label:
                    'strong wrong',

                randomValue:
                    0.8,

                confidence:
                    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                        .STRONG,

                expectedHypothesis:
                    MISSILE_SIGNATURE.A,
            },
            {
                label:
                    'weak correct',

                randomValue:
                    0.9,

                confidence:
                    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                        .WEAK,

                expectedHypothesis:
                    MISSILE_SIGNATURE.B,
            },
            {
                label:
                    'weak wrong',

                randomValue:
                    0.99,

                confidence:
                    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                        .WEAK,

                expectedHypothesis:
                    MISSILE_SIGNATURE.A,
            },
        ])(
            'keeps $label analysis uncertain',
            ({
                randomValue,
                confidence,
                expectedHypothesis,
            }) => {
                // These random values are representative samples
                // of the current hidden tuning, not public
                // gameplay probability contracts.
                const result =
                    resolveMissileSignatureAnalysis({
                        truth:
                            MISSILE_SIGNATURE.B,

                        profile:
                            MISSILE_SIGNATURE_ANALYSIS_PROFILE
                                .STANDARD,

                        random:
                            () =>
                                randomValue,
                    });

                expect(result)
                    .toEqual({
                        confidence,

                        identification: {
                            status:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .UNCERTAIN,

                            hypothesis:
                                expectedHypothesis,
                        },
                    });
            },
        );

        it(
            'lets the impaired profile produce an uncertain wrong hypothesis',
            () => {
                const result =
                    resolveMissileSignatureAnalysis({
                        truth:
                            MISSILE_SIGNATURE.A,

                        profile:
                            MISSILE_SIGNATURE_ANALYSIS_PROFILE
                                .IMPAIRED,

                        // Current IMPAIRED sample:
                        // WEAK + wrong.
                        random:
                            () => 0.99,
                    });

                expect(result)
                    .toEqual({
                        confidence:
                            MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                                .WEAK,

                        identification: {
                            status:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .UNCERTAIN,

                            hypothesis:
                                MISSILE_SIGNATURE.B,
                        },
                    });
            },
        );

        it.each([
            -0.01,
            1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
        ])(
            'rejects invalid random value %s',
            (randomValue) => {
                expect(() => {
                    resolveMissileSignatureAnalysis({
                        truth:
                            MISSILE_SIGNATURE.A,

                        profile:
                            MISSILE_SIGNATURE_ANALYSIS_PROFILE
                                .STANDARD,

                        random:
                            () =>
                                randomValue,
                    });
                }).toThrow(
                    'Missile Science random source must return a value in [0, 1)',
                );
            },
        );
    },
);
