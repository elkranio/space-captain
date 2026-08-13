// src/engine/encounter/combat/intel/resolve_missile_signature_analysis.ts

import {
    MISSILE_SIGNATURE,
    type MissileSignature,
} from '../../../defs/missile';
import {
    MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE,
    type MissileSignatureAnalysisConfidence,
} from '../../model/missile_signature_analysis';
import {
    MISSILE_SIGNATURE_INTEL_STATUS,
    type ResolvedMissileSignatureIntel,
} from '../../model/missile_signature_intel';

export const MISSILE_SIGNATURE_ANALYSIS_PROFILE = {
    STANDARD: 'standard',
    IMPAIRED: 'impaired',
} as const;

export type MissileSignatureAnalysisProfile =
    (typeof MISSILE_SIGNATURE_ANALYSIS_PROFILE)[
        keyof typeof MISSILE_SIGNATURE_ANALYSIS_PROFILE
    ];

export type MissileSignatureAnalysisResult = {
    identification:
        ResolvedMissileSignatureIntel;

    confidence:
        MissileSignatureAnalysisConfidence;
};

type WeightedAnalysisOutcome = {
    upperBound: number;

    confidence:
        MissileSignatureAnalysisConfidence;

    correct: boolean;
};

// Initial hidden tuning.
//
// STANDARD:
// - 45% CERTAIN / confirmed;
// - 40% STRONG uncertain;
// - 15% WEAK uncertain;
// - overall hypothesis correctness ~84.5%.
//
// IMPAIRED:
// - 10% CERTAIN / confirmed;
// - 45% STRONG uncertain;
// - 45% WEAK uncertain;
// - overall hypothesis correctness ~55%.
//
// These are not UI probabilities and can be tuned without changing
// the missile intel contract.
const OUTCOMES_BY_PROFILE:
    Record<
        MissileSignatureAnalysisProfile,
        readonly WeightedAnalysisOutcome[]
    > = {
        [MISSILE_SIGNATURE_ANALYSIS_PROFILE.STANDARD]:
            [
                {
                    upperBound: 0.45,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .CERTAIN,
                    correct: true,
                },
                {
                    upperBound: 0.77,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .STRONG,
                    correct: true,
                },
                {
                    upperBound: 0.85,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .STRONG,
                    correct: false,
                },
                {
                    upperBound: 0.925,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .WEAK,
                    correct: true,
                },
                {
                    upperBound: 1,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .WEAK,
                    correct: false,
                },
            ],

        [MISSILE_SIGNATURE_ANALYSIS_PROFILE.IMPAIRED]:
            [
                {
                    upperBound: 0.10,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .CERTAIN,
                    correct: true,
                },
                {
                    upperBound: 0.37,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .STRONG,
                    correct: true,
                },
                {
                    upperBound: 0.55,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .STRONG,
                    correct: false,
                },
                {
                    upperBound: 0.73,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .WEAK,
                    correct: true,
                },
                {
                    upperBound: 1,
                    confidence:
                        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
                            .WEAK,
                    correct: false,
                },
            ],
    };

export function resolveMissileSignatureAnalysis({
    truth,
    profile,
    random,
}: {
    truth: MissileSignature;

    profile:
        MissileSignatureAnalysisProfile;

    random: () => number;
}): MissileSignatureAnalysisResult {
    const randomValue =
        random();

    if (
        !Number.isFinite(randomValue) ||
        randomValue < 0 ||
        randomValue >= 1
    ) {
        throw new Error(
            'Missile Science random source must return a value in [0, 1): ' +
                randomValue,
        );
    }

    const outcomes =
        OUTCOMES_BY_PROFILE[
            profile
        ];

    const outcome =
        outcomes.find(
            (candidate) => {
                return (
                    randomValue <
                    candidate.upperBound
                );
            },
        ) ??
        outcomes[
            outcomes.length - 1
        ];

    if (!outcome) {
        throw new Error(
            'Missile Science analysis profile has no outcomes: ' +
                profile,
        );
    }

    const hypothesis =
        outcome.correct
            ? truth
            : getOppositeSignature(
                  truth,
              );

    if (
        outcome.confidence ===
        MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
            .CERTAIN
    ) {
        return {
            identification: {
                status:
                    MISSILE_SIGNATURE_INTEL_STATUS
                        .CONFIRMED,

                hypothesis:
                    truth,
            },

            confidence:
                outcome.confidence,
        };
    }

    return {
        identification: {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .UNCERTAIN,

            hypothesis,
        },

        confidence:
            outcome.confidence,
    };
}

function getOppositeSignature(
    signature:
        MissileSignature,
): MissileSignature {
    switch (signature) {
        case MISSILE_SIGNATURE.A:
            return MISSILE_SIGNATURE.B;

        case MISSILE_SIGNATURE.B:
            return MISSILE_SIGNATURE.A;
    }
}
