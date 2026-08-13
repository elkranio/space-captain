// src/engine/encounter/model/missile_signature_analysis.ts

export const MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE = {
    CERTAIN: 'certain',
    STRONG: 'strong',
    WEAK: 'weak',
} as const;

export type MissileSignatureAnalysisConfidence =
    (typeof MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE)[
        keyof typeof MISSILE_SIGNATURE_ANALYSIS_CONFIDENCE
    ];
