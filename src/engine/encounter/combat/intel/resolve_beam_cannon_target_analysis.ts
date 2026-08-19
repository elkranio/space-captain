// src/engine/encounter/combat/intel/resolve_beam_cannon_target_analysis.ts

import {
    BEAM_CANNON_TARGET_INTEL_STATUS,
    BEAM_CANNON_TARGET_NODE,
    type BeamCannonTargetIntel,
    type BeamCannonTargetNode,
} from "../../model/combat";

type ResolvedBeamCannonTargetIntel = Exclude<
    BeamCannonTargetIntel,
    {
        status: typeof BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN;
    }
>;

// Initial hidden tuning mirrors the simple player Science missile profile:
// - 45% confirmed truth;
// - 40% uncertain but correct hypothesis;
// - 15% uncertain wrong hypothesis.
//
// With two target nodes, the wrong branch always reports the other node.
// One analysis still consumes exactly one encounter RNG value.
export function resolveBeamCannonTargetAnalysis({
    truth,
    random,
}: {
    truth: BeamCannonTargetNode;
    random: () => number;
}): ResolvedBeamCannonTargetIntel {
    const randomValue = random();

    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
        throw new Error("Beam Cannon Science random source must return a value in [0, 1): " + randomValue);
    }

    if (randomValue < 0.45) {
        return {
            status: BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED,

            hypothesis: truth,
        };
    }

    if (randomValue < 0.85) {
        return {
            status: BEAM_CANNON_TARGET_INTEL_STATUS.UNCERTAIN,

            hypothesis: truth,
        };
    }

    return {
        status: BEAM_CANNON_TARGET_INTEL_STATUS.UNCERTAIN,

        hypothesis: getWrongHypothesis(truth),
    };
}

function getWrongHypothesis(truth: BeamCannonTargetNode): BeamCannonTargetNode {
    switch (truth) {
        case BEAM_CANNON_TARGET_NODE.HULL:
            return BEAM_CANNON_TARGET_NODE.DRIVE;

        case BEAM_CANNON_TARGET_NODE.DRIVE:
            return BEAM_CANNON_TARGET_NODE.HULL;
    }
}
